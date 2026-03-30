import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "validation_error",
        message: parsed.error.flatten(),
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        code: "validation_error",
        message: parsed.error.flatten(),
      });
      return;
    }
    req.validatedQuery = parsed.data;
    next();
  };
}
