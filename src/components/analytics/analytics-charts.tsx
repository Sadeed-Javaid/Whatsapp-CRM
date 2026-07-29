"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  dailyMessages: { date: string; count: number }[];
  campaignPerf: {
    name: string;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    failed_count: number;
  }[];
}

const tooltipStyle = {
  backgroundColor: "hsl(224 50% 7%)",
  border: "1px solid hsl(224 50% 14%)",
  borderRadius: "12px",
  color: "hsl(210 40% 98%)",
  fontSize: "12px",
};

export function AnalyticsCharts({ dailyMessages, campaignPerf }: Props) {
  const normalizedPerf = campaignPerf.map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name,
    Sent: c.sent_count,
    Delivered: c.delivered_count,
    Read: c.read_count,
    Failed: c.failed_count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Messages */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-6">Messages Over Time</h3>
        {dailyMessages.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyMessages} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 50% 14%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(142 76% 36%)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name="Messages"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                fill="url(#colorMessages)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Campaign Performance */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-6">Campaign Performance</h3>
        {normalizedPerf.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No campaigns yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={normalizedPerf} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 50% 14%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 16% 47%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Sent" fill="hsl(215 20% 65%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Delivered" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Read" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Failed" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
