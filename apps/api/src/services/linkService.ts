import { nanoid } from "nanoid";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { AffiliateProgram, CabinClass, Flight, Hotel, Activity, ItemType } from "../types";

export async function createTrackingLink(params: {
  proposalId: string;
  userId: string;
  originalUrl: string;
  affiliateProgram?: AffiliateProgram;
  itemId?: string;
  itemType?: ItemType;
  itemName?: string;
  itemPrice?: number;
  utmCampaign?: string;
}) {
  const shortCode = nanoid(8);

  return prisma.trackingLink.create({
    data: {
      proposalId: params.proposalId,
      userId: params.userId,
      originalUrl: params.originalUrl,
      shortUrl: `${env.PUBLIC_API_URL}/track/${shortCode}`,
      affiliateProgram: params.affiliateProgram,
      itemId: params.itemId,
      itemType: params.itemType,
      itemName: params.itemName,
      itemPrice: params.itemPrice,
      utmCampaign: params.utmCampaign ?? params.proposalId,
    },
  });
}

// Deep links to each partner's public search results, personalized with the
// specific item's details and (when set) the agent's affiliate ID. These are
// search-results URLs rather than exact-item permalinks - none of the three
// programs expose a stable public "book this exact listing" URL without a
// signed partner API session, so a pre-filled search is the honest approximation.

export function buildFlightBookingUrl(
  flight: Flight,
  params: { origin: string; destination: string; numAdults: number; numChildren: number; cabinClass: CabinClass; tripType: "round_trip" | "one_way" },
  affiliateId: string | null | undefined
): string {
  const url = new URL("https://www.skyscanner.com/transport/flights/results");
  url.searchParams.set("from", params.origin);
  url.searchParams.set("to", params.destination);
  url.searchParams.set("depart", flight.departure.split("T")[0]);
  url.searchParams.set("adults", String(params.numAdults));
  if (params.numChildren > 0) url.searchParams.set("children", String(params.numChildren));
  url.searchParams.set("cabinclass", params.cabinClass);
  url.searchParams.set("ttype", params.tripType);
  url.searchParams.set("preferdirect", flight.stops === 0 ? "true" : "false");
  if (affiliateId) url.searchParams.set("associateid", affiliateId);
  return url.toString();
}

export function buildHotelBookingUrl(
  hotel: Hotel,
  params: { checkIn: Date; checkOut: Date; numAdults: number; numChildren: number; numRooms: number },
  affiliateId: string | null | undefined
): string {
  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", hotel.name);
  url.searchParams.set("checkin", params.checkIn.toISOString().split("T")[0]);
  url.searchParams.set("checkout", params.checkOut.toISOString().split("T")[0]);
  url.searchParams.set("group_adults", String(params.numAdults));
  if (params.numChildren > 0) url.searchParams.set("group_children", String(params.numChildren));
  url.searchParams.set("no_rooms", String(params.numRooms));
  if (affiliateId) url.searchParams.set("aid", affiliateId);
  return url.toString();
}

export function buildActivityBookingUrl(activity: Activity, destination: string, affiliateId: string | null | undefined): string {
  const url = new URL("https://www.getyourguide.com/s/");
  url.searchParams.set("q", `${activity.title} ${destination}`);
  if (affiliateId) url.searchParams.set("partner_id", affiliateId);
  return url.toString();
}

export async function recordClick(shortCode: string) {
  const shortUrl = `${env.PUBLIC_API_URL}/track/${shortCode}`;
  const link = await prisma.trackingLink.findUnique({ where: { shortUrl } });
  if (!link) return null;

  const now = new Date();
  await prisma.trackingLink.update({
    where: { id: link.id },
    data: {
      clicks: { increment: 1 },
      firstClickedAt: link.firstClickedAt ?? now,
      lastClickedAt: now,
    },
  });

  await prisma.proposal.updateMany({
    where: { id: link.proposalId, clickedAt: null },
    data: { clickedAt: now, status: "clicked" },
  });

  return link;
}

export async function recordConversion(shortCode: string, revenue: number) {
  const shortUrl = `${env.PUBLIC_API_URL}/track/${shortCode}`;
  const link = await prisma.trackingLink.findUnique({ where: { shortUrl } });
  if (!link) return null;

  await prisma.trackingLink.update({
    where: { id: link.id },
    data: {
      conversions: { increment: 1 },
      revenue: { increment: revenue },
    },
  });

  await prisma.proposal.update({
    where: { id: link.proposalId },
    data: { status: "booked", bookedAt: new Date(), bookingValue: revenue },
  });

  return link;
}
