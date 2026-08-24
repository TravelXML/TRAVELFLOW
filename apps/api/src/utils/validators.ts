import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createProposalSchema = z
  .object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    origin: z.string().min(1),
    destination: z.string().min(1),
    travelStartDate: z.coerce.date(),
    travelEndDate: z.coerce.date(),

    numAdults: z.coerce.number().int().min(0).default(1),
    numChildren: z.coerce.number().int().min(0).default(0),
    childrenAges: z.array(z.coerce.number().int().min(0).max(17)).default([]),
    numSeniors: z.coerce.number().int().min(0).default(0),

    tripType: z.enum(["round_trip", "one_way"]).default("round_trip"),
    cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
    directFlightsOnly: z.coerce.boolean().default(false),
    preferredAirlines: z.array(z.string()).default([]),

    accommodationType: z.enum(["budget", "mid_range", "luxury"]).default("mid_range"),
    numRooms: z.coerce.number().int().min(1).default(1),
    hotelAmbiance: z.enum(["any", "romantic", "family", "business", "quiet", "lively", "luxury"]).default("any"),
    maxDistanceFromCenterKm: z.coerce.number().min(0).default(10),
    maxDistanceFromAirportKm: z.coerce.number().min(0).default(30),
    priceRangeMin: z.coerce.number().min(0).optional(),
    priceRangeMax: z.coerce.number().min(0).optional(),

    pace: z.enum(["relaxed", "moderate", "packed"]).default("moderate"),
    specialOccasion: z.enum(["none", "honeymoon", "anniversary", "birthday", "family_reunion"]).default("none"),
    dietaryRestrictions: z.array(z.enum(["vegetarian", "vegan", "halal", "kosher", "gluten_free"])).default([]),
    accessibilityNeeds: z.string().default(""),
    specialRequests: z.string().default(""),

    budget: z.coerce.number().positive(),
    preferences: z.array(z.string()).default([]),
  })
  .refine((data) => data.travelEndDate > data.travelStartDate, {
    message: "travelEndDate must be after travelStartDate",
    path: ["travelEndDate"],
  })
  .refine((data) => data.childrenAges.length === data.numChildren, {
    message: "childrenAges must have one entry per child",
    path: ["childrenAges"],
  })
  .refine((data) => data.numAdults + data.numSeniors >= 1, {
    message: "At least one adult or senior traveler is required",
    path: ["numAdults"],
  })
  .refine((data) => data.priceRangeMin == null || data.priceRangeMax == null || data.priceRangeMax >= data.priceRangeMin, {
    message: "priceRangeMax must be greater than or equal to priceRangeMin",
    path: ["priceRangeMax"],
  });

export const updateProposalSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  status: z.enum(["draft", "sent", "opened", "clicked", "booked"]).optional(),
});

export type CreateProposalDTO = z.infer<typeof createProposalSchema>;
