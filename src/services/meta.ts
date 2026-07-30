import { createAdminClient } from "@/lib/supabase/server";

const META_API = `https://graph.facebook.com/${process.env.NEXT_PUBLIC_GRAPH_API_VERSION || "v25.0"}`;

async function getActiveConnection() {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("whatsapp_connection")
    .select("phone_number_id, access_token")
    .eq("status", "connected")
    .single();

  if (error || !data) {
    throw new Error("No active WhatsApp connection found");
  }

  return data;
}

export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  templateLanguage: string
) {
  const { phone_number_id, access_token } = await getActiveConnection();

  const res = await fetch(`${META_API}/${phone_number_id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace("+", ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage },
      },
    }),
  });

  const data = await res.json();
  return {
    ok: res.ok,
    wamid: data.messages?.[0]?.id ?? null,
    error: data.error?.message ?? null,
  };
}

export async function sendWhatsAppText(phone: string, message: string) {
  const { phone_number_id, access_token } = await getActiveConnection();

  const res = await fetch(`${META_API}/${phone_number_id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace("+", ""),
      type: "text",
      text: { body: message },
    }),
  });

  const data = await res.json();
  return {
    ok: res.ok,
    wamid: data.messages?.[0]?.id ?? null,
    error: data.error?.message ?? null,
  };
}