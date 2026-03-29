import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

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
