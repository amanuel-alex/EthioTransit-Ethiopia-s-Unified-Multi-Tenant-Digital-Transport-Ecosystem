"use server";

import { revalidatePath } from "next/cache";
import { serverApiRequest } from "@/lib/server/api";

export async function adminSetCompanyStatusAction(
  companyId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  await serverApiRequest(`/api/v1/admin/companies/${companyId}`, {
    method: "PATCH",
    json: { status },
  });
  revalidatePath("/admin/companies");
  revalidatePath("/admin");
}
