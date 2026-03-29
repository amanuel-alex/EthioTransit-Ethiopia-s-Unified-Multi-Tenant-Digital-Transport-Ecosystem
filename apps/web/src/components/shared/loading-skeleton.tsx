import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full max-w-2xl" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
