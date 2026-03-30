import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  PrismaClient,
  UserRole,
  CompanyStatus,
} from "@prisma/client";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(apiRoot, ".env") });
if (process.env.NODE_ENV !== "production" && !existsSync(join(apiRoot, ".env"))) {
  dotenv.config({ path: join(apiRoot, ".env.example") });
}

const prisma = new PrismaClient();

const CITY_CATALOG: { slug: string; name: string; stations: string[] }[] = [
  {
    slug: "addis-ababa",
    name: "Addis Ababa",
    stations: [
      "Meskel Square Terminal",
      "Kaliti Bus Station",
      "Lamberet Bus Station",
      "Autobus Terra",
    ],
  },
  { slug: "hawassa", name: "Hawassa", stations: ["Hawassa Main Bus Terminal", "Hawassa City Bus Stop"] },
  { slug: "bahir-dar", name: "Bahir Dar", stations: ["Bahir Dar Central Station"] },
  { slug: "dire-dawa", name: "Dire Dawa", stations: ["Dire Dawa Bus Terminal"] },
  { slug: "gondar", name: "Gondar", stations: ["Gondar Bus Station"] },
  { slug: "mekelle", name: "Mekelle", stations: ["Mekelle Intercity Terminal"] },
];

async function upsertCityCatalog() {
  for (const c of CITY_CATALOG) {
    const city = await prisma.city.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name, countryCode: "ET" },
    });
    for (const stationName of c.stations) {
      await prisma.busStation.upsert({
        where: {
          cityId_name: { cityId: city.id, name: stationName },
        },
        update: {},
        create: { cityId: city.id, name: stationName },
      });
    }
  }
}

async function backfillRouteStations() {
  const routes = await prisma.route.findMany({
    where: {
      OR: [{ originStationId: null }, { destinationStationId: null }],
    },
  });
  for (const r of routes) {
    const oCity = await prisma.city.findFirst({
      where: { name: { equals: r.origin, mode: "insensitive" } },
    });
    const dCity = await prisma.city.findFirst({
      where: { name: { equals: r.destination, mode: "insensitive" } },
    });
    if (!oCity || !dCity) continue;
    const oSt = await prisma.busStation.findFirst({
      where: { cityId: oCity.id },
      orderBy: { name: "asc" },
    });
    const dSt = await prisma.busStation.findFirst({
      where: { cityId: dCity.id },
      orderBy: { name: "asc" },
    });
    if (oSt && dSt) {
      await prisma.route.update({
        where: { id: r.id },
        data: { originStationId: oSt.id, destinationStationId: dSt.id },
      });
    }
  }
}

async function main() {
  await upsertCityCatalog();

  const company = await prisma.company.upsert({
    where: { slug: "addis-bus" },
    update: {},
    create: {
      name: "Addis Intercity Bus",
      slug: "addis-bus",
      status: CompanyStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { phone: "+251900000001" },
    update: { role: UserRole.ADMIN },
    create: {
      phone: "+251900000001",
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { phone: "+251900000002" },
    update: { companyId: company.id, role: UserRole.COMPANY },
    create: {
      phone: "+251900000002",
      role: UserRole.COMPANY,
      companyId: company.id,
    },
  });

  await prisma.user.upsert({
    where: { phone: "+251900000003" },
    update: { role: UserRole.PASSENGER },
    create: {
      phone: "+251900000003",
      role: UserRole.PASSENGER,
    },
  });

  const bus = await prisma.bus.upsert({
    where: {
      companyId_plateNumber: {
        companyId: company.id,
        plateNumber: "AA-12345",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      plateNumber: "AA-12345",
      seatCapacity: 45,
      costPerKm: 12.5,
    },
  });

  const addisCity = await prisma.city.findUniqueOrThrow({
    where: { slug: "addis-ababa" },
  });
  const hawassaCity = await prisma.city.findUniqueOrThrow({
    where: { slug: "hawassa" },
  });
  const originSt = await prisma.busStation.findFirstOrThrow({
    where: { cityId: addisCity.id },
    orderBy: { name: "asc" },
  });
  const destSt = await prisma.busStation.findFirstOrThrow({
    where: { cityId: hawassaCity.id },
    orderBy: { name: "asc" },
  });

  const route = await prisma.route.upsert({
    where: { id: "seed_route_addis_hawassa" },
    update: {
      pricePerKm: 1.64,
      origin: addisCity.name,
      destination: hawassaCity.name,
      originStationId: originSt.id,
      destinationStationId: destSt.id,
    },
    create: {
      id: "seed_route_addis_hawassa",
      companyId: company.id,
      origin: addisCity.name,
      destination: hawassaCity.name,
      originStationId: originSt.id,
      destinationStationId: destSt.id,
      distanceKm: 275,
      pricePerKm: 1.64,
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);
  const arrive = new Date(tomorrow);
  arrive.setHours(12, 30, 0, 0);

  await prisma.schedule.upsert({
    where: { id: "seed_sched_1" },
    update: {},
    create: {
      id: "seed_sched_1",
      companyId: company.id,
      routeId: route.id,
      busId: bus.id,
      departsAt: tomorrow,
      arrivesAt: arrive,
      basePrice: 450,
    },
  });

  await backfillRouteStations();

  console.log(
    "Seed OK: company city catalog + stations; users +251900000001 (admin), +251900000002 (company), +251900000003 (passenger)",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
