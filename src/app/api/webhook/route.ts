import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/services/meta";

// GET: Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Receive incoming messages and delivery status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("WEBHOOK RECEIVED:", JSON.stringify(body, null, 2));

    const supabase = await createAdminClient();

    if (body.event === "history") {
      await handleHistorySync(body, supabase);
      return NextResponse.json({ status: "ok" });
    }


    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        // Handle incoming messages
        if (value.messages) {
          for (const msg of value.messages) {
            const phone = `+${msg.from}`;
            const contact = value.contacts?.find(
              (c: { wa_id: string }) => c.wa_id === msg.from,
            );
            const name = contact?.profile?.name ?? null;
            const text = msg.text?.body ?? msg.caption ?? "[media]";
            const wamid = msg.id;

            const { data: upsertedContact } = await supabase
              .from("contacts")
              .upsert(
                { phone, name, last_message_at: new Date().toISOString() },
                { onConflict: "phone" },
              )
              .select("id, bot_enabled") // ← added bot_enabled
              .single();

            if (upsertedContact) {
              await supabase.from("messages").insert({
                contact_id: upsertedContact.id,
                wamid,
                direction: "inbound",
                content: text,
                status: "delivered",
                sent_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
                delivered_at: new Date().toISOString(),
              });

              await supabase
                .from("contacts")
                .update({
                  message_count: supabase.rpc ? undefined : undefined,
                  last_message_at: new Date().toISOString(),
                })
                .eq("id", upsertedContact.id);

              await supabase.rpc("increment_message_count", {
                contact_id: upsertedContact.id,
              });

              // ← added: canned bot reply if no human has taken over this contact
              if (upsertedContact.bot_enabled) {
                const canned =
                  "Thanks for reaching out! We've received your message and will get back to you shortly.";
                const { ok, wamid: botWamid } = await sendWhatsAppText(
                  phone,
                  canned,
                );

                if (ok) {
                  await supabase.from("messages").insert({
                    contact_id: upsertedContact.id,
                    wamid: botWamid,
                    direction: "outbound",
                    content: canned,
                    status: "sent",
                    sent_at: new Date().toISOString(),
                  });
                }
              }
            }
          }
        }

        // Handle delivery status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            const wamid = status.id;
            const newStatus: string = status.status;
            const now = new Date().toISOString();

            console.log("STATUS UPDATE:", wamid, newStatus);

            // Build update object for messages
            const messageUpdate: Record<string, string> = { status: newStatus };
            if (newStatus === "delivered") messageUpdate.delivered_at = now;
            if (newStatus === "read") {
              messageUpdate.delivered_at = now;
              messageUpdate.read_at = now;
            }

            // Update message status
            await supabase
              .from("messages")
              .update(messageUpdate)
              .eq("wamid", wamid);

            // Update campaign log status
            const { data: log } = await supabase
              .from("campaign_logs")
              .update({ ...messageUpdate })
              .eq("wamid", wamid)
              .select("campaign_id")
              .single();

            // Update campaign counts directly
            if (log?.campaign_id) {
              const campaignId = log.campaign_id;

              if (newStatus === "delivered") {
                await supabase.rpc("increment_campaign_count", {
                  p_campaign_id: campaignId,
                  p_field: "delivered_count",
                });
              } else if (newStatus === "read") {
                await supabase.rpc("increment_campaign_count", {
                  p_campaign_id: campaignId,
                  p_field: "read_count",
                });
              } else if (newStatus === "failed") {
                await supabase.rpc("increment_campaign_count", {
                  p_campaign_id: campaignId,
                  p_field: "failed_count",
                });
              }
            }
          }
        }

        // Handle messages sent from the client's phone (WhatsApp Business app)
        if (value.message_echoes) {
          for (const echo of value.message_echoes) {
            const phone = `+${echo.to}`;
            const text = echo.text?.body ?? "[media]";
            const wamid = echo.id;

            const { data: upsertedContact } = await supabase
              .from("contacts")
              .upsert(
                {
                  phone,
                  last_message_at: new Date().toISOString(),
                  bot_enabled: false,
                }, // ← added
                { onConflict: "phone" },
              )
              .select("id")
              .single();

            if (upsertedContact) {
              await supabase.from("messages").insert({
                contact_id: upsertedContact.id,
                wamid,
                direction: "outbound",
                content: text,
                status: "sent",
                sent_at: new Date(
                  parseInt(echo.timestamp) * 1000,
                ).toISOString(),
              });

              await supabase
                .from("contacts")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", upsertedContact.id);
            }
          }
        }

        // Handle contact sync from the WhatsApp Business app
        if (value.state_sync) {
          for (const entry of value.state_sync) {
            if (entry.type !== "contact") continue;

            const phone = `+${entry.contact.phone_number}`;
            const name =
              entry.contact.full_name ?? entry.contact.first_name ?? null;

            if (entry.action === "add") {
              await supabase
                .from("contacts")
                .upsert({ phone, name }, { onConflict: "phone" });
            } else if (entry.action === "remove") {
              // Judgment call — see note below
            }
          }
        }

        // Handle account-level events (onboarding status, restrictions, etc.)
        if (value.event) {
          console.log(
            "ACCOUNT_UPDATE EVENT:",
            value.event,
            JSON.stringify(value, null, 2),
          );
          // Once we see real event names from Meta in production, we can branch
          // here to update whatsapp_connection.status (e.g. mark 'restricted' or
          // 'banned') so the CRM UI can warn the client instead of silently
          // failing to send messages.
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}




// ↓↓↓ ADD THIS NEW FUNCTION HERE, AT THE END OF THE FILE ↓↓↓
async function handleHistorySync(
  body: { data: { history: any[] } },
  supabase: Awaited<ReturnType<typeof createAdminClient>>
) {
  for (const phase of body.data.history ?? []) {
    console.log("HISTORY PHASE:", phase.metadata?.phase, "chunk:", phase.metadata?.chunk_order);

    for (const thread of phase.threads ?? []) {
      const customerPhone = `+${thread.id}`;

      const { data: contact } = await supabase
        .from("contacts")
        .upsert({ phone: customerPhone }, { onConflict: "phone" })
        .select("id")
        .single();

      if (!contact) continue;

      for (const msg of thread.messages ?? []) {
        const isFromBusiness = Boolean(msg.to);
        const text = msg.text?.body ?? msg[msg.type]?.body ?? "[media]";

        await supabase.from("messages").upsert(
          {
            contact_id: contact.id,
            wamid: msg.id,
            direction: isFromBusiness ? "outbound" : "inbound",
            content: text,
            status: "delivered",
            sent_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
          },
          { onConflict: "wamid" }
        );
      }
    }
  }
}
