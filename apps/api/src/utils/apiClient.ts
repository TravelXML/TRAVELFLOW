import axios, { AxiosInstance } from "axios";
import { logger } from "./logger";

export function createRetryingClient(baseConfig: Parameters<typeof axios.create>[0], maxRetries = 2): AxiosInstance {
  const client = axios.create({ timeout: 10_000, ...baseConfig });

  client.interceptors.response.use(undefined, async (error) => {
    const config = error.config ?? {};
    config.__retryCount = config.__retryCount ?? 0;

    const isRetriable = !error.response || error.response.status >= 500;
    if (config.__retryCount >= maxRetries || !isRetriable) {
      return Promise.reject(error);
    }

    config.__retryCount += 1;
    const delayMs = 300 * 2 ** config.__retryCount;
    logger.warn(`Retrying request to ${config.url} (attempt ${config.__retryCount}) after ${delayMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return client(config);
  });

  return client;
}
