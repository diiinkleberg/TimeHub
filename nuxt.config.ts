export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/test-utils",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
  ],

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,

    betterAuthSecret: process.env.BETTER_AUTH_SECRET,

    authGithubClientId: process.env.AUTH_GITHUB_CLIENT_ID,
    authGithubClientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,

    authPlanioBaseUrl: process.env.AUTH_PLANIO_BASE_URL,
    authPlanioClientId: process.env.AUTH_PLANIO_CLIENT_ID,
    authPlanioClientSecret: process.env.AUTH_PLANIO_CLIENT_SECRET,
    authPlanioScopes: process.env.AUTH_PLANIO_SCOPES,

    public: {
      appName: process.env.APP_NAME || "TimeHub",
      betterAuthUrl: process.env.BETTER_AUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  },

  routeRules: {
    "api/**": { cors: true },
  },

  compatibilityDate: "2025-01-15",

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