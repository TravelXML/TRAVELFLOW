import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { prisma } from "../config/database";
import { recordConversion } from "../services/linkService";
import { logger } from "../utils/logger";

const router = Router();

// Mailgun event webhook (delivered / failed / bounced). Verifying Mailgun's
// HMAC signature is skipped here since this endpoint only runs with a real
// Mailgun account attached - add signature verification before going live.
router.post(
  "/mailgun",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      "event-data": z.object({
        event: z.string(),
        message: z.object({ headers: z.object({ "message-id": z.string() }) }),
        reason: z.string().optional(),
      }),
    });

    const { "event-data": eventData } = schema.parse(req.body);
    const messageId = eventData.message.headers["message-id"];

    const email = await prisma.email.findFirst({ where: { mailgunMessageId: messageId } });
    if (email) {
      const deliveryStatus = eventData.event === "delivered" ? "delivered" : eventData.event === "failed" ? "failed" : email.deliveryStatus;
      await prisma.email.update({
        where: { id: email.id },
        data: { deliveryStatus, bounceReason: eventData.reason },
      });
    }

    res.status(200).json({ received: true });
  })
);

// Generic OTA conversion webhook - a booking partner (Booking.com, GetYourGuide, ...)
// posts back { shortCode, revenue } when a tracked link results in a booking.
router.post(
  "/conversion",
  asyncHandler(async (req, res) => {
    const schema = z.object({ shortCode: z.string(), revenue: z.coerce.number().nonnegative() });
    const { shortCode, revenue } = schema.parse(req.body);

    const link = await recordConversion(shortCode, revenue);
    if (!link) {
      res.status(404).json({ error: "Unknown tracking link" });
      return;
    }

    logger.info(`Recorded conversion for link ${link.id}: $${revenue}`);
    res.status(200).json({ received: true });
  })
);

export default router;
