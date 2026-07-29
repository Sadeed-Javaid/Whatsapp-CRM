const META_API = "https://graph.facebook.com/v19.0";

export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  templateLanguage: string
) {
  const res = await fetch(`${META_API}/${process.env.META_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
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
  const res = await fetch(`${META_API}/${process.env.META_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
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
