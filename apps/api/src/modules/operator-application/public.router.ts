import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../../middleware/validate.js";
import * as operatorApplicationService from "./operator-application.service.js";
import { submitOperatorApplicationSchema } from "./operator-application.schemas.js";

export const publicOperatorRouter = Router();

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "rate_limited",
    message: "Too many applications from this network. Try again later.",
  },
});

publicOperatorRouter.post(
  "/operator-applications",
  applyLimiter,
  validateBody(submitOperatorApplicationSchema),
  async (req, res, next) => {
    try {
      const row = await operatorApplicationService.submitOperatorApplication(
        req.body as {
          legalName: string;
          slug: string;
          applicantPhone: string;
          applicantEmail?: string | null;
          notes?: string | null;
        },
      );
      res.status(201).json({
        id: row.id,
        status: row.status,
        message:
          "Application received. We will email or call you after review. You can sign in at /auth once approved.",
      });
    } catch (e) {
      next(e);
    }
  },
);
