import type { Prisma } from "@prisma/client";

export const routeWithStationsInclude = {
  originStation: {
    include: {
      city: { select: { id: true, name: true, slug: true } },
    },
  },
  destinationStation: {
    include: {
      city: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.RouteInclude;
