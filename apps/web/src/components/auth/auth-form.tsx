"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { EthioFlagStrip } from "@/components/shared/ethio-flag-strip";

const DEV_HINT =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_DEV_OTP
    : undefined;

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  let nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? decodeURIComponent(nextRaw)
      : "/home";
  if (nextPath.startsWith("/auth")) nextPath = "/home";

  const { login, accessToken, user } = useAuth();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!accessToken || !user) return;
    if (user.role === "COMPANY") router.replace("/dashboard");
    else if (user.role === "ADMIN") router.replace("/admin");
    else router.replace(nextPath);
  }, [accessToken, user, router, nextPath]);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhoneContinue = async () => {
    if (phone.trim().length < 5) {
      toast.error("Enter a valid phone number");
      return;
    }
    setStep("code");
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  const handleCodeChange = (i: number, val: string) => {
    const pastedMulti = val.replace(/\D/g, "");
    if (pastedMulti.length > 1) {
      applyOtpDigits(pastedMulti);
      return;
    }
    const d = pastedMulti.slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) inputsRef.current[i + 1]?.focus();
    if (d && i === 5) {
      const joined = next.join("");
      if (joined.length === 6) {
        queueMicrotask(() => {
          void verifyWithOtp(joined);
        });
      }
    }
  };

  function applyOtpDigits(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const next = Array.from({ length: 6 }, (_, j) => digits[j] ?? "");
    setCode(next);
    const focusAt = Math.min(digits.length, 5);
    queueMicrotask(() => inputsRef.current[focusAt]?.focus());
    if (digits.length === 6) {
      queueMicrotask(() => {
        void verifyWithOtp(digits);
      });
    }
  }

  async function verifyWithOtp(otp: string) {
    if (otp.length < 4) {
      toast.error("Enter the verification code");
      return;
    }
    setLoading(true);
    try {
      const u = await login(phone.trim(), otp);
      toast.success("Signed in");
      if (u.role === "COMPANY") router.replace("/dashboard");
      else if (u.role === "ADMIN") router.replace("/admin");
      else router.replace(nextPath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const submit = async () => {
    await verifyWithOtp(code.join(""));
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? false : { opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card className="overflow-hidden border-2 shadow-xl">
        <div className="p-1">
          <EthioFlagStrip />
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your phone number and SMS code.{" "}
            {DEV_HINT ? (
              <span className="block pt-1 text-amber-700 dark:text-amber-400">
                Dev / bypass: use OTP{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  {DEV_HINT}
                </code>{" "}
                (must match <code className="font-mono text-xs">AUTH_DEV_CODE</code>{" "}
                on the API).
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+2519…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={handlePhoneContinue}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp-0">Verification code</Label>
                <div
                  className="flex justify-center gap-2"
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text");
                    applyOtpDigits(text);
                  }}
                >
                  {code.map((c, i) => (
                    <Input
                      key={i}
                      id={i === 0 ? "otp-0" : undefined}
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      className="h-12 w-10 text-center text-lg"
                      value={c}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      aria-label={`Digit ${i + 1} of 6`}
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Paste a 6-digit code into any box.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("phone")}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={loading}
                  onClick={submit}
                >
                  {loading ? "Signing in…" : "Verify"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
