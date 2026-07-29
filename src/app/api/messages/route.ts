import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/services/meta";

export async function POST(req: NextRequest) {
  try {
    const { contact_id, phone, message } = await req.json();

    if (!contact_id || !phone || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { ok, wamid, error } = await sendWhatsAppText(phone, message);

    if (!ok) {
      throw new Error(error ?? "Meta API failed");
    }

    const { data: savedMessage, error: msgError } = await supabase
      .from("messages")
      .insert({
        contact_id,
        direction: "outbound",
        content: message,
        wamid,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgError) throw new Error(msgError.message);

    await supabase
      .from("contacts")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", contact_id);

    return NextResponse.json({ success: true, message_id: savedMessage.id, wamid });
  } catch (err) {
    console.error("Message send error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contact_id");

    if (!contactId) {
      return NextResponse.json({ error: "contact_id required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("contact_id", contactId)
      .order("sent_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
