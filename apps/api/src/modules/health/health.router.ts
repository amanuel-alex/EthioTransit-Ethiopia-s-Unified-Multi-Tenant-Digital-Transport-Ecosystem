import { Router } from "express";
import { toIsoTimestamp } from "@ethiotransit/shared";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ethiotransit-api",
    timestamp: toIsoTimestamp(),
  });
});
