# EthioTransit

EthioTransit is a full-stack, multi-tenant transport platform. This repository is a **pnpm + Turborepo** monorepo: Next.js for the web UI, Flutter for mobile, Node.js for the REST API (M-Pesa and Chapa), and a Telegram bot (grammY).

## Layout

```
├── apps/
│   ├── web/       # Next.js (App Router, Tailwind)
│   ├── mobile/    # Flutter (`ethiotransit_mobile`)
│   ├── api/       # Express + Prisma + PostgreSQL (multi-tenant API)
│   └── bot/       # Telegram bot (grammY)
├── packages/
│   ├── shared/    # Types, DTOs, payment enums, utils
│   ├── config/    # ESLint preset, Tailwind preset, payment env helpers
│   └── ui/        # Shared React components for web
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (or run via `npx pnpm@9.15.0 <command>`)
- **PostgreSQL** 14+ (for `apps/api`)
- **Flutter** SDK (for `apps/mobile`)

## Install

From the repository root:

```bash
pnpm install
```

## Common commands

| Goal | Command |
|------|---------|
| Dev (all Node apps + packages) | `pnpm dev` |
| Production build | `pnpm build` |
| Lint | `pnpm lint` |
| Web only | `pnpm --filter @ethiotransit/web dev` |
| API only | `pnpm --filter @ethiotransit/api dev` |
| Bot only | `pnpm --filter @ethiotransit/bot dev` |
| Mobile | `cd apps/mobile && flutter run` |

`pnpm dev` runs Turborepo with `dependsOn: ["^build"]` so workspace packages build before app dev servers start.

## API (EthioTransit backend)

Copy [`apps/api/.env.example`](apps/api/.env.example) to `apps/api/.env`, set `DATABASE_URL` and JWT secrets, then:

```bash
pnpm --filter @ethiotransit/api exec prisma migrate dev
pnpm --filter @ethiotransit/api exec prisma db seed
pnpm --filter @ethiotransit/api dev
```

For production deployments against a managed database, use `prisma migrate deploy` instead of `migrate dev`.

### Auth (JWT access + refresh)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/auth/login` | Body: `{ "phone", "code" }`. MVP: `AUTH_DEV_BYPASS=true` and `AUTH_DEV_CODE` (see `.env.example`). |
| POST | `/api/v1/auth/refresh` | Body: `{ "refreshToken" }`. |

Passengers must send `x-company-id` on tenant-scoped routes. Company users use `companyId` from the JWT.

### Core resources

| Method | Path |
|--------|------|
| GET | `/api/v1/health` |
| GET | `/api/v1/routes/search?origin=&destination=` |
| GET | `/api/v1/schedules/available?scheduleId=` or `?routeId=&from=&to=` (ISO dates) |
| POST | `/api/v1/bookings/create` |
| POST | `/api/v1/bookings/cancel` | Body: `{ "bookingId" }` — pending only; releases seat locks. |
| GET | `/api/v1/bookings/user` |
| GET | `/api/v1/bookings/company` (company role) |

### Payments

| Method | Path |
|--------|------|
| POST | `/api/v1/payments/mpesa/initiate` |
| POST | `/api/v1/payments/chapa/initiate` |
| POST | `/api/v1/payments/webhook` |

Register **M-Pesa** Daraja callback URL to `.../api/v1/payments/webhook` (same URL for Chapa where applicable). Webhook verifies Chapa HMAC when `CHAPA_WEBHOOK_SECRET` is set.

### Company & admin

| Method | Path |
|--------|------|
| GET | `/api/v1/company/dashboard` |
| GET | `/api/v1/company/revenue` |
| GET | `/api/v1/admin/companies` |
| GET | `/api/v1/admin/analytics` |

Without M-Pesa/Chapa keys, initiate endpoints return `503` with `mpesa_not_configured` / `chapa_not_configured`.

### Production configuration

When `NODE_ENV=production`, startup **requires**:

- `CORS_ORIGIN` (comma-separated allowed browser origins).
- `AUTH_DEV_BYPASS` must **not** be `true`.
- **M-Pesa webhooks:** set `MPESA_WEBHOOK_SECRET` (and send it as header `X-EthioTransit-Mpesa-Webhook-Secret` from your gateway) **and/or** `MPESA_WEBHOOK_IP_ALLOWLIST`, **or** set `WEBHOOK_INSECURE_ALLOW=true` only on private networks.
- **Chapa webhooks:** set `CHAPA_WEBHOOK_SECRET` (HMAC on raw body), **or** `CHAPA_WEBHOOKS_DISABLED=true` if you only use M-Pesa, **or** `WEBHOOK_INSECURE_ALLOW=true` for private testing.

Apply new DB constraints after pulling:

`pnpm --filter @ethiotransit/api exec prisma migrate deploy`

## Telegram bot

Copy `apps/bot/.env.example` to `apps/bot/.env` and set `TELEGRAM_BOT_TOKEN`. Then `pnpm --filter @ethiotransit/bot dev`.

## Shared packages

- **`@ethiotransit/shared`** — payment enums, shared DTO types, small utilities.
- **`@ethiotransit/config`** — `getMpesaEnv()` / `getChapaEnv()` from `process.env`, plus optional ESLint and Tailwind presets (`@ethiotransit/config/eslint`, `@ethiotransit/config/tailwind`).
- **`@ethiotransit/ui`** — React components; the web app uses `transpilePackages` in `next.config.ts`.

## Flutter note

`apps/mobile` is a standard Flutter project and is **not** wired into Turborepo tasks. Use the Flutter CLI for analyze, test, and builds.
