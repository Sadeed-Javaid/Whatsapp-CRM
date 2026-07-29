import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/analytics/stat-card";
import { MessageSquare, Users, Megaphone, TrendingUp, CheckCheck, XCircle } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { RecentCampaigns } from "@/components/campaign/recent-campaigns";

async function getOverviewStats() {
  const supabase = await createClient();

  const [
    { count: totalMessages },
    { count: totalContacts },
    { count: totalCampaigns },
    { data: statusCounts },
  ] = await Promise.all([
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("status"),
  ]);

  const delivered = statusCounts?.filter((m) => m.status === "delivered").length ?? 0;
  const read = statusCounts?.filter((m) => m.status === "read").length ?? 0;
  const failed = statusCounts?.filter((m) => m.status === "failed").length ?? 0;
  const total = statusCounts?.length ?? 1;

  return {
    totalMessages: totalMessages ?? 0,
    totalContacts: totalContacts ?? 0,
    totalCampaigns: totalCampaigns ?? 0,
    deliveredRate: (delivered / total) * 100,
    readRate: (read / total) * 100,
    failedRate: (failed / total) * 100,
  };
}

export default async function DashboardPage() {
  const stats = await getOverviewStats();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Good to see you back</h2>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your campaigns.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={MessageSquare}
          className="col-span-2 xl:col-span-1"
        />
        <StatCard
          label="Contacts"
          value={stats.totalContacts.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Campaigns"
          value={stats.totalCampaigns.toLocaleString()}
          icon={Megaphone}
        />
        <StatCard
          label="Delivered"
          value={formatPercent(stats.deliveredRate)}
          icon={CheckCheck}
          variant="success"
        />
        <StatCard
          label="Read Rate"
          value={formatPercent(stats.readRate)}
          icon={TrendingUp}
          variant="info"
        />
        <StatCard
          label="Failed"
          value={formatPercent(stats.failedRate)}
          icon={XCircle}
          variant="danger"
        />
      </div>

      <RecentCampaigns />
    </div>
  );
}
