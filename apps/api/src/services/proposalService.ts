import { prisma } from "../config/database";
import { cacheGetOrSet } from "../config/redis";
import { ApiError } from "../middleware/errorHandler";
import { CreateProposalDTO } from "../utils/validators";
import { flightProvider } from "./providers/flightProvider";
import { hotelProvider } from "./providers/hotelProvider";
import { activityProvider } from "./providers/activityProvider";
import { generateItinerary } from "./itineraryService";
import { generateProposalPdf } from "./pdfService";
import { createTrackingLink, buildFlightBookingUrl, buildHotelBookingUrl, buildActivityBookingUrl } from "./linkService";
import { emailQueue } from "../jobs/emailQueue";
import { logger } from "../utils/logger";
import { Activity, CabinClass, Flight, Hotel, TripType } from "../types";

export async function createProposal(userId: string, input: CreateProposalDTO) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.proposalsMonthCount >= user.proposalsMonthLimit) {
    throw new ApiError(403, `Monthly proposal limit of ${user.proposalsMonthLimit} reached for your plan`);
  }

  const numDays = Math.max(
    1,
    Math.ceil((input.travelEndDate.getTime() - input.travelStartDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const budgetPerDay = input.budget / numDays;

  const cacheKey = [
    "search",
    input.origin,
    input.destination,
    input.travelStartDate.toISOString().split("T")[0],
    input.budget,
    input.cabinClass,
    input.tripType,
    input.directFlightsOnly,
    input.preferredAirlines.join(","),
    input.accommodationType,
    input.hotelAmbiance,
    input.maxDistanceFromCenterKm,
    input.maxDistanceFromAirportKm,
    input.priceRangeMin,
    input.priceRangeMax,
  ].join(":");

  const [flights, hotels, activities] = await cacheGetOrSet(cacheKey, 86_400, () =>
    Promise.all([
      flightProvider.search({
        origin: input.origin,
        destination: input.destination,
        departDate: input.travelStartDate,
        returnDate: input.travelEndDate,
        budget: input.budget,
        cabinClass: input.cabinClass,
        tripType: input.tripType,
        directOnly: input.directFlightsOnly,
        preferredAirlines: input.preferredAirlines,
      }),
      hotelProvider.search({
        destination: input.destination,
        budgetPerNight: budgetPerDay * 0.5,
        accommodationType: input.accommodationType,
        ambiance: input.hotelAmbiance,
        maxDistanceFromCenterKm: input.maxDistanceFromCenterKm,
        maxDistanceFromAirportKm: input.maxDistanceFromAirportKm,
        minPricePerNight: input.priceRangeMin,
        maxPricePerNight: input.priceRangeMax,
      }),
      activityProvider.search(input.destination, input.preferences),
    ])
  );

  const itinerary = await generateItinerary({
    destination: input.destination,
    startDate: input.travelStartDate,
    endDate: input.travelEndDate,
    numAdults: input.numAdults,
    numChildren: input.numChildren,
    childrenAges: input.childrenAges,
    numSeniors: input.numSeniors,
    budget: input.budget,
    preferences: input.preferences,
    cabinClass: input.cabinClass,
    preferredAirlines: input.preferredAirlines,
    accommodationType: input.accommodationType,
    numRooms: input.numRooms,
    hotelAmbiance: input.hotelAmbiance,
    pace: input.pace,
    specialOccasion: input.specialOccasion,
    dietaryRestrictions: input.dietaryRestrictions,
    accessibilityNeeds: input.accessibilityNeeds,
    specialRequests: input.specialRequests,
    flights,
    hotels,
    activities,
  });

  // Pick one flight and one hotel to actually recommend for booking - cheapest
  // of each, matching the assumption baked into the mock itinerary's cost
  // estimate and its "transfer to {hotel}" day-1 text. Activities are shown as
  // a shortlist rather than one pick, since a trip usually books several.
  const selectedFlight = pickCheapest(flights);
  const selectedHotel = pickCheapest(hotels, (h) => h.pricePerNight);
  const selectedActivities = activities.slice(0, 4);

  const proposal = await prisma.$transaction(async (tx) => {
    const created = await tx.proposal.create({
      data: {
        userId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        originName: input.origin,
        destinationName: input.destination,
        travelStartDate: input.travelStartDate,
        travelEndDate: input.travelEndDate,
        numAdults: input.numAdults,
        numChildren: input.numChildren,
        childrenAges: input.childrenAges as any,
        numSeniors: input.numSeniors,
        tripType: input.tripType,
        cabinClass: input.cabinClass,
        directFlightsOnly: input.directFlightsOnly,
        preferredAirlines: input.preferredAirlines as any,
        accommodationType: input.accommodationType,
        numRooms: input.numRooms,
        hotelAmbiance: input.hotelAmbiance,
        maxDistanceFromCenterKm: input.maxDistanceFromCenterKm,
        maxDistanceFromAirportKm: input.maxDistanceFromAirportKm,
        priceRangeMin: input.priceRangeMin ?? null,
        priceRangeMax: input.priceRangeMax ?? null,
        pace: input.pace,
        specialOccasion: input.specialOccasion,
        dietaryRestrictions: input.dietaryRestrictions as any,
        accessibilityNeeds: input.accessibilityNeeds || null,
        specialRequests: input.specialRequests || null,
        preferences: input.preferences,
        budgetTotal: input.budget,
        itineraryJson: itinerary as any,
        selectedFlight: (selectedFlight ?? null) as any,
        selectedHotel: (selectedHotel ?? null) as any,
        selectedActivities: selectedActivities as any,
        status: "draft",
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { proposalsMonthCount: { increment: 1 } },
    });

    return created;
  });

  logger.info(`Created proposal ${proposal.id} for user ${userId}`);
  return { proposal, flights, hotels, activities };
}

export async function sendProposal(proposalId: string, userId: string) {
  const proposal = await prisma.proposal.findFirst({ where: { id: proposalId, userId } });
  if (!proposal) throw new ApiError(404, "Proposal not found");
  if (!proposal.itineraryJson) throw new ApiError(400, "Proposal has no generated itinerary yet");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Tracking links are created before the PDF so the PDF's "Book now" buttons
  // can link straight to them (and therefore get click/conversion credit too).
  const bookingLinks = await createBookingLinksForProposal(proposal, userId, user);

  const pdfUrl = await generateProposalPdf({
    proposalId: proposal.id,
    itinerary: proposal.itineraryJson as any,
    customerName: proposal.customerName,
    destination: proposal.destinationName,
    numTravelers: proposal.numAdults + proposal.numChildren + proposal.numSeniors,
    numChildren: proposal.numChildren,
    numSeniors: proposal.numSeniors,
    cabinClass: proposal.cabinClass,
    preferredAirlines: Array.isArray(proposal.preferredAirlines) ? (proposal.preferredAirlines as string[]) : [],
    accommodationType: proposal.accommodationType,
    numRooms: proposal.numRooms,
    hotelAmbiance: proposal.hotelAmbiance,
    specialOccasion: proposal.specialOccasion,
    dietaryRestrictions: Array.isArray(proposal.dietaryRestrictions) ? (proposal.dietaryRestrictions as string[]) : [],
    accessibilityNeeds: proposal.accessibilityNeeds,
    agencyName: user.brandingAgencyName,
    primaryColor: user.brandingPrimaryColor,
    secondaryColor: user.brandingSecondaryColor,
    bookingLinks,
  });

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { pdfUrl, status: "sent", sentAt: new Date() },
  });

  await emailQueue.add({
    proposalId: proposal.id,
    userId,
    customerName: proposal.customerName,
    customerEmail: proposal.customerEmail,
    destinationName: proposal.destinationName,
    pdfUrl,
    agencyName: user.brandingAgencyName,
  });

  logger.info(`Queued email for proposal ${proposal.id}`);
  return { status: "sent", sentAt: new Date() };
}

function pickCheapest<T>(items: T[], priceOf: (item: T) => number = (item) => (item as any).price): T | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) => priceOf(a) - priceOf(b))[0];
}

export interface BookingLink {
  category: "flight" | "hotel" | "activity";
  label: string;
  price: number | null;
  bookUrl: string;
  note?: string;
}

async function createBookingLinksForProposal(
  proposal: {
    id: string;
    originName: string;
    destinationName: string;
    travelStartDate: Date;
    travelEndDate: Date;
    numAdults: number;
    numChildren: number;
    numSeniors: number;
    numRooms: number;
    cabinClass: string;
    tripType: string;
    selectedFlight: unknown;
    selectedHotel: unknown;
    selectedActivities: unknown;
  },
  userId: string,
  user: { bookingComAffiliateId: string | null; getYourGuideAffiliateId: string | null; skyscannerAffiliateId: string | null }
): Promise<BookingLink[]> {
  const bookingLinks: BookingLink[] = [];

  const flight = proposal.selectedFlight as Flight | null;
  if (flight) {
    const originalUrl = buildFlightBookingUrl(
      flight,
      {
        origin: proposal.originName,
        destination: proposal.destinationName,
        numAdults: proposal.numAdults + proposal.numSeniors,
        numChildren: proposal.numChildren,
        cabinClass: proposal.cabinClass as CabinClass,
        tripType: proposal.tripType as TripType,
      },
      user.skyscannerAffiliateId
    );
    const link = await createTrackingLink({
      proposalId: proposal.id,
      userId,
      originalUrl,
      affiliateProgram: "skyscanner",
      itemId: flight.id,
      itemType: "flight",
      itemName: `${flight.airline} - ${proposal.originName} to ${proposal.destinationName}`,
      itemPrice: flight.price,
    });
    bookingLinks.push({ category: "flight", label: `${flight.airline} flight`, price: flight.price, bookUrl: link.shortUrl });
  }

  const hotel = proposal.selectedHotel as Hotel | null;
  if (hotel) {
    const originalUrl = buildHotelBookingUrl(
      hotel,
      {
        checkIn: proposal.travelStartDate,
        checkOut: proposal.travelEndDate,
        numAdults: proposal.numAdults + proposal.numSeniors,
        numChildren: proposal.numChildren,
        numRooms: proposal.numRooms,
      },
      user.bookingComAffiliateId
    );
    const link = await createTrackingLink({
      proposalId: proposal.id,
      userId,
      originalUrl,
      affiliateProgram: "booking",
      itemId: hotel.id,
      itemType: "hotel",
      itemName: hotel.name,
      itemPrice: hotel.pricePerNight,
    });
    bookingLinks.push({
      category: "hotel",
      label: hotel.name,
      price: hotel.pricePerNight,
      bookUrl: link.shortUrl,
      note: `${hotel.distanceFromCenterKm}km from center, ${hotel.distanceFromAirportKm}km from airport`,
    });
  }

  const activities = (proposal.selectedActivities as Activity[] | null) ?? [];
  for (const activity of activities) {
    const originalUrl = buildActivityBookingUrl(activity, proposal.destinationName, user.getYourGuideAffiliateId);
    const link = await createTrackingLink({
      proposalId: proposal.id,
      userId,
      originalUrl,
      affiliateProgram: "getyourguide",
      itemId: activity.id,
      itemType: "activity",
      itemName: activity.title,
      itemPrice: activity.price,
    });
    bookingLinks.push({ category: "activity", label: activity.title, price: activity.price, bookUrl: link.shortUrl });
  }

  return bookingLinks;
}
