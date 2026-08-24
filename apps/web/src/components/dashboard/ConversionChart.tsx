import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardAnalytics } from "../../types";
import { Card, CardTitle } from "../common/Card";

const SERIES_BLUE = "#2a78d6";
const SERIES_AQUA = "#1baf7a";
const MUTED_INK = "#898781";
const GRIDLINE = "#e1e0d9";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mergeByDate(sent: { date: string; count: number }[], conversions: { date: string; count: number }[]) {
  const map = new Map<string, { date: string; sent: number; conversions: number }>();

  for (const point of sent) {
    map.set(point.date, { date: point.date, sent: point.count, conversions: 0 });
  }
  for (const point of conversions) {
    const existing = map.get(point.date) ?? { date: point.date, sent: 0, conversions: 0 };
    existing.conversions = point.count;
    map.set(point.date, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function ConversionChart({ data }: { data: Pick<DashboardAnalytics, "proposalsSentTrend" | "conversionsTrend"> }) {
  const merged = mergeByDate(data.proposalsSentTrend, data.conversionsTrend);

  return (
    <Card>
      <CardTitle>Proposals sent vs. bookings</CardTitle>
      <div className="mt-4 h-64">
        {merged.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={merged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={GRIDLINE} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: MUTED_INK, fontSize: 12 }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: MUTED_INK, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip labelFormatter={(label) => formatDate(String(label))} contentStyle={{ borderRadius: 8, border: "1px solid " + GRIDLINE, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: MUTED_INK }} />
              <Bar dataKey="sent" name="Sent" fill={SERIES_BLUE} radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
              <Bar dataKey="conversions" name="Booked" fill={SERIES_AQUA} radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No activity in this period yet</div>
        )}
      </div>
    </Card>
  );
}
