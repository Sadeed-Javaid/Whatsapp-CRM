import { createClient } from "@/lib/supabase/server";
import { ContactsTable } from "@/components/contacts/contacts-table";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: contacts, count } = await supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{count ?? 0} total contacts</p>
      </div>

      <ContactsTable contacts={contacts ?? []} />
    </div>
  );
}
