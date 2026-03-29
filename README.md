# EthioTransit

EthioTransit is a full-stack, multi-tenant transport platform. This repository is a **pnpm + Turborepo** monorepo: Next.js for the web UI, Flutter for mobile, Node.js for the REST API (M-Pesa and Chapa), and a Telegram bot (grammY).

## Layout

```
├── apps/
│   ├── web/       # Next.js (App Router, Tailwind)
│   ├── mobile/    # Flutter (`ethiotransit_mobile`)
│   ├── api/       # Express REST API + payment services
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

## API & payments

- **Health:** `GET http://localhost:4000/api/v1/health`
- **Initialize payment:** `POST http://localhost:4000/api/v1/payments/init` with JSON body `{ "provider": "mpesa" \| "chapa", "amount", "currency", "reference", "customerContact"?, ... }`
- **M-Pesa callback:** `POST /api/v1/payments/mpesa/callback`
- **Chapa callback (example):** `GET /api/v1/payments/chapa/callback`

Copy `apps/api/.env.example` to `apps/api/.env` and set Daraja / Chapa credentials. Without keys, the API responds with `503` and a clear `code` (`mpesa_not_configured`, `chapa_not_configured`).

## Telegram bot

Copy `apps/bot/.env.example` to `apps/bot/.env` and set `TELEGRAM_BOT_TOKEN`. Then `pnpm --filter @ethiotransit/bot dev`.

## Shared packages

- **`@ethiotransit/shared`** — payment enums, shared DTO types, small utilities.
- **`@ethiotransit/config`** — `getMpesaEnv()` / `getChapaEnv()` from `process.env`, plus optional ESLint and Tailwind presets (`@ethiotransit/config/eslint`, `@ethiotransit/config/tailwind`).
- **`@ethiotransit/ui`** — React components; the web app uses `transpilePackages` in `next.config.ts`.

## Flutter note

`apps/mobile` is a standard Flutter project and is **not** wired into Turborepo tasks. Use the Flutter CLI for analyze, test, and builds.
