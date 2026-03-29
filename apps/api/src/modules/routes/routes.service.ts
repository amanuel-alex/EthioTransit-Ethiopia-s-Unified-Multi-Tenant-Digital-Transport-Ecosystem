import type { Prisma } from "@prisma/client";
import { CompanyStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";

export async function searchRoutes(params: {
  tenantId: string | null;
  admin: boolean;
  origin: string;
  destination: string;
}) {
  const where: Prisma.RouteWhereInput = {
    origin: { equals: params.origin, mode: "insensitive" },
    destination: { equals: params.destination, mode: "insensitive" },
  };

  if (params.tenantId) {
    const company = await prisma.company.findFirst({
      where: { id: params.tenantId },
      select: { status: true },
    });
    if (!company || company.status !== CompanyStatus.ACTIVE) {
      throw new HttpError(403, "company_inactive", "This operator is not available");
    }
    where.companyId = params.tenantId;
  } else if (!params.admin) {
    throw new Error("tenant_required");
  }

  return prisma.route.findMany({
    where,
    include: { company: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}
