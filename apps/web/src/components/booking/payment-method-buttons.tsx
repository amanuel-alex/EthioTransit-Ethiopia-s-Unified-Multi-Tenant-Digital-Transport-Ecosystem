"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onMpesa: () => void;
  onChapa: () => void;
  mpesaLoading?: boolean;
  chapaLoading?: boolean;
  disabled?: boolean;
};

export function PaymentMethodButtons({
  onMpesa,
  onChapa,
  mpesaLoading,
  chapaLoading,
  disabled,
}: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <motion.div
        whileHover={reduce || disabled ? undefined : { scale: 1.02 }}
        whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      >
        <Button
          type="button"
          size="lg"
          className="h-auto w-full flex-col gap-2 py-6 text-base"
          variant="default"
          onClick={onMpesa}
          disabled={disabled || mpesaLoading}
        >
          <Smartphone className="h-8 w-8" aria-hidden />
          M-Pesa STK
          <span className="text-xs font-normal opacity-90">
            Pay from your Safaricom line
          </span>
        </Button>
      </motion.div>
      <motion.div
        whileHover={reduce || disabled ? undefined : { scale: 1.02 }}
        whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      >
        <Button
          type="button"
          size="lg"
          className="h-auto w-full flex-col gap-2 border-2 border-accent bg-accent/15 py-6 text-base text-accent-foreground hover:bg-accent/25"
          variant="outline"
          onClick={onChapa}
          disabled={disabled || chapaLoading}
        >
          <Wallet className="h-8 w-8" aria-hidden />
          Chapa
          <span className="text-xs font-normal opacity-90">
            Card & mobile money
          </span>
        </Button>
      </motion.div>
    </div>
  );
}
