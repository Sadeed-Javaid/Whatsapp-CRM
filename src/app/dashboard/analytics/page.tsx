import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { StatCard } from "@/components/analytics/stat-card";
import { MessageSquare, Users, Megaphone, CheckCheck, BookOpen, XCircle } from "lucide-react";
import { formatPercent } from "@/lib/utils";

async function getAnalytics() {
  const supabase = await createClient();

  const [
    { data: messages },
    { count: totalContacts },
    { count: totalCampaigns },
    { data: dailyMessages },
    { data: campaignPerf },
  ] = await Promise.all([
    supabase.from("messages").select("status, sent_at"),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.rpc("get_messages_by_day"),
    supabase
      .from("campaigns")
      .select("name, sent_count, delivered_count, read_count, failed_count")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const total = messages?.length ?? 0;
  const delivered = messages?.filter((m) => m.status === "delivered" || m.status === "read").length ?? 0;
  const read = messages?.filter((m) => m.status === "read").length ?? 0;
  const failed = messages?.filter((m) => m.status === "failed").length ?? 0;

  return {
    totalMessages: total,
    totalContacts: totalContacts ?? 0,
    totalCampaigns: totalCampaigns ?? 0,
    deliveredRate: total > 0 ? (delivered / total) * 100 : 0,
    readRate: total > 0 ? (read / total) * 100 : 0,
    failedRate: total > 0 ? (failed / total) * 100 : 0,
    dailyMessages: dailyMessages ?? [],
    campaignPerf: campaignPerf ?? [],
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Message performance and campaign insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Messages" value={data.totalMessages.toLocaleString()} icon={MessageSquare} className="col-span-2 xl:col-span-1" />
        <StatCard label="Contacts" value={data.totalContacts.toLocaleString()} icon={Users} />
        <StatCard label="Campaigns" value={data.totalCampaigns.toLocaleString()} icon={Megaphone} />
        <StatCard label="Delivered" value={formatPercent(data.deliveredRate)} icon={CheckCheck} variant="success" />
        <StatCard label="Read Rate" value={formatPercent(data.readRate)} icon={BookOpen} variant="info" />
        <StatCard label="Failed" value={formatPercent(data.failedRate)} icon={XCircle} variant="danger" />
      </div>

      <AnalyticsCharts dailyMessages={data.dailyMessages} campaignPerf={data.campaignPerf} />
    </div>
  );
}
