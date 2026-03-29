import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

function AuthFallback() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthForm />
    </Suspense>
  );
}
