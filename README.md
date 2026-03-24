# TimeHub

TimeHub is a work-in-progress Planio time tracking wrapper built with Nuxt 4. It provides a modern web interface for authenticating with Planio and working with time tracking data through a custom application layer.

## Overview

This project combines a Nuxt-based frontend with server-side authentication and database-backed application state. It is designed as a practical full-stack project focused on authentication flows, external API integration, and maintainable web application structure.

## Tech Stack

- Nuxt 4
- Nuxt UI
- Better Auth
- Prisma ORM
- SQL Server
- TypeScript
- pnpm

## Current Features

- Planio OAuth authentication
- Server-side application logic with Nuxt
- SQL Server persistence through Prisma
- Better Auth integration
- Nuxt UI-based frontend
- Local development workflow with Prisma schema management

## Project Status

This project is still under active development. The current version is intended as a working prototype and learning project, with additional functionality and refinement planned.

## Prerequisites

Before running the project locally, make sure the following are installed and configured:

- Node.js 20+
- pnpm
- SQL Server (local or remote, with TCP/IP enabled)
- A Planio application configured with this development callback URL:

`http://localhost:3000/api/auth/oauth2/callback/planio`

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Update `.env` with your local database and authentication settings.

4. Generate the Better Auth schema:

```bash
pnpm run auth:generate
```

5. Push the Prisma schema to the database:

```bash
pnpm run db:push
```

6. Start the development server:

```bash
pnpm run dev
```

The app will then be available at:

`http://localhost:3000`

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the application for production |
| `pnpm preview` | Preview the production build |
| `pnpm db:generate` | Generate the Prisma Client |
| `pnpm db:push` | Push the schema to the database |
| `pnpm db:migrate` | Create and apply a migration |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm auth:generate` | Generate Better Auth schema |

## Configuration Notes

- SQL Server must be reachable from the application and correctly configured in `.env`.
- Planio OAuth must use the configured callback URL for local development.
- After schema changes, Prisma Client should be regenerated if needed.

## Troubleshooting

### Prisma Client not found

If Prisma Client is missing during development or build:

```bash
pnpm run db:generate
pnpm run build
```

### Production build issues with Prisma

If the production build fails with Prisma-related runtime or bundling errors, verify that `nuxt.config.ts` includes the Nitro configuration needed for Prisma compatibility.

Typical issues include:

- `Cannot find module '@prisma/client'`
- `ERR_INVALID_FILE_URL_PATH`
- `__dirname is not defined`

### Why this happens

Prisma depends on runtime binary resolution, and Nitro bundling can interfere with that behavior in production builds. Ensuring the correct Nitro and Prisma generator configuration helps avoid these issues.

## Learning Goals

This project is mainly used to explore and demonstrate:

- OAuth integration with external providers
- full-stack Nuxt application structure
- authentication and session management
- database access with Prisma
- practical project organization for real-world web apps

## Resources

- [Nuxt Documentation](https://nuxt.com)
- [Nuxt UI Documentation](https://ui.nuxt.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://better-auth.com)
