import { redirect } from "next/navigation";

export default function LegacyTrackingRedirect() {
  redirect("/dashboard/schedules");
}
