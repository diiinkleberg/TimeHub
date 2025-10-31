# TimeHub

A time tracking application built with Nuxt 4, Prisma ORM, and Better Auth.

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

## Features

- 🔐 **Authentication**: Better Auth with GitHub and Planio OAuth
- 🗄️ **Database**: SQL Server with Prisma ORM
- 🎨 **UI**: Nuxt UI with Tailwind CSS
- 🧪 **Testing**: Vitest + Playwright (coming soon)
- 📦 **Type-Safe**: Full TypeScript support

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- SQL Server (local or remote)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example .env

# 3. Update .env with your database credentials

# 4. Generate Prisma Client
pnpm run db:generate

# 5. Generate Better Auth schema
pnpm run auth:generate

# 6. Push schema to database
pnpm run db:push

# 7. Start development server
pnpm run dev
```

Visit `http://localhost:3000` 🚀

---

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:push` | Sync schema to database |
| `pnpm db:migrate` | Create migration |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm auth:generate` | Generate Better Auth schema |

---

## Documentation

- 📁 [Project Structure](#project-structure)
- 🔧 [Environment Variables](#environment-variables)
- 🗄️ [Database Configuration](#database-configuration)
- 🚀 [Deployment Guide](#deployment)
- 🐛 [Troubleshooting](#troubleshooting)

---

## Project Structure

```
TimeHub/
├── app/                     # Application code (Nuxt 4 app/ directory)
│   ├── assets/              # CSS and static assets
│   ├── components/          # Vue components
│   │   └── auth/            # Authentication components
│   ├── composables/         # Vue composables
│   ├── layouts/             # Page layouts
│   ├── lib/                 # Client-side libraries
│   ├── middleware/          # Client-side middleware
│   ├── pages/               # Application pages
│   ├── stores/              # Pinia stores
│   ├── types/               # TypeScript type definitions
│   ├── app.config.ts        # Nuxt UI configuration
│   ├── app.vue              # Root component
│   └── error.vue            # Error page
├── server/                  # Server-side code
│   ├── api/                 # API endpoints
│   │   └── auth/            # Better Auth endpoints
│   ├── lib/                 # Server utilities
│   │   ├── db/              # Database configuration
│   │   │   ├── schema.prisma    # Prisma schema
│   │   │   └── prisma.ts        # Prisma Client instance
│   │   └── auth.config.ts   # Better Auth configuration
│   ├── middleware/          # Server middleware
│   └── utils/               # Server utilities
├── shared/                  # Shared types (client + server)
│   └── types/               # TypeScript types
├── .env                     # Environment variables
├── nuxt.config.ts           # Nuxt configuration
├── prisma.config.ts         # Prisma configuration
└── package.json             # Dependencies and scripts
```

---

## Database Configuration

### Prisma Setup

This project uses **Prisma ORM**.

**File structure:**
```
server/lib/db/
├── schema.prisma        # Database schema
└── prisma.ts            # Singleton Prisma Client instance

node_modules/
└── @prisma/client/      # Generated Prisma Client (default location)
```

### Schema Overview

The database uses four main models for Better Auth:

- **User**: User accounts with email verification
- **Session**: Active user sessions with token management
- **Account**: OAuth provider accounts (GitHub, Planio)
- **Verification**: Email verification tokens

### Development Workflow

```bash
# After changing schema.prisma
pnpm run db:generate     # Regenerate Prisma Client
pnpm run db:push         # Sync to database (dev)

# For production-ready migrations
pnpm run db:migrate      # Create migration files
```

### Prisma Studio

Browse and edit your database with Prisma's GUI:

```bash
pnpm run db:studio
```

Visit `http://localhost:5555`

---

## Deployment

### Building for Production

```bash
# Build the application
pnpm run build

# The .output/ folder contains everything needed to run
```

### Running in Production

**Option 1: Node.js**
```bash
node .output/server/index.mjs
```

### Environment Variables in Production

Set these on your production server:
```bash
export DATABASE_URL="sqlserver://production-server:1433;..."
export BETTER_AUTH_SECRET="production-secret-32-chars"
export BETTER_AUTH_URL="https://timehub.company.com"
export NODE_ENV="production"
```

Or copy `.env` alongside `.output/`:
```bash
cp .env /var/www/timehub/
cd /var/www/timehub
node .output/server/index.mjs
```

---

## Troubleshooting

### Common Issues

<details>
<summary><b>Prisma Client not found</b></summary>

**Symptom:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
pnpm run db:generate
pnpm run build
```

</details>

<details>
<summary><b>Production build fails with Prisma errors</b></summary>

**Symptom:** `ERR_INVALID_FILE_URL_PATH` or `__dirname is not defined`

**Cause:** Nitro is bundling Prisma (should be external)

**Solution:** Verify `nuxt.config.ts` has this configuration:

```typescript
export default defineNuxtConfig({
  nitro: {
    experimental: {
      wasm: true,
    },
    esbuild: {
      options: {
        target: "es2024",
      }
    }
  }
});
```

**Why this is needed:** [Read the technical explanation](#technical-details-prisma--nitro-bundling)

</details>

<details>
<summary><b>Hot reload not working</b></summary>

**Solution:** Restart dev server with clean cache:
```bash
rm -rf .nuxt node_modules/.vite
pnpm dev
```

</details>

---

## Technical Details: Prisma & Nitro Bundling

<details>
<summary><b>Why special Nitro configuration is required</b></summary>

### The Problem

When building for production, Nuxt's Nitro bundler (Rollup) tries to bundle all dependencies into a single `.mjs` file. This breaks Prisma because:

1. **Prisma uses native binaries** - The Prisma Client loads platform-specific query engine binaries (`.node` files) at runtime
2. **ESM bundling breaks path resolution** - Prisma uses `import.meta.url` to locate binaries:
   ```javascript
   // Before bundling (works):
   import.meta.url // "file:///E:/Repos/TimeHub/node_modules/@prisma/client/index.js"
   
   // After bundling (breaks):
   import.meta.url // "file:///_entry.js" (invalid path)
   ```
3. **`createRequire()` fails** - Prisma needs `createRequire(import.meta.url)` but the bundled path is invalid

### The Solution

Configure Nitro to use modern build targets that handle ESM properly:

```typescript
nitro: {
  experimental: {
    wasm: true,  // Enable WebAssembly support
  },
  esbuild: {
    options: {
      target: "es2024",  // Modern target that handles import.meta better
    }
  }
}
```

### What Happens During Build

1. ✅ Nuxt bundles your application code
2. ✅ Prisma Client stays in `node_modules/@prisma/client/` (not bundled)
3. ✅ Query engine binaries included in the output
4. ✅ Modern ESM target handles `import.meta.url` correctly
5. ✅ At runtime, server loads Prisma from `node_modules`

### Generator Configuration

```prisma
generator client {
  provider      = "prisma-client-js"
  runtime       = "nodejs"           // Node.js runtime (not edge)
  engineType    = "library"          // Better ESM compatibility
  binaryTargets = ["native", "windows"]  // Development + deployment targets
}
```

| Option | Purpose |
|--------|---------|
| `runtime = "nodejs"` | Ensures Node.js-specific code generation |
| `engineType = "library"` | Uses Node.js native modules (better for ESM) |
| `binaryTargets` | Includes query engines for dev + production OS |

### Singleton Pattern

The `server/lib/db/prisma.ts` uses a singleton to prevent connection exhaustion:

```typescript
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma; // Survives HMR in dev
}
```

**Benefits:**
- ✅ Only one Prisma Client instance
- ✅ Prevents connection pool exhaustion
- ✅ Persists across hot reloads in dev

### Prisma Configuration File

The `prisma.config.ts` points to the custom schema location:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "server/lib/db/schema.prisma",  // Custom schema location
  migrations: {
    path: "server/lib/db/migrations",      // Custom migrations location
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

This allows keeping the schema in `server/lib/db/` while the generated client goes to the standard `node_modules/@prisma/client/` location.

</details>

---

## Resources

- [Nuxt 4 Documentation](https://nuxt.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Nuxt UI Documentation](https://ui.nuxt.com)