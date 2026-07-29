import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

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

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }

    const supabase = await createAdminClient();

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        // Handle incoming messages
        if (value.messages) {
          for (const msg of value.messages) {
            const phone = `+${msg.from}`;
            const contact = value.contacts?.find((c: { wa_id: string }) => c.wa_id === msg.from);
            const name = contact?.profile?.name ?? null;
            const text = msg.text?.body ?? msg.caption ?? "[media]";
            const wamid = msg.id;

            // Upsert contact
            const { data: upsertedContact } = await supabase
              .from("contacts")
              .upsert(
                { phone, name, last_message_at: new Date().toISOString() },
                { onConflict: "phone" }
              )
              .select("id")
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

              // Increment message count
              await supabase
                .from("contacts")
                .update({
                  message_count: supabase.rpc ? undefined : undefined,
                  last_message_at: new Date().toISOString(),
                })
                .eq("id", upsertedContact.id);

              // Use raw SQL increment
              await supabase.rpc("increment_message_count", { contact_id: upsertedContact.id });
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
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
