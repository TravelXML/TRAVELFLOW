import { prisma } from "../config/database";
import { DashboardAnalytics, DashboardOverview } from "../types";

export async function getOverview(userId: string): Promise<DashboardOverview> {
  const [totalProposals, totalSent, totalOpened, bookedProposals] = await Promise.all([
    prisma.proposal.count({ where: { userId } }),
    prisma.proposal.count({ where: { userId, sentAt: { not: null } } }),
    prisma.proposal.count({ where: { userId, openedAt: { not: null } } }),
    prisma.proposal.findMany({ where: { userId, status: "booked" }, select: { bookingValue: true } }),
  ]);

  const totalConversions = bookedProposals.length;
  const totalRevenue = bookedProposals.reduce((sum, p) => sum + Number(p.bookingValue ?? 0), 0);
  const conversionRate = totalSent > 0 ? totalConversions / totalSent : 0;
  const avgRevenuePerProposal = totalProposals > 0 ? totalRevenue / totalProposals : 0;

  return {
    totalProposals,
    totalSent,
    totalOpened,
    totalConversions,
    totalRevenue,
    conversionRate,
    avgRevenuePerProposal,
  };
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function getAnalytics(userId: string, periodDays: number): Promise<DashboardAnalytics> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const proposals = await prisma.proposal.findMany({
    where: { userId, createdAt: { gte: since } },
    select: {
      createdAt: true,
      sentAt: true,
      bookedAt: true,
      bookingValue: true,
      destinationName: true,
      status: true,
    },
  });

  const sentTrendMap = new Map<string, number>();
  const conversionTrendMap = new Map<string, number>();
  const revenueTrendMap = new Map<string, number>();
  const destinationMap = new Map<string, { proposals: number; conversions: number }>();

  for (const p of proposals) {
    if (p.sentAt) {
      const key = dateKey(p.sentAt);
      sentTrendMap.set(key, (sentTrendMap.get(key) ?? 0) + 1);
    }
    if (p.bookedAt) {
      const key = dateKey(p.bookedAt);
      conversionTrendMap.set(key, (conversionTrendMap.get(key) ?? 0) + 1);
      revenueTrendMap.set(key, (revenueTrendMap.get(key) ?? 0) + Number(p.bookingValue ?? 0));
    }

    const dest = destinationMap.get(p.destinationName) ?? { proposals: 0, conversions: 0 };
    dest.proposals += 1;
    if (p.status === "booked") dest.conversions += 1;
    destinationMap.set(p.destinationName, dest);
  }

  const toSeries = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

  return {
    proposalsSentTrend: toSeries(sentTrendMap),
    conversionsTrend: toSeries(conversionTrendMap),
    revenueTrend: Array.from(revenueTrendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount })),
    topDestinations: Array.from(destinationMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.proposals - a.proposals)
      .slice(0, 5),
  };
}
