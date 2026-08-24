import { CabinClass, Flight, TripType } from "../../types";
import { createRetryingClient } from "../../utils/apiClient";
import { env, providers } from "../../config/env";
import { logger } from "../../utils/logger";

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: Date;
  returnDate: Date;
  budget: number;
  cabinClass: CabinClass;
  tripType: TripType;
  directOnly: boolean;
  preferredAirlines: string[];
}

export interface FlightProvider {
  search(params: FlightSearchParams): Promise<Flight[]>;
}

const AIRLINES = ["Delta", "United", "Emirates", "Singapore Airlines", "Qatar Airways", "British Airways"];

// Real-world fare ratios relative to economy for the same route/date.
const CABIN_CLASS_MULTIPLIER: Record<CabinClass, number> = {
  economy: 1,
  premium_economy: 1.6,
  business: 3.2,
  first: 5.5,
};

// A one-way fare is usually more than half of round-trip, not exactly half.
const TRIP_TYPE_MULTIPLIER: Record<TripType, number> = {
  round_trip: 1,
  one_way: 0.58,
};

class MockFlightProvider implements FlightProvider {
  async search(params: FlightSearchParams): Promise<Flight[]> {
    const { origin, destination, departDate, budget, cabinClass, tripType, directOnly, preferredAirlines } = params;
    const fareMultiplier = CABIN_CLASS_MULTIPLIER[cabinClass] * TRIP_TYPE_MULTIPLIER[tripType];

    // Put preferred airlines first in the rotation so they land on the
    // cheaper (lower-index) slots, then fill the rest with everything else.
    const airlineOrder =
      preferredAirlines.length > 0
        ? [...preferredAirlines, ...AIRLINES.filter((a) => !preferredAirlines.includes(a))]
        : AIRLINES;

    const results: Flight[] = Array.from({ length: 5 }).map((_, i) => {
      const basePrice = budget * (0.15 + i * 0.08);
      const price = Math.round(basePrice * fareMultiplier * 100) / 100;
      const departure = new Date(departDate);
      departure.setHours(6 + i * 3);
      const arrival = new Date(departure.getTime() + (4 + i) * 60 * 60 * 1000);

      return {
        id: `mock-flight-${origin}-${destination}-${i}`,
        departure: departure.toISOString(),
        arrival: arrival.toISOString(),
        durationMinutes: (4 + i) * 60,
        price,
        airline: airlineOrder[i % airlineOrder.length],
        stops: i % 3,
      };
    });

    return results
      .filter((f) => !directOnly || f.stops === 0)
      .filter((f) => f.price <= budget * fareMultiplier * 1.5)
      .sort((a, b) => Number(preferredAirlines.includes(b.airline)) - Number(preferredAirlines.includes(a.airline)))
      .slice(0, 5);
  }
}

class SkyscannerFlightProvider implements FlightProvider {
  private client = createRetryingClient({
    baseURL: "https://skyscanner-api.p.rapidapi.com",
    headers: {
      "x-rapidapi-key": env.SKYSCANNER_API_KEY,
      "x-rapidapi-host": "skyscanner-api.p.rapidapi.com",
    },
  });

  // origin/destination arrive here as free-text "City, Country" from the proposal
  // form; Skyscanner's real API expects IATA/entity codes, so a production
  // integration needs a city-name -> code lookup in front of this call.
  async search(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const response = await this.client.get("/v2/flights/live/search/create", {
        params: {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departDate.toISOString().split("T")[0],
          return_date: params.tripType === "round_trip" ? params.returnDate.toISOString().split("T")[0] : undefined,
          cabin_class: params.cabinClass,
          preferred_carriers: params.preferredAirlines.join(",") || undefined,
          currency: "USD",
        },
      });

      return (response.data.itineraries ?? [])
        .filter((f: any) => !params.directOnly || f.stops_count === 0)
        .filter((f: any) => f.price.amount <= params.budget)
        .slice(0, 5)
        .map((f: any) => ({
          id: f.id,
          departure: f.departure_date_time_utc,
          arrival: f.arrival_date_time_utc,
          durationMinutes: f.duration_in_minutes,
          price: f.price.amount,
          airline: f.marketing_carrier.name,
          stops: f.stops_count,
        }));
    } catch (err) {
      logger.error(`Skyscanner search failed, falling back to mock data: ${(err as Error).message}`);
      return new MockFlightProvider().search(params);
    }
  }
}

export const flightProvider: FlightProvider = providers.hasSkyscanner ? new SkyscannerFlightProvider() : new MockFlightProvider();
