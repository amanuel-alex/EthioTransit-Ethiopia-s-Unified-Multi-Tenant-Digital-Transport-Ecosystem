import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as a bus operator",
  description:
    "Submit your intercity bus company to join EthioTransit. After approval, sign in to manage fleet, routes, and schedules.",
};

export default function PartnerApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
