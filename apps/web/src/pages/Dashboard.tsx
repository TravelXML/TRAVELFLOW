import { useOverview, useAnalytics } from "../hooks/useAnalytics";
import { OverviewCards } from "../components/dashboard/OverviewCards";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { ConversionChart } from "../components/dashboard/ConversionChart";
import { Card, CardTitle } from "../components/common/Card";

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useOverview();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics("30d");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Last 30 days</p>
      </div>

      {overviewLoading || !overview ? (
        <div className="text-sm text-slate-400">Loading overview...</div>
      ) : (
        <OverviewCards data={overview} />
      )}

      {analyticsLoading || !analytics ? (
        <div className="text-sm text-slate-400">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart data={analytics.revenueTrend} />
          <ConversionChart data={analytics} />
        </div>
      )}

      {analytics && analytics.topDestinations.length > 0 && (
        <Card>
          <CardTitle>Top destinations</CardTitle>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Destination</th>
                <th className="pb-2 font-medium">Proposals</th>
                <th className="pb-2 font-medium">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topDestinations.map((d) => (
                <tr key={d.name} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{d.name}</td>
                  <td className="py-2">{d.proposals}</td>
                  <td className="py-2">{d.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
