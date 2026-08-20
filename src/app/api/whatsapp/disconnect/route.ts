import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const GRAPH_VERSION = process.env.NEXT_PUBLIC_GRAPH_API_VERSION || "v25.0";

export async function POST() {
  try {
    const supabase = await createAdminClient();

    // Step 1: Get the currently active connection
    const { data: connection, error: fetchError } = await supabase
      .from("whatsapp_connection")
      .select("waba_id, access_token")
      .eq("status", "connected")
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "No active WhatsApp connection found" },
        { status: 404 }
      );
    }

    // Step 2: Tell Meta to stop sending webhook events for this WABA
    const unsubscribeRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${connection.waba_id}/subscribed_apps`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },
      }
    );
    const unsubscribeData = await unsubscribeRes.json();

    if (!unsubscribeData.success) {
      console.warn("Meta unsubscribe failed:", unsubscribeData);
      // Not blocking the disconnect on this — still proceed to mark
      // disconnected in our DB so the CRM stops using a stale token.
    }

    // Step 3: Mark the connection as disconnected in Supabase
    const { error: updateError } = await supabase
      .from("whatsapp_connection")
      .update({ status: "disconnected", updated_at: new Date().toISOString() })
      .eq("status", "connected");

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update connection status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metaUnsubscribed: !!unsubscribeData.success,
    });
  } catch (err) {
    console.error("Disconnect error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}