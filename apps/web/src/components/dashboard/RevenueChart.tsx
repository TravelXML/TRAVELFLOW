import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardAnalytics } from "../../types";
import { Card, CardTitle } from "../common/Card";

const SERIES_BLUE = "#2a78d6";
const MUTED_INK = "#898781";
const GRIDLINE = "#e1e0d9";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RevenueChart({ data }: { data: DashboardAnalytics["revenueTrend"] }) {
  const hasData = data.length > 0;

  return (
    <Card>
      <CardTitle>Revenue over time</CardTitle>
      <div className="mt-4 h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_BLUE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={SERIES_BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRIDLINE} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: MUTED_INK, fontSize: 12 }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fill: MUTED_INK, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                labelFormatter={(label) => formatDate(String(label))}
                contentStyle={{ borderRadius: 8, border: "1px solid " + GRIDLINE, fontSize: 13 }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={SERIES_BLUE}
                strokeWidth={2}
                fill="url(#revenueFill)"
                dot={{ r: 4, fill: SERIES_BLUE, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No booked revenue yet</div>
        )}
      </div>
    </Card>
  );
}
