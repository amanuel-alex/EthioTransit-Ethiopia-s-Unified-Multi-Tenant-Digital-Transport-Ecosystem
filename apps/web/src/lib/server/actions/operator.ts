"use server";

import { revalidatePath } from "next/cache";
import { serverApiRequest } from "@/lib/server/api";

export async function createBusAction(json: Record<string, unknown>) {
  await serverApiRequest("/api/v1/company/buses", { method: "POST", json });
  revalidatePath("/dashboard/fleet");
  revalidatePath("/dashboard");
}

export async function updateBusAction(id: string, json: Record<string, unknown>) {
  await serverApiRequest(`/api/v1/company/buses/${id}`, {
    method: "PATCH",
    json,
  });
  revalidatePath("/dashboard/fleet");
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard");
}

export async function deleteBusAction(id: string) {
  await serverApiRequest(`/api/v1/company/buses/${id}`, { method: "DELETE" });
  revalidatePath("/dashboard/fleet");
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
}

export async function createRouteAction(json: Record<string, unknown>) {
  await serverApiRequest("/api/v1/company/routes", { method: "POST", json });
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/schedules");
}

export async function updateRouteAction(id: string, json: Record<string, unknown>) {
  await serverApiRequest(`/api/v1/company/routes/${id}`, {
    method: "PATCH",
    json,
  });
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/schedules");
}

export async function deleteRouteAction(id: string) {
  await serverApiRequest(`/api/v1/company/routes/${id}`, { method: "DELETE" });
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/schedules");
}

export async function createScheduleAction(json: Record<string, unknown>) {
  await serverApiRequest("/api/v1/company/schedules", { method: "POST", json });
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
}

export async function updateScheduleAction(
  id: string,
  json: Record<string, unknown>,
) {
  await serverApiRequest(`/api/v1/company/schedules/${id}`, {
    method: "PATCH",
    json,
  });
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
}

export async function deleteScheduleAction(id: string) {
  await serverApiRequest(`/api/v1/company/schedules/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
}

export async function createDriverAction(json: Record<string, unknown>) {
  await serverApiRequest("/api/v1/company/drivers", { method: "POST", json });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/fleet");
}

export async function updateDriverAction(
  id: string,
  json: Record<string, unknown>,
) {
  await serverApiRequest(`/api/v1/company/drivers/${id}`, {
    method: "PATCH",
    json,
  });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/fleet");
}

export async function deleteDriverAction(id: string) {
  await serverApiRequest(`/api/v1/company/drivers/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/fleet");
}
