export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/devtools",
    "@nuxt/test-utils",
    "@nuxt/fonts",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "@vueuse/nuxt",
  ],

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    databaseHost: process.env.DATABASE_HOST,
    databasePort: process.env.DATABASE_PORT,
    databaseName: process.env.DATABASE_NAME,
    databaseUser: process.env.DATABASE_USER,
    databasePassword: process.env.DATABASE_PASSWORD,
    databaseTrustServerCert: process.env.DATABASE_TRUST_SERVER_CERT === "true",

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
    "/": { prerender: true },
  },

  compatibilityDate: "2025-01-15",

  nitro: {
    experimental: {
      openAPI: true,
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
});