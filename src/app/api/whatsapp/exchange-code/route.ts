import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const GRAPH_VERSION = process.env.NEXT_PUBLIC_GRAPH_API_VERSION || "v25.0";
const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID!;
const APP_SECRET = process.env.FB_APP_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { code, wabaId, phoneNumberId } = await req.json();

    if (!code || !wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Missing code, wabaId, or phoneNumberId" },
        { status: 400 }
      );
    }

    const tokenRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          client_id: APP_ID,
          client_secret: APP_SECRET,
          code,
        })
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Mark any previous connection as disconnected first
    await supabase
      .from("whatsapp_connection")
      .update({ status: "disconnected", updated_at: new Date().toISOString() })
      .eq("status", "connected");

    // Insert the new active connection
    const { error } = await supabase.from("whatsapp_connection").insert({
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      access_token: tokenData.access_token,
      status: "connected",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save connection" }, { status: 500 });
    }

    return NextResponse.json({ success: true, wabaId, phoneNumberId });
  } catch (err) {
    console.error("exchange-code error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}