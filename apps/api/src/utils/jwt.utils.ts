import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { loadEnv } from "../config/env.js";

const JWT_ALG = "HS256" as const;

export type AccessPayload = {
  sub: string;
  role: UserRole;
  companyId: string | null;
};

export function signAccessToken(payload: AccessPayload): string {
  const env = loadEnv();
  return jwt.sign(
    { role: payload.role, companyId: payload.companyId },
    env.JWT_ACCESS_SECRET,
    {
      subject: payload.sub,
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
      algorithm: JWT_ALG,
    },
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const env = loadEnv();
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALG],
  }) as jwt.JwtPayload;
  if (!decoded.sub || !decoded.role) {
    throw new Error("invalid_token");
  }
  return {
    sub: decoded.sub,
    role: decoded.role as UserRole,
    companyId: (decoded.companyId as string | null | undefined) ?? null,
  };
}
