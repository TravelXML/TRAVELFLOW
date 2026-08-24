import { AccommodationType, Hotel, HotelAmbiance } from "../../types";
import { createRetryingClient } from "../../utils/apiClient";
import { env, providers } from "../../config/env";
import { logger } from "../../utils/logger";

export interface HotelSearchParams {
  destination: string;
  budgetPerNight: number;
  accommodationType: AccommodationType;
  ambiance: HotelAmbiance;
  maxDistanceFromCenterKm: number;
  maxDistanceFromAirportKm: number;
  minPricePerNight?: number;
  maxPricePerNight?: number;
}

export interface HotelProvider {
  search(params: HotelSearchParams): Promise<Hotel[]>;
}

const HOTEL_NAMES: Record<AccommodationType, string[]> = {
  budget: ["City Hostel", "Traveler's Inn", "Budget Suites", "Backpacker Lodge", "Metro Motel"],
  mid_range: ["Grand Plaza", "The Riverside", "Sunset Boutique", "Central Suites", "Harbor View Inn"],
  luxury: ["The Ritz Residence", "Grand Imperial Hotel", "The Peninsula Suites", "Royal Palm Resort", "The Langham"],
};

// Each name slot has a fixed "personality" so an ambiance filter has something
// real to match against, independent of price tier.
const AMBIANCE_BY_SLOT: HotelAmbiance[] = ["business", "quiet", "romantic", "family", "lively"];

// Multiplies budgetPerNight to land in the tier's realistic price band, and
// sets the rating floor so a "luxury" search doesn't return a 3-star hotel.
const TIER_PRICE_MULTIPLIER: Record<AccommodationType, number> = { budget: 0.35, mid_range: 0.7, luxury: 1.6 };
const TIER_RATING_FLOOR: Record<AccommodationType, number> = { budget: 3.0, mid_range: 3.8, luxury: 4.5 };

function matchesAmbiance(hotel: Hotel, accommodationType: AccommodationType, requested: HotelAmbiance): boolean {
  if (requested === "any") return true;
  if (requested === "luxury" && accommodationType === "luxury") return true;
  return hotel.ambiance === requested;
}

class MockHotelProvider implements HotelProvider {
  async search(params: HotelSearchParams): Promise<Hotel[]> {
    const { destination, budgetPerNight, accommodationType } = params;
    const priceMultiplier = TIER_PRICE_MULTIPLIER[accommodationType];
    const ratingFloor = TIER_RATING_FLOOR[accommodationType];
    const names = HOTEL_NAMES[accommodationType];

    const all: Hotel[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `mock-hotel-${destination}-${accommodationType}-${i}`,
      name: `${names[i % names.length]} ${destination}`,
      pricePerNight: Math.round(budgetPerNight * priceMultiplier * (0.8 + i * 0.15) * 100) / 100,
      rating: Math.round((ratingFloor + i * 0.1) * 10) / 10,
      address: `${100 + i} Main Street, ${destination}`,
      imageUrl: `https://picsum.photos/seed/hotel-${destination}-${i}/400/300`,
      // Spread across a realistic range rather than random, so results are
      // stable for the same search and still meaningfully filterable.
      distanceFromCenterKm: Math.round((0.3 + i * 1.8) * 10) / 10,
      distanceFromAirportKm: Math.round((3 + i * 6) * 10) / 10,
      ambiance: AMBIANCE_BY_SLOT[i % AMBIANCE_BY_SLOT.length],
    }));

    const matchesDistance = (h: Hotel) =>
      h.distanceFromCenterKm <= params.maxDistanceFromCenterKm && h.distanceFromAirportKm <= params.maxDistanceFromAirportKm;
    const matchesPrice = (h: Hotel) =>
      (params.minPricePerNight == null || h.pricePerNight >= params.minPricePerNight) &&
      (params.maxPricePerNight == null || h.pricePerNight <= params.maxPricePerNight);
    const matchesAmb = (h: Hotel) => matchesAmbiance(h, accommodationType, params.ambiance);

    // Relax constraints progressively rather than dropping all of them at
    // once - e.g. a "luxury" tier search with a $200-600/night range can't
    // be satisfied simultaneously, but the ambiance/distance asks still can.
    // Price is dropped first since accommodationType already targets a price
    // band; ambiance is dropped last since distance is usually the harder
    // requirement (a hotel can't move, but "romantic" is a soft preference).
    const attempts = [
      (h: Hotel) => matchesAmb(h) && matchesDistance(h) && matchesPrice(h),
      (h: Hotel) => matchesAmb(h) && matchesDistance(h),
      (h: Hotel) => matchesDistance(h),
      () => true,
    ];

    for (const attempt of attempts) {
      const matched = all.filter(attempt);
      if (matched.length > 0) return matched;
    }
    return all;
  }
}

class RapidApiHotelProvider implements HotelProvider {
  private client = createRetryingClient({
    baseURL: "https://hotels-com-provider.p.rapidapi.com",
    headers: {
      "x-rapidapi-key": env.RAPIDAPI_HOTELS_KEY,
      "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
    },
  });

  async search(params: HotelSearchParams): Promise<Hotel[]> {
    try {
      const response = await this.client.get("/v2/hotels/search", {
        params: {
          destination: params.destination,
          star_rating_tier: params.accommodationType,
          max_distance_from_center_km: params.maxDistanceFromCenterKm,
          max_distance_from_airport_km: params.maxDistanceFromAirportKm,
          price_min: params.minPricePerNight,
          price_max: params.maxPricePerNight,
          currency: "USD",
        },
      });

      return (response.data.hotels ?? [])
        .filter((h: any) => h.pricePerNight <= params.budgetPerNight * 1.5)
        .slice(0, 5)
        .map((h: any) => ({
          id: h.id,
          name: h.name,
          pricePerNight: h.pricePerNight,
          rating: h.rating,
          address: h.address,
          imageUrl: h.imageUrl,
          distanceFromCenterKm: h.distanceFromCenterKm,
          distanceFromAirportKm: h.distanceFromAirportKm,
          ambiance: h.ambiance ?? "any",
        }));
    } catch (err) {
      logger.error(`RapidAPI hotel search failed, falling back to mock data: ${(err as Error).message}`);
      return new MockHotelProvider().search(params);
    }
  }
}

export const hotelProvider: HotelProvider = providers.hasRapidApiHotels ? new RapidApiHotelProvider() : new MockHotelProvider();
