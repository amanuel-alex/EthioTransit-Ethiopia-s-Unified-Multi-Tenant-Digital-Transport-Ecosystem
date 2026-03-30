import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";

export async function listCities() {
  return prisma.city.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { stations: true } },
    },
  });
}

export async function listStations(params: { cityId?: string; citySlug?: string }) {
  if (!params.cityId && !params.citySlug) {
    throw new HttpError(
      400,
      "validation_error",
      "Provide cityId or citySlug",
    );
  }

  const cityWhere = params.cityId
    ? { id: params.cityId }
    : { slug: params.citySlug };

  const city = await prisma.city.findFirst({ where: cityWhere });
  if (!city) {
    throw new HttpError(404, "not_found", "City not found");
  }

  const stations = await prisma.busStation.findMany({
    where: { cityId: city.id },
    orderBy: { name: "asc" },
    include: { city: { select: { id: true, name: true, slug: true } } },
  });

  return { city, stations };
}
