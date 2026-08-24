export * from "../../../../packages/shared/src/types";

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
