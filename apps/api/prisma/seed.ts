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

async function main() {
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

  const route = await prisma.route.upsert({
    where: { id: "seed_route_addis_hawassa" },
    update: {},
    create: {
      id: "seed_route_addis_hawassa",
      companyId: company.id,
      origin: "Addis Ababa",
      destination: "Hawassa",
      distanceKm: 275,
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

  console.log("Seed OK: company", company.slug, "users +251900000001 (admin), +251900000002 (company), +251900000003 (passenger)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
