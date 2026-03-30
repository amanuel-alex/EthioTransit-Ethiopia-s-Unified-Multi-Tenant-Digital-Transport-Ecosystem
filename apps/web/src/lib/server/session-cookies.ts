export const SESSION_ACCESS = "et_at";
export const SESSION_REFRESH = "et_rt";
export const SESSION_USER_JSON = "et_user";

export const SESSION_COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
