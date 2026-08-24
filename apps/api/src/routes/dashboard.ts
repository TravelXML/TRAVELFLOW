import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { overview, analytics } from "../controllers/dashboardController";

const router = Router();
router.use(requireAuth);

router.get("/overview", asyncHandler(overview));
router.get("/analytics", asyncHandler(analytics));

export default router;
