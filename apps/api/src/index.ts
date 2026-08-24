import { env, providers } from "./config/env";
import { createApp } from "./app";
import { logger } from "./utils/logger";
import "./jobs/emailQueue";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`TravelFlow API listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(
    `Providers - Claude: ${providers.hasClaude ? "live" : "mock"}, Skyscanner: ${providers.hasSkyscanner ? "live" : "mock"}, ` +
      `Hotels: ${providers.hasRapidApiHotels ? "live" : "mock"}, Activities: ${providers.hasGetYourGuide ? "live" : "mock"}, ` +
      `Mailgun: ${providers.hasMailgun ? "live" : "console"}, S3: ${providers.hasS3 ? "live" : "local disk"}`
  );
});
