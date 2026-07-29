import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const [
      { data: messages },
      { count: totalContacts },
      { count: totalCampaigns },
    ] = await Promise.all([
      supabase.from("messages").select("status"),
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("campaigns").select("*", { count: "exact", head: true }),
    ]);

    const total = messages?.length ?? 0;
    const delivered = messages?.filter((m) => ["delivered", "read"].includes(m.status)).length ?? 0;
    const read = messages?.filter((m) => m.status === "read").length ?? 0;
    const failed = messages?.filter((m) => m.status === "failed").length ?? 0;

    return NextResponse.json({
      total_messages: total,
      total_contacts: totalContacts ?? 0,
      total_campaigns: totalCampaigns ?? 0,
      delivered_rate: total > 0 ? (delivered / total) * 100 : 0,
      read_rate: total > 0 ? (read / total) * 100 : 0,
      failed_rate: total > 0 ? (failed / total) * 100 : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
