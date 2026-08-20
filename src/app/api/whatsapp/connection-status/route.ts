import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("whatsapp_connection")
      .select("phone_number_id")
      .eq("status", "connected")
      .single();

    return NextResponse.json({ connected: !!data });
  } catch {
    return NextResponse.json({ connected: false });
  }
}