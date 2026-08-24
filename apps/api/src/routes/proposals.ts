import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { create, list, getById, update, remove, send } from "../controllers/proposalController";

const router = Router();
router.use(requireAuth);

router.post("/", asyncHandler(create));
router.get("/", asyncHandler(list));
router.get("/:id", asyncHandler(getById));
router.put("/:id", asyncHandler(update));
router.delete("/:id", asyncHandler(remove));
router.post("/:id/send", asyncHandler(send));

export default router;
