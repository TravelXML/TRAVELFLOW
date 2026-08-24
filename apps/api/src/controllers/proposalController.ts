import { Request, Response } from "express";
import { prisma } from "../config/database";
import { ApiError } from "../middleware/errorHandler";
import { createProposalSchema, updateProposalSchema } from "../utils/validators";
import { createProposal, sendProposal } from "../services/proposalService";
import { ProposalDetail, ProposalSummary } from "../types";

function toSummary(p: any): ProposalSummary {
  return {
    id: p.id,
    customerName: p.customerName,
    customerEmail: p.customerEmail,
    originName: p.originName,
    destinationName: p.destinationName,
    travelStartDate: p.travelStartDate.toISOString(),
    travelEndDate: p.travelEndDate.toISOString(),
    status: p.status,
    pdfUrl: p.pdfUrl,
    sentAt: p.sentAt?.toISOString() ?? null,
    openedAt: p.openedAt?.toISOString() ?? null,
    clickedAt: p.clickedAt?.toISOString() ?? null,
    bookedAt: p.bookedAt?.toISOString() ?? null,
    bookingValue: p.bookingValue ? Number(p.bookingValue) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

function toDetail(p: any): ProposalDetail {
  return {
    ...toSummary(p),
    numAdults: p.numAdults,
    numChildren: p.numChildren,
    childrenAges: Array.isArray(p.childrenAges) ? p.childrenAges : [],
    numSeniors: p.numSeniors,
    tripType: p.tripType,
    cabinClass: p.cabinClass,
    directFlightsOnly: p.directFlightsOnly,
    preferredAirlines: Array.isArray(p.preferredAirlines) ? p.preferredAirlines : [],
    accommodationType: p.accommodationType,
    numRooms: p.numRooms,
    hotelAmbiance: p.hotelAmbiance,
    maxDistanceFromCenterKm: p.maxDistanceFromCenterKm,
    maxDistanceFromAirportKm: p.maxDistanceFromAirportKm,
    priceRangeMin: p.priceRangeMin ? Number(p.priceRangeMin) : null,
    priceRangeMax: p.priceRangeMax ? Number(p.priceRangeMax) : null,
    pace: p.pace,
    specialOccasion: p.specialOccasion,
    dietaryRestrictions: Array.isArray(p.dietaryRestrictions) ? p.dietaryRestrictions : [],
    accessibilityNeeds: p.accessibilityNeeds,
    specialRequests: p.specialRequests,
    budgetTotal: p.budgetTotal ? Number(p.budgetTotal) : null,
    preferences: Array.isArray(p.preferences) ? p.preferences : [],
    itineraryJson: p.itineraryJson ?? null,
    selectedFlight: p.selectedFlight ?? null,
    selectedHotel: p.selectedHotel ?? null,
    selectedActivities: Array.isArray(p.selectedActivities) ? p.selectedActivities : [],
    trackingLinks: (p.trackingLinks ?? []).map((l: any) => ({
      id: l.id,
      shortUrl: l.shortUrl,
      originalUrl: l.originalUrl,
      affiliateProgram: l.affiliateProgram,
      itemType: l.itemType,
      itemName: l.itemName,
      itemPrice: l.itemPrice ? Number(l.itemPrice) : null,
      clicks: l.clicks,
      conversions: l.conversions,
      revenue: Number(l.revenue),
    })),
  };
}

export async function create(req: Request, res: Response) {
  const input = createProposalSchema.parse(req.body);
  const { proposal } = await createProposal(req.userId!, {
    ...input,
    travelStartDate: input.travelStartDate,
    travelEndDate: input.travelEndDate,
  });
  res.status(201).json(toDetail(proposal));
}

export async function list(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where = { userId: req.userId!, deletedAt: null, ...(status ? { status } : {}) };

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    prisma.proposal.count({ where }),
  ]);

  res.json({ proposals: proposals.map(toSummary), total });
}

export async function getById(req: Request, res: Response) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { trackingLinks: true },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");
  res.json(toDetail(proposal));
}

export async function update(req: Request, res: Response) {
  const input = updateProposalSchema.parse(req.body);
  const existing = await prisma.proposal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) throw new ApiError(404, "Proposal not found");

  const updated = await prisma.proposal.update({ where: { id: existing.id }, data: input });
  res.json(toSummary(updated));
}

export async function remove(req: Request, res: Response) {
  const existing = await prisma.proposal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) throw new ApiError(404, "Proposal not found");

  await prisma.proposal.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  res.status(204).send();
}

export async function send(req: Request, res: Response) {
  const result = await sendProposal(req.params.id, req.userId!);
  res.json(result);
}
