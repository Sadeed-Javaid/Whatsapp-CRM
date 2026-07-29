import { createClient } from "@/lib/supabase/server";
import { InboxClient } from "@/components/chat/inbox-client";

export default async function InboxPage() {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  return <InboxClient initialContacts={contacts ?? []} />;
}
