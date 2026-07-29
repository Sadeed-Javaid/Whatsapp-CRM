import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contact_id");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const supabase = await createAdminClient();

    if (contactId) {
      // Fetch messages for specific contact
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("contact_id", contactId)
        .order("sent_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Fetch latest message per contact (conversation list)
    const { data, error } = await supabase
      .from("contacts")
      .select(`
        *,
        messages(
          id,
          content,
          direction,
          status,
          sent_at
        )
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}
