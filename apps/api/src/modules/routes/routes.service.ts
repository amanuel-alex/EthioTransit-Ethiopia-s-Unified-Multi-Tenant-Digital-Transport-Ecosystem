import { CompanyStatus, Prisma } from "@prisma/client";
import { routeWithStationsInclude } from "../../db/route-include.js";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";

function trimCity(s: string) {
  return s.trim();
}

export type SearchRoutesParams = {
  tenantId: string | null;
  admin: boolean;
  passenger: boolean;
  origin?: string;
  destination?: string;
  originCity?: string;
  destinationCity?: string;
  originStationId?: string;
  destinationStationId?: string;
};

export async function searchRoutes(params: SearchRoutesParams) {
  const base: Prisma.RouteWhereInput = {
    company: { status: CompanyStatus.ACTIVE },
  };

  if (params.tenantId) {
    const company = await prisma.company.findFirst({
      where: { id: params.tenantId },
      select: { status: true },
    });
    if (!company || company.status !== CompanyStatus.ACTIVE) {
      throw new HttpError(403, "company_inactive", "This operator is not available");
    }
    base.companyId = params.tenantId;
  } else if (!params.admin && !params.passenger) {
    throw new Error("tenant_required");
  }

  let where: Prisma.RouteWhereInput;

  if (params.originStationId && params.destinationStationId) {
    where = {
      ...base,
      originStationId: params.originStationId,
      destinationStationId: params.destinationStationId,
    };
  } else {
    const o = trimCity(params.originCity ?? params.origin ?? "");
    const d = trimCity(params.destinationCity ?? params.destination ?? "");
    if (!o || !d) {
      throw new HttpError(
        400,
        "validation_error",
        "Provide origin and destination (city names) or both station ids",
      );
    }

    where = {
      ...base,
      OR: [
        {
          AND: [
            {
              originStation: {
                is: {
                  city: { name: { equals: o, mode: "insensitive" } },
                },
              },
            },
            {
              destinationStation: {
                is: {
                  city: { name: { equals: d, mode: "insensitive" } },
                },
              },
            },
          ],
        },
        {
          AND: [
            { origin: { equals: o, mode: "insensitive" } },
            { destination: { equals: d, mode: "insensitive" } },
          ],
        },
      ],
    };
  }

  return prisma.route.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, slug: true } },
      ...routeWithStationsInclude,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** City pairs with the most paid bookings (cross-operator), for passenger “popular routes”. */
export async function listPopularRoutePairs(limit = 12) {
  const take = Math.min(Math.max(Math.floor(limit), 1), 40);
  const rows = await prisma.$queryRaw<
    { origin: string; destination: string; bookingCount: bigint }[]
  >(Prisma.sql`
    SELECT r.origin, r.destination, COUNT(b.id)::bigint AS "bookingCount"
    FROM "Booking" b
    INNER JOIN "Schedule" s ON s.id = b."scheduleId"
    INNER JOIN "Route" r ON r.id = s."routeId"
    INNER JOIN "Company" c ON c.id = b."companyId"
    WHERE b.status = 'PAID' AND c.status = 'ACTIVE'
    GROUP BY r.origin, r.destination
    ORDER BY COUNT(b.id) DESC
    LIMIT ${take}
  `);
  return rows.map((r) => ({
    origin: r.origin,
    destination: r.destination,
    bookingCount: Number(r.bookingCount),
  }));
}
