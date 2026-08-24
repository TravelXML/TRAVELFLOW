import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { recordClick } from "../services/linkService";
import { recordEmailOpen } from "../services/emailService";

const router = Router();

const TRANSPARENT_PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7",
  "base64"
);

router.get(
  "/pixel/:trackingPixelId",
  asyncHandler(async (req, res) => {
    await recordEmailOpen(req.params.trackingPixelId);
    res.set("Content-Type", "image/gif");
    res.send(TRANSPARENT_PIXEL_GIF);
  })
);

router.get(
  "/:shortCode",
  asyncHandler(async (req, res) => {
    const link = await recordClick(req.params.shortCode);
    if (!link) {
      res.status(404).send("Link not found");
      return;
    }
    res.redirect(302, link.originalUrl);
  })
);

export default router;
