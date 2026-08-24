import { Request, Response } from "express";
import { getOverview, getAnalytics } from "../services/dashboardService";

export async function overview(req: Request, res: Response) {
  res.json(await getOverview(req.userId!));
}

export async function analytics(req: Request, res: Response) {
  const period = String(req.query.period ?? "30d");
  const days = Number(period.replace(/[^0-9]/g, "")) || 30;
  res.json(await getAnalytics(req.userId!, days));
}
