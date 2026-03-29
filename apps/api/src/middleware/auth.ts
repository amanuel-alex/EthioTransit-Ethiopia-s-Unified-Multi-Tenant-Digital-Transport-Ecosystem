import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.utils.js";
import { HttpError } from "../utils/errors.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "unauthorized", "Missing bearer token"));
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      companyId: payload.companyId,
    };
    next();
  } catch {
    next(new HttpError(401, "unauthorized", "Invalid or expired access token"));
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, "unauthorized", "Not authenticated"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, "forbidden", "Insufficient role"));
      return;
    }
    next();
  };
}
