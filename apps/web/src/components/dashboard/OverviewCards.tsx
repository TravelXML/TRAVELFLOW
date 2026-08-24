import { DashboardOverview } from "../../types";
import { Card, CardTitle } from "../common/Card";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function OverviewCards({ data }: { data: DashboardOverview }) {
  const cards = [
    { title: "Proposals sent", value: data.totalSent },
    { title: "Conversion rate", value: formatPercent(data.conversionRate) },
    { title: "Total revenue", value: formatCurrency(data.totalRevenue) },
    { title: "Avg. revenue / proposal", value: formatCurrency(data.avgRevenuePerProposal) },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardTitle>{card.title}</CardTitle>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
        </Card>
      ))}
    </div>
  );
}
