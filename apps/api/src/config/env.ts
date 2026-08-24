import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  PUBLIC_API_URL: z.string().default("http://localhost:3001"),
  LOG_LEVEL: z.string().default("info"),

  ANTHROPIC_API_KEY: z.string().optional(),
  SKYSCANNER_API_KEY: z.string().optional(),
  RAPIDAPI_HOTELS_KEY: z.string().optional(),
  GETYOURGUIDE_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const providers = {
  hasClaude: Boolean(env.ANTHROPIC_API_KEY),
  hasSkyscanner: Boolean(env.SKYSCANNER_API_KEY),
  hasRapidApiHotels: Boolean(env.RAPIDAPI_HOTELS_KEY),
  hasGetYourGuide: Boolean(env.GETYOURGUIDE_API_KEY),
  hasMailgun: Boolean(env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN),
  hasS3: Boolean(env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY),
};
