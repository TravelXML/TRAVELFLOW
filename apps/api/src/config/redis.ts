import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("error", (err) => logger.error(`Redis error: ${err.message}`));

export async function cacheGetOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch (err) {
    logger.warn(`Cache read failed for ${key}: ${(err as Error).message}`);
  }

  const value = await fetcher();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn(`Cache write failed for ${key}: ${(err as Error).message}`);
  }

  return value;
}
