# TimeHub

Planio Time Tracking Wrapper built with Nuxt 4, Prisma ORM, and Better Auth.

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

### Prerequisites

- Node.js 20+
- pnpm
- SQL Server (local or remote) with TCP/IP enabled!
- Planio Application with this callback URL: `http://localhost:3000/api/auth/oauth2/callback/planio` for development

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

**Why this is needed:** See [Prisma & Nitro Bundling](#prisma--nitro-bundling) section below.

</details>

---

## Prisma & Nitro Bundling

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

## Resources

- [Nuxt 4 Documentation](https://nuxt.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Nuxt UI Documentation](https://ui.nuxt.com)