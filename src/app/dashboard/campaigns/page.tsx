import { createClient } from "@/lib/supabase/server";
import { CampaignSender } from "@/components/campaign/campaign-sender";
import { CampaignTable } from "@/components/campaign/campaign-table";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Send bulk WhatsApp messages using templates</p>
        </div>
        <CampaignSender />
      </div>

      <CampaignTable campaigns={campaigns ?? []} />
    </div>
  );
}
