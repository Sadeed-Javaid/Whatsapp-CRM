// import { NextRequest, NextResponse } from "next/server";
// import { createAdminClient } from "@/lib/supabase/server";

// const GRAPH_VERSION = process.env.NEXT_PUBLIC_GRAPH_API_VERSION || "v25.0";
// const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID!;
// const APP_SECRET = process.env.FB_APP_SECRET!;

// export async function POST(req: NextRequest) {
//   try {
//     const { code, wabaId, phoneNumberId } = await req.json();

//     if (!code || !wabaId || !phoneNumberId) {
//       return NextResponse.json(
//         { error: "Missing code, wabaId, or phoneNumberId" },
//         { status: 400 }
//       );
//     }

//     const tokenRes = await fetch(
//       `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
//         new URLSearchParams({
//           client_id: APP_ID,
//           client_secret: APP_SECRET,
//           code,
//         })
//     );
//     const tokenData = await tokenRes.json();

//     if (!tokenData.access_token) {
//       console.error("Token exchange failed:", tokenData);
//       return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
//     }

//     const supabase = await createAdminClient();

//     // Mark any previous connection as disconnected first
//     await supabase
//       .from("whatsapp_connection")
//       .update({ status: "disconnected", updated_at: new Date().toISOString() })
//       .eq("status", "connected");

//     // Insert the new active connection
//     const { error } = await supabase.from("whatsapp_connection").insert({
//       waba_id: wabaId,
//       phone_number_id: phoneNumberId,
//       access_token: tokenData.access_token,
//       status: "connected",
//     });

//     if (error) {
//       console.error("Supabase insert error:", error);
//       return NextResponse.json({ error: "Failed to save connection" }, { status: 500 });
//     }

//     return NextResponse.json({ success: true, wabaId, phoneNumberId });
//   } catch (err) {
//     console.error("exchange-code error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }





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

    // Step 1: Exchange the code for a short-lived access token
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

    // Step 2 (NEW): Exchange short-lived token for a long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: tokenData.access_token,
        })
    );
    const longLivedData = await longLivedRes.json();

    const finalAccessToken = longLivedData.access_token || tokenData.access_token;

    if (!longLivedData.access_token) {
      console.warn("Long-lived token exchange failed, falling back to short-lived token:", longLivedData);
    }

    // Step 3 (NEW): Subscribe your app to this client's WABA webhooks
    const subscribeRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${finalAccessToken}`,
        },
      }
    );
    const subscribeData = await subscribeRes.json();

    if (!subscribeData.success) {
      console.error("Webhook subscription failed:", subscribeData);
      // Not returning an error here — connection can still be saved,
      // but flag this clearly since webhooks won't work without it.
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
      access_token: finalAccessToken,
      status: "connected",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save connection" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      wabaId,
      phoneNumberId,
      webhookSubscribed: !!subscribeData.success,
    });
  } catch (err) {
    console.error("exchange-code error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}