import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import { signToken } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import { registerSchema, loginSchema } from "../utils/validators";
import { PublicUser } from "../types";

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  brandingLogoUrl: string | null;
  brandingPrimaryColor: string;
  brandingSecondaryColor: string;
  brandingAgencyName: string | null;
  subscriptionTier: string;
  proposalsMonthCount: number;
  proposalsMonthLimit: number;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    brandingLogoUrl: user.brandingLogoUrl,
    brandingPrimaryColor: user.brandingPrimaryColor,
    brandingSecondaryColor: user.brandingSecondaryColor,
    brandingAgencyName: user.brandingAgencyName,
    subscriptionTier: user.subscriptionTier as PublicUser["subscriptionTier"],
    proposalsMonthCount: user.proposalsMonthCount,
    proposalsMonthLimit: user.proposalsMonthLimit,
  };
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with that email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: passwordHash, name } });

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: toPublicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: toPublicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  res.json(toPublicUser(user));
}
