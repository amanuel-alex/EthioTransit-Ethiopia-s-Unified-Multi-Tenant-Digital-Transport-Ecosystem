import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { loadEnv } from "../../config/env.js";
import { HttpError } from "../../utils/errors.js";
import { randomToken } from "../../utils/crypto.utils.js";
import { signAccessToken } from "../../utils/jwt.utils.js";

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

function parseRefreshTokenPayload(raw: string): { id: string; secret: string } {
  const i = raw.indexOf(".");
  if (i <= 0 || i === raw.length - 1) {
    throw new HttpError(400, "invalid_refresh", "Malformed refresh token");
  }
  return { id: raw.slice(0, i), secret: raw.slice(i + 1) };
}

/**
 * MVP phone login: in development or when AUTH_DEV_BYPASS=true, require AUTH_DEV_CODE.
 * In production without bypass, reject until SMS OTP is wired.
 */
export async function loginWithPhone(phone: string, code?: string) {
  const env = loadEnv();
  const devOk =
    env.NODE_ENV === "development" ||
    env.AUTH_DEV_BYPASS === true;

  if (!devOk) {
    throw new HttpError(
      501,
      "otp_not_configured",
      "Production login requires SMS OTP integration or AUTH_DEV_BYPASS",
    );
  }

  if (!code || code !== env.AUTH_DEV_CODE) {
    throw new HttpError(401, "invalid_code", "Invalid or missing verification code");
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new HttpError(404, "user_not_found", "User not found for this phone");
  }

  const secret = randomToken(32);
  const tokenHash = await bcrypt.hash(secret, 10);
  const expiresAt = new Date(Date.now() + REFRESH_MS);

  const row = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const refreshToken = `${row.id}.${secret}`;

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    companyId: user.companyId,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_ACCESS_EXPIRES,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      companyId: user.companyId,
    },
  };
}

export async function rotateRefreshToken(rawRefresh: string) {
  const { id, secret } = parseRefreshTokenPayload(rawRefresh);

  const row = await prisma.refreshToken.findUnique({ where: { id } });
  if (!row || row.revokedAt) {
    throw new HttpError(401, "invalid_refresh", "Refresh token invalid");
  }
  if (row.expiresAt < new Date()) {
    throw new HttpError(401, "invalid_refresh", "Refresh token expired");
  }

  const ok = await bcrypt.compare(secret, row.tokenHash);
  if (!ok) {
    throw new HttpError(401, "invalid_refresh", "Refresh token invalid");
  }

  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: row.userId } });

  const newSecret = randomToken(32);
  const tokenHash = await bcrypt.hash(newSecret, 10);
  const expiresAt = new Date(Date.now() + REFRESH_MS);

  const created = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const env = loadEnv();
  return {
    accessToken: signAccessToken({
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
    }),
    refreshToken: `${created.id}.${newSecret}`,
    expiresIn: env.JWT_ACCESS_EXPIRES,
  };
}
