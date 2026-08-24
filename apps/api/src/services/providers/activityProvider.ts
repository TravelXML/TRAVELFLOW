import { Activity } from "../../types";
import { createRetryingClient } from "../../utils/apiClient";
import { env, providers } from "../../config/env";
import { logger } from "../../utils/logger";

export interface ActivityProvider {
  search(destination: string, preferences: string[]): Promise<Activity[]>;
}

const ACTIVITY_TEMPLATES = [
  { suffix: "City Walking Tour", basePrice: 35, hours: 3 },
  { suffix: "Food & Culture Tasting Tour", basePrice: 65, hours: 4 },
  { suffix: "Sunset Boat Cruise", basePrice: 90, hours: 2 },
  { suffix: "Museum & Old Town Tour", basePrice: 40, hours: 3 },
  { suffix: "Day Trip & Adventure Excursion", basePrice: 120, hours: 8 },
];

class MockActivityProvider implements ActivityProvider {
  async search(destination: string, _preferences: string[]): Promise<Activity[]> {
    return ACTIVITY_TEMPLATES.map((t, i) => ({
      id: `mock-activity-${destination}-${i}`,
      title: `${destination} ${t.suffix}`,
      price: t.basePrice,
      rating: Math.round((4 + i * 0.2 - (i % 2) * 0.3) * 10) / 10,
      durationHours: t.hours,
      imageUrl: `https://picsum.photos/seed/activity-${destination}-${i}/400/300`,
    }));
  }
}

class GetYourGuideActivityProvider implements ActivityProvider {
  private client = createRetryingClient({
    baseURL: "https://api.getyourguide.com",
    headers: { Authorization: `Bearer ${env.GETYOURGUIDE_API_KEY}` },
  });

  async search(destination: string, preferences: string[]): Promise<Activity[]> {
    try {
      const response = await this.client.get("/v1/tours", {
        params: { q: destination, tags: preferences.join(",") },
      });

      return (response.data.tours ?? []).slice(0, 5).map((t: any) => ({
        id: t.id,
        title: t.title,
        price: t.price,
        rating: t.rating,
        durationHours: t.durationHours,
        imageUrl: t.imageUrl,
      }));
    } catch (err) {
      logger.error(`GetYourGuide search failed, falling back to mock data: ${(err as Error).message}`);
      return new MockActivityProvider().search(destination, preferences);
    }
  }
}

export const activityProvider: ActivityProvider = providers.hasGetYourGuide
  ? new GetYourGuideActivityProvider()
  : new MockActivityProvider();
