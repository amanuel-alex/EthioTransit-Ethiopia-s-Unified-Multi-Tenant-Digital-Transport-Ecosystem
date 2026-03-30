import { OperatorLayout } from "@/components/app/layouts/operator-layout";

export default function OperatorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OperatorLayout>{children}</OperatorLayout>;
}
