import Anthropic from "@anthropic-ai/sdk";
import {
  AccommodationType,
  Activity,
  CabinClass,
  DietaryRestriction,
  Flight,
  Hotel,
  HotelAmbiance,
  ItineraryJson,
  SpecialOccasion,
  TripPace,
} from "../types";
import { env, providers } from "../config/env";
import { logger } from "../utils/logger";

interface GenerateItineraryParams {
  destination: string;
  startDate: Date;
  endDate: Date;
  numAdults: number;
  numChildren: number;
  childrenAges: number[];
  numSeniors: number;
  budget: number;
  preferences: string[];
  cabinClass: CabinClass;
  preferredAirlines: string[];
  accommodationType: AccommodationType;
  numRooms: number;
  hotelAmbiance: HotelAmbiance;
  pace: TripPace;
  specialOccasion: SpecialOccasion;
  dietaryRestrictions: DietaryRestriction[];
  accessibilityNeeds: string;
  specialRequests: string;
  flights: Flight[];
  hotels: Hotel[];
  activities: Activity[];
}

const OCCASION_LABEL: Record<SpecialOccasion, string | null> = {
  none: null,
  honeymoon: "honeymoon",
  anniversary: "anniversary",
  birthday: "birthday",
  family_reunion: "family reunion",
};

// Items per day the mock itinerary schedules beyond the fixed
// breakfast/lunch/dinner anchors - relaxed trips leave more open time.
const PACE_ACTIVITY_SLOTS: Record<TripPace, number> = { relaxed: 1, moderate: 2, packed: 3 };

// Children are commonly discounted on tours and often share a room rather
// than needing their own, so they don't count as a full adult for cost math.
const CHILD_ACTIVITY_DISCOUNT = 0.5;
const CHILD_FLIGHT_DISCOUNT = 0.25;

// Senior discounts are smaller and less universal than child discounts, but
// common enough on tours/attractions and some carriers to model here.
const SENIOR_ACTIVITY_DISCOUNT = 0.15;
const SENIOR_FLIGHT_DISCOUNT = 0.1;

function formatHour(time: number): string {
  // Long activities can push the running clock past 24 - normalize back into
  // a 0-23 range so e.g. hour 24 renders as "12:00 AM", not "12:00 PM".
  const hour = ((Math.floor(time) % 24) + 24) % 24;
  const minute = time % 1 === 0 ? "00" : "30";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

function numDays(params: GenerateItineraryParams): number {
  return Math.max(1, Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildPrompt(params: GenerateItineraryParams): string {
  const occasion = OCCASION_LABEL[params.specialOccasion];

  return `You are a travel expert creating a personalized itinerary.

Destination: ${params.destination}
Duration: ${numDays(params)} days
Travelers: ${params.numAdults} adult(s)${params.numChildren > 0 ? `, ${params.numChildren} child(ren) aged ${params.childrenAges.join(", ")}` : ""}${
    params.numSeniors > 0 ? `, ${params.numSeniors} senior(s)` : ""
  }
Budget: $${params.budget}
Cabin class: ${params.cabinClass.replace("_", " ")}${params.preferredAirlines.length ? ` (preferred airline(s): ${params.preferredAirlines.join(", ")})` : ""}
Accommodation: ${params.accommodationType.replace("_", " ")} (${params.numRooms} room(s))${
    params.hotelAmbiance !== "any" ? `, ${params.hotelAmbiance} ambiance` : ""
  }
Pace: ${params.pace}
${occasion ? `Special occasion: ${occasion} - include a fitting touch (e.g. a special dinner or upgrade moment)\n` : ""}${
    params.dietaryRestrictions.length ? `Dietary restrictions: ${params.dietaryRestrictions.join(", ")} - only suggest compatible restaurants/meals\n` : ""
  }${params.accessibilityNeeds ? `Accessibility needs: ${params.accessibilityNeeds}\n` : ""}${
    params.specialRequests ? `Special requests: ${params.specialRequests}\n` : ""
  }Preferences: ${params.preferences.join(", ") || "none specified"}

Available Flights:
${params.flights.map((f) => `- ${f.airline} ${f.departure} -> ${f.arrival} ($${f.price})`).join("\n")}

Available Hotels:
${params.hotels.map((h) => `- ${h.name} ($${h.pricePerNight}/night, Rating: ${h.rating})`).join("\n")}

Available Activities:
${params.activities.map((a) => `- ${a.title} ($${a.price}, Rating: ${a.rating})`).join("\n")}

Create a detailed day-by-day itinerary paced for a "${params.pace}" trip (relaxed = light schedule with open time, packed = full days). Respond ONLY with valid JSON matching exactly this shape, no markdown fences, no commentary:
{
  "title": "string",
  "summary": "string",
  "totalCost": number,
  "days": [
    { "day": number, "title": "string", "schedule": [ { "time": "string", "activity": "string", "duration": "string" } ] }
  ]
}`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

async function generateWithClaude(params: GenerateItineraryParams): Promise<ItineraryJson> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{ role: "user", content: buildPrompt(params) }],
  });

  const block = message.content[0];
  const responseText = block.type === "text" ? block.text : "";
  return extractJson(responseText) as ItineraryJson;
}

function mealNote(params: GenerateItineraryParams): string {
  return params.dietaryRestrictions.length > 0 ? ` (${params.dietaryRestrictions.join("/")}-friendly)` : "";
}

function generateMockItinerary(params: GenerateItineraryParams): ItineraryJson {
  const days = numDays(params);
  const cheapestHotel = [...params.hotels].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  const cheapestFlight = [...params.flights].sort((a, b) => a.price - b.price)[0];
  const occasion = OCCASION_LABEL[params.specialOccasion];
  const activitySlots = PACE_ACTIVITY_SLOTS[params.pace];
  const meal = mealNote(params);
  const familyNote = params.numChildren > 0 ? ", family-friendly" : "";

  const itineraryDays = Array.from({ length: days }).map((_, i) => {
    const dayNum = i + 1;
    const sliceStart = (i * activitySlots) % Math.max(params.activities.length, 1);
    let dayActivities = params.activities.slice(sliceStart, sliceStart + activitySlots);
    // A near-full-day excursion doesn't fit alongside other activities without
    // the schedule running past midnight - give it the day to itself.
    const fullDayActivity = dayActivities.find((a) => a.durationHours >= 6);
    if (fullDayActivity) dayActivities = [fullDayActivity];

    if (dayNum === 1) {
      return {
        day: dayNum,
        title: "Arrival & Orientation",
        schedule: [
          { time: "10:00 AM", activity: `Arrive in ${params.destination}, transfer to ${cheapestHotel?.name ?? "hotel"}`, duration: "2 hours" },
          { time: "2:00 PM", activity: `Check in (${params.numRooms} room(s)) and rest`, duration: "1 hour" },
          { time: "4:00 PM", activity: `Explore the neighborhood around ${cheapestHotel?.name ?? "your hotel"}${familyNote}`, duration: "3 hours" },
          {
            time: "7:30 PM",
            activity: occasion ? `Special ${occasion} welcome dinner${meal}` : `Welcome dinner at a local restaurant${meal}`,
            duration: "2 hours",
          },
        ],
      };
    }

    if (dayNum === days) {
      return {
        day: dayNum,
        title: "Departure",
        schedule: [
          { time: "9:00 AM", activity: `Breakfast${meal} and check out`, duration: "1 hour" },
          { time: "11:00 AM", activity: "Last-minute souvenir shopping", duration: "2 hours" },
          { time: "2:00 PM", activity: `Transfer to airport for ${params.cabinClass.replace("_", " ")} departure`, duration: "2 hours" },
        ],
      };
    }

    // Times are tracked as decimal hours and only ever move forward, so lunch
    // and evening leisure can never overlap a still-running activity - the
    // fixed "2:00 PM lunch" this replaced would collide once `pace` scheduled
    // long or multiple activities before it.
    const morningCount = Math.ceil(dayActivities.length / 2) || (dayActivities.length === 0 ? 1 : 0);
    const morningActivities = dayActivities.length > 0 ? dayActivities.slice(0, morningCount) : [undefined];
    const afternoonActivities = dayActivities.slice(morningCount);

    const schedule = [{ time: "9:00 AM", activity: `Breakfast at the hotel${meal}`, duration: "1 hour" }];
    let time = 10.5;

    for (const activity of morningActivities) {
      schedule.push({
        time: formatHour(time),
        activity: activity ? activity.title : `Guided tour of ${params.destination}${familyNote}`,
        duration: activity ? `${activity.durationHours} hours` : "3 hours",
      });
      time += (activity?.durationHours ?? 3) + 0.5;
    }

    time = Math.max(time, 13);
    schedule.push({ time: formatHour(time), activity: `Lunch and free time${meal}`, duration: "1.5 hours" });
    time += 1.5;

    for (const activity of afternoonActivities) {
      schedule.push({ time: formatHour(time), activity: activity.title, duration: `${activity.durationHours} hours` });
      time += activity.durationHours + 0.5;
    }

    time = Math.max(time, 18);
    schedule.push({ time: formatHour(time), activity: `Evening leisure in ${params.destination}${meal}`, duration: "2 hours" });

    return { day: dayNum, title: dayActivities[0] ? dayActivities[0].title : `${params.destination} Exploration Day`, schedule };
  });

  const activitiesPerAdultCost = params.activities.slice(0, days * activitySlots).reduce((sum, a) => sum + a.price, 0);
  const activitiesCost =
    activitiesPerAdultCost * params.numAdults +
    activitiesPerAdultCost * CHILD_ACTIVITY_DISCOUNT * params.numChildren +
    activitiesPerAdultCost * (1 - SENIOR_ACTIVITY_DISCOUNT) * params.numSeniors;
  const flightCost =
    (cheapestFlight?.price ?? 0) * params.numAdults +
    (cheapestFlight?.price ?? 0) * (1 - CHILD_FLIGHT_DISCOUNT) * params.numChildren +
    (cheapestFlight?.price ?? 0) * (1 - SENIOR_FLIGHT_DISCOUNT) * params.numSeniors;
  const hotelCost = (cheapestHotel?.pricePerNight ?? 0) * params.numRooms * (days - 1);
  const totalCost = Math.round(flightCost + hotelCost + activitiesCost);

  const travelerParts = [
    `${params.numAdults} adult(s)`,
    params.numChildren > 0 ? `${params.numChildren} child(ren)` : null,
    params.numSeniors > 0 ? `${params.numSeniors} senior(s)` : null,
  ].filter(Boolean);
  const travelerText = travelerParts.join(", ");

  return {
    title: `${days}-Day${occasion ? ` ${occasion.charAt(0).toUpperCase() + occasion.slice(1)}` : ""} Itinerary in ${params.destination}`,
    summary: `A ${days}-day, ${params.pace}-paced trip to ${params.destination} for ${travelerText}, staying in ${params.accommodationType.replace(
      "_",
      " "
    )} accommodation and tailored around ${params.preferences.join(", ") || "a balanced mix of sightseeing and relaxation"}.`,
    totalCost,
    days: itineraryDays,
  };
}

export async function generateItinerary(params: GenerateItineraryParams): Promise<ItineraryJson> {
  if (!providers.hasClaude) {
    return generateMockItinerary(params);
  }

  try {
    return await generateWithClaude(params);
  } catch (err) {
    logger.error(`Claude itinerary generation failed, falling back to mock itinerary: ${(err as Error).message}`);
    return generateMockItinerary(params);
  }
}
