# AzafiPath

AzafiPath is a TypeScript full-stack web app focused on career planning, habit/expense tracking, investment projection, and retirement planning for young users in Pakistan.

## What this project includes

- **Single-page React frontend** (Vite + Tailwind)
- **Express + tRPC backend** for API routes
- **Shared TypeScript modules** for financial/retirement logic
- **Drizzle ORM + MySQL schema/migrations** for persistence
- **Vitest test suite** for backend and domain logic

## Tech stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Radix UI, Recharts
- **Backend:** Express, tRPC, Zod
- **Database:** Drizzle ORM, MySQL (`mysql2`)
- **Tooling:** TypeScript, Vitest, Prettier, esbuild

## Prerequisites

- Node.js LTS (recommended)
- pnpm 10+

## Quick start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env` file in the repository root (see [Environment variables](#environment-variables)).

3. Start development server:

   ```bash
   pnpm dev
   ```

4. Open the app in your browser (default: `http://localhost:3000`, auto-falls back to the next available port).

## Environment variables

The app reads environment variables from the repository root (`dotenv/config`).

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Preferred server port (defaults to `3000`) |
| `NODE_ENV` | No | Runtime mode (`development` / `production`) |
| `DATABASE_URL` | Required for DB features and migrations | MySQL connection string used by Drizzle |
| `JWT_SECRET` | Required for auth cookies | Session cookie signing secret |
| `VITE_APP_ID` | Optional/depends on deployment | Application identifier |
| `OAUTH_SERVER_URL` | Required for OAuth login flow | OAuth provider/server base URL |
| `OWNER_OPEN_ID` | Optional | Marks matching user as admin |
| `BUILT_IN_FORGE_API_URL` | Optional | Forge API endpoint |
| `BUILT_IN_FORGE_API_KEY` | Optional | Forge API key |

> Note: Some local development flows can still run without DB connectivity, but profile/leak persistence and migration commands require `DATABASE_URL`.

## Available scripts

- `pnpm dev` — start backend in dev mode with Vite integration
- `pnpm build` — build frontend and bundle server to `dist/`
- `pnpm start` — run production server from `dist/index.js`
- `pnpm check` — run TypeScript type checking (`tsc --noEmit`)
- `pnpm test` — run Vitest test suite
- `pnpm format` — format repository with Prettier
- `pnpm db:push` — generate + apply Drizzle migrations

## Project structure

```text
client/        # React app (pages, components, hooks, styles)
server/        # Express server, tRPC routers, data access, tests
shared/        # Cross-layer business/domain modules
drizzle/       # SQL migrations + schema/relations
patches/       # pnpm patch-package patches
```

## Database workflow (Drizzle)

1. Set `DATABASE_URL`.
2. Update schema in `drizzle/schema.ts`.
3. Run:

   ```bash
   pnpm db:push
   ```

This runs:

- `drizzle-kit generate`
- `drizzle-kit migrate`

## Testing

Run all tests:

```bash
pnpm test
```

Main test coverage currently lives in `server/*.test.ts` and focuses on router contracts and financial planning logic.

## Additional docs

- `DESIGN_SYSTEM.md` — UI/design language guidance
- `todo.md` — project evolution checklist and implementation milestones
