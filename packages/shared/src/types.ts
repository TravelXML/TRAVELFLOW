// Canonical domain types shared between apps/api and apps/web.
// Imported by relative path (no build step) - see README for why.

export type SubscriptionTier = "starter" | "professional" | "elite";
export type ProposalStatus = "draft" | "sent" | "opened" | "clicked" | "booked";
export type AffiliateProgram = "booking" | "getyourguide" | "skyscanner";
export type ItemType = "flight" | "hotel" | "activity";

export type TripType = "round_trip" | "one_way";
export type CabinClass = "economy" | "premium_economy" | "business" | "first";
export type AccommodationType = "budget" | "mid_range" | "luxury";
export type TripPace = "relaxed" | "moderate" | "packed";
export type SpecialOccasion = "none" | "honeymoon" | "anniversary" | "birthday" | "family_reunion";
export type DietaryRestriction = "vegetarian" | "vegan" | "halal" | "kosher" | "gluten_free";
export type HotelAmbiance = "any" | "romantic" | "family" | "business" | "quiet" | "lively" | "luxury";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  brandingLogoUrl: string | null;
  brandingPrimaryColor: string;
  brandingSecondaryColor: string;
  brandingAgencyName: string | null;
  subscriptionTier: SubscriptionTier;
  proposalsMonthCount: number;
  proposalsMonthLimit: number;
}

export interface Flight {
  id: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  price: number;
  airline: string;
  stops: number;
}

export interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  rating: number;
  address: string;
  imageUrl: string;
  distanceFromCenterKm: number;
  distanceFromAirportKm: number;
  ambiance: HotelAmbiance;
}

export interface Activity {
  id: string;
  title: string;
  price: number;
  rating: number;
  durationHours: number;
  imageUrl: string;
}

export interface ItineraryScheduleItem {
  time: string;
  activity: string;
  duration: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  schedule: ItineraryScheduleItem[];
}

export interface ItineraryJson {
  title: string;
  summary: string;
  totalCost: number;
  days: ItineraryDay[];
}

export interface CreateProposalInput {
  customerName: string;
  customerEmail: string;
  origin: string;
  destination: string;
  travelStartDate: string;
  travelEndDate: string;
  numAdults: number;
  numChildren: number;
  childrenAges: number[];
  numSeniors: number;
  tripType: TripType;
  cabinClass: CabinClass;
  directFlightsOnly: boolean;
  preferredAirlines: string[];
  accommodationType: AccommodationType;
  numRooms: number;
  hotelAmbiance: HotelAmbiance;
  maxDistanceFromCenterKm: number;
  maxDistanceFromAirportKm: number;
  priceRangeMin: number;
  priceRangeMax: number;
  pace: TripPace;
  specialOccasion: SpecialOccasion;
  dietaryRestrictions: DietaryRestriction[];
  accessibilityNeeds: string;
  specialRequests: string;
  budget: number;
  preferences: string[];
}

export interface ProposalSummary {
  id: string;
  customerName: string;
  customerEmail: string;
  originName: string;
  destinationName: string;
  travelStartDate: string;
  travelEndDate: string;
  status: ProposalStatus;
  pdfUrl: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bookedAt: string | null;
  bookingValue: number | null;
  createdAt: string;
}

export interface ProposalDetail extends ProposalSummary {
  numAdults: number;
  numChildren: number;
  childrenAges: number[];
  numSeniors: number;
  tripType: TripType;
  cabinClass: CabinClass;
  directFlightsOnly: boolean;
  preferredAirlines: string[];
  accommodationType: AccommodationType;
  numRooms: number;
  hotelAmbiance: HotelAmbiance;
  maxDistanceFromCenterKm: number;
  maxDistanceFromAirportKm: number;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  pace: TripPace;
  specialOccasion: SpecialOccasion;
  dietaryRestrictions: DietaryRestriction[];
  accessibilityNeeds: string | null;
  specialRequests: string | null;
  budgetTotal: number | null;
  preferences: string[];
  itineraryJson: ItineraryJson | null;
  selectedFlight: Flight | null;
  selectedHotel: Hotel | null;
  selectedActivities: Activity[];
  trackingLinks: TrackingLinkSummary[];
}

export interface TrackingLinkSummary {
  id: string;
  shortUrl: string;
  originalUrl: string;
  affiliateProgram: AffiliateProgram | null;
  itemType: ItemType | null;
  itemName: string | null;
  itemPrice: number | null;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface DashboardOverview {
  totalProposals: number;
  totalSent: number;
  totalOpened: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  avgRevenuePerProposal: number;
}

export interface DashboardTrendPoint {
  date: string;
  count: number;
}

export interface DashboardAnalytics {
  proposalsSentTrend: DashboardTrendPoint[];
  conversionsTrend: DashboardTrendPoint[];
  revenueTrend: { date: string; amount: number }[];
  topDestinations: { name: string; proposals: number; conversions: number }[];
}
