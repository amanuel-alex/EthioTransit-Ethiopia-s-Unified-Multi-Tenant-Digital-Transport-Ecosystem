import { PassengerLayout } from "@/components/app/layouts/passenger-layout";

export default function PassengerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PassengerLayout>{children}</PassengerLayout>;
}
