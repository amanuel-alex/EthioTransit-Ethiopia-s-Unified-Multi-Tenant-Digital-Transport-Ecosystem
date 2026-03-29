import { Router } from "express";
import type { z } from "zod";
import { validateBody } from "../../middleware/validate.js";
import { loginSchema, refreshSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

type LoginBody = z.infer<typeof loginSchema>;

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { phone, code } = req.body as LoginBody;
    const out = await authService.loginWithPhone(phone, code);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/refresh", validateBody(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const out = await authService.rotateRefreshToken(refreshToken);
    res.json(out);
  } catch (e) {
    next(e);
  }
});
