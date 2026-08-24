import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { UPLOADS_DIR } from "./services/providers/storageProvider";
import authRoutes from "./routes/auth";
import proposalRoutes from "./routes/proposals";
import dashboardRoutes from "./routes/dashboard";
import trackRoutes from "./routes/track";
import webhookRoutes from "./routes/webhooks";

export function createApp(): Express {
  const app = express();

  // The "cors" package echoes back a plain-string `origin` verbatim as
  // Access-Control-Allow-Origin regardless of the request's actual Origin -
  // it does not validate a match. That meant opening the app via
  // http://127.0.0.1:5173 instead of the configured http://localhost:5173
  // got a 200 response with a mismatched ACAO header, which the browser
  // (correctly) rejects as a CORS violation - it looks like a network error
  // in the browser even though curl (which doesn't enforce CORS) sees a
  // clean 200. Validating against both localhost/127.0.0.1 forms fixes the
  // common local-dev case while still rejecting genuinely different origins.
  const allowedOrigins = new Set(
    [env.FRONTEND_URL, env.FRONTEND_URL.replace("://localhost", "://127.0.0.1"), env.FRONTEND_URL.replace("://127.0.0.1", "://localhost")].filter(
      Boolean
    )
  );

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
    })
  );
  app.use(express.json());

  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/health", (_req, res) => res.json({ status: "ok", env: env.NODE_ENV }));

  app.use("/api/auth", authRoutes);
  app.use("/api/proposals", proposalRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/track", trackRoutes);
  app.use("/webhooks", webhookRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
