# AzafiPath

A TypeScript-first web application scaffold for building full-stack apps with a shared codebase. This repository contains a client, server, and shared packages with Drizzle configuration for database tooling.

Key points
- Languages: TypeScript (majority), JavaScript, CSS, HTML
- Monorepo layout with the following top-level folders: `client`, `server`, `shared`, and config files.
- Design tokens and components documented in `DESIGN_SYSTEM.md`.

Getting started (local)

Prerequisites
- Node.js (supported LTS)
- pnpm

Install

```bash
pnpm install
```

Run dev server

```bash
pnpm dev
```

Build

```bash
pnpm build
```

Run tests

```bash
pnpm test
```

Repository structure
- client/ — frontend application (TypeScript)
- server/ — backend services (TypeScript)
- shared/ — code shared between client and server
- drizzle/ — database migrations or drift configuration

Notes
- See `DESIGN_SYSTEM.md` for UI system details.
- See `todo.md` for outstanding work and planned tasks.

License
- Add a LICENSE file or replace this section with your project's license.
