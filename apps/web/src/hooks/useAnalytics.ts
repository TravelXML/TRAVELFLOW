import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardAnalytics, DashboardOverview } from "../types";

export function useOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>("/dashboard/overview");
      return data;
    },
  });
}

export function useAnalytics(period = "30d") {
  return useQuery({
    queryKey: ["dashboard", "analytics", period],
    queryFn: async () => {
      const { data } = await api.get<DashboardAnalytics>("/dashboard/analytics", { params: { period } });
      return data;
    },
  });
}
