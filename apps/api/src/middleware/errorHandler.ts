import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      code: "validation_error",
      message: "Invalid request",
      details: err.flatten(),
    });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({ code: "not_found", message: "Record not found" });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({ code: "conflict", message: "Unique constraint violation" });
    return;
  }

  logger.error({ err }, "unhandled_error");
  const expose = process.env.NODE_ENV !== "production";
  res.status(500).json({
    code: "internal_error",
    message: "Internal server error",
    ...(expose && err instanceof Error ? { stack: err.stack } : {}),
  });
}
