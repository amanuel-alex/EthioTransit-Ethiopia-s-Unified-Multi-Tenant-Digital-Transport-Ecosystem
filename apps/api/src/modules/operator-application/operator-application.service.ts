import {
  CompanyStatus,
  OperatorApplicationStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import { normalizeLoginPhone } from "../auth/auth.service.js";

export function normalizeOperatorSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateSlug(slug: string) {
  if (slug.length < 2 || slug.length > 48) {
    throw new HttpError(400, "invalid_slug", "Slug must be 2–48 characters");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(
      400,
      "invalid_slug",
      "Use lowercase letters, numbers, and single hyphens only (e.g. sky-bus)",
    );
  }
}

export async function submitOperatorApplication(input: {
  legalName: string;
  slug: string;
  applicantPhone: string;
  applicantEmail?: string | null;
  notes?: string | null;
}) {
  const legalName = input.legalName.trim();
  const slug = normalizeOperatorSlug(input.slug);
  validateSlug(slug);
  const phone = normalizeLoginPhone(input.applicantPhone);
  if (legalName.length < 2 || legalName.length > 120) {
    throw new HttpError(400, "invalid_name", "Legal name must be 2–120 characters");
  }

  const email = input.applicantEmail?.trim() || null;
  if (
    email &&
    (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    throw new HttpError(400, "invalid_email", "Invalid email");
  }

  const existingCompany = await prisma.company.findUnique({ where: { slug } });
  if (existingCompany) {
    throw new HttpError(409, "slug_taken", "This URL slug is already registered");
  }

  const pendingSlug = await prisma.operatorApplication.findFirst({
    where: { slug, status: OperatorApplicationStatus.PENDING },
  });
  if (pendingSlug) {
    throw new HttpError(
      409,
      "slug_pending",
      "An application with this slug is already pending review",
    );
  }

  const pendingPhone = await prisma.operatorApplication.findFirst({
    where: { applicantPhone: phone, status: OperatorApplicationStatus.PENDING },
  });
  if (pendingPhone) {
    throw new HttpError(
      409,
      "application_pending",
      "You already have a pending application with this phone number",
    );
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (user?.role === UserRole.COMPANY && user.companyId) {
    throw new HttpError(
      409,
      "already_operator",
      "This phone is already linked to an operator account",
    );
  }

  return prisma.operatorApplication.create({
    data: {
      legalName,
      slug,
      applicantPhone: phone,
      applicantEmail: email,
      notes: input.notes?.trim().slice(0, 2000) || null,
    },
  });
}

export async function listOperatorApplicationsAdmin(params: {
  status?: OperatorApplicationStatus;
  skip: number;
  take: number;
}) {
  const where = params.status ? { status: params.status } : {};
  const [data, total] = await Promise.all([
    prisma.operatorApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      include: {
        company: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    }),
    prisma.operatorApplication.count({ where }),
  ]);
  return { data, total };
}

export async function approveOperatorApplication(
  applicationId: string,
  reviewerId: string,
) {
  const app = await prisma.operatorApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new HttpError(404, "not_found", "Application not found");
  if (app.status !== OperatorApplicationStatus.PENDING) {
    throw new HttpError(409, "not_pending", "Application is not pending");
  }

  const slugTaken = await prisma.company.findUnique({ where: { slug: app.slug } });
  if (slugTaken) {
    throw new HttpError(
      409,
      "slug_taken",
      "Company slug was registered after this application was submitted. Reject it and ask the applicant to re-apply with a new slug.",
    );
  }

  const user = await prisma.user.findUnique({ where: { phone: app.applicantPhone } });
  if (user?.role === UserRole.ADMIN) {
    throw new HttpError(
      409,
      "invalid_user",
      "Cannot convert a platform admin account into an operator",
    );
  }
  if (user?.role === UserRole.COMPANY && user.companyId) {
    throw new HttpError(
      409,
      "already_operator",
      "This phone is already linked to another company",
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: app.legalName,
        slug: app.slug,
        status: CompanyStatus.ACTIVE,
      },
    });

    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: { role: UserRole.COMPANY, companyId: company.id },
      });
    } else {
      await tx.user.create({
        data: {
          phone: app.applicantPhone,
          role: UserRole.COMPANY,
          companyId: company.id,
        },
      });
    }

    await tx.operatorApplication.update({
      where: { id: app.id },
      data: {
        status: OperatorApplicationStatus.APPROVED,
        companyId: company.id,
        reviewedAt: now,
        reviewerId,
      },
    });
  });

  return prisma.operatorApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { company: true },
  });
}

export async function rejectOperatorApplication(
  applicationId: string,
  reviewerId: string,
  reason?: string | null,
) {
  const app = await prisma.operatorApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new HttpError(404, "not_found", "Application not found");
  if (app.status !== OperatorApplicationStatus.PENDING) {
    throw new HttpError(409, "not_pending", "Application is not pending");
  }

  return prisma.operatorApplication.update({
    where: { id: applicationId },
    data: {
      status: OperatorApplicationStatus.REJECTED,
      rejectReason: reason?.trim().slice(0, 500) || null,
      reviewedAt: new Date(),
      reviewerId,
    },
  });
}
