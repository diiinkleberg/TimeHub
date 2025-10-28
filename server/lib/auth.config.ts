import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db/prisma";
import { z } from "zod";
import { PlanioUserResponseSchema } from "~~/shared/types/planio/contracts";

/**
 * Authentication configuration using BetterAuth with Drizzle ORM adapter.
 * Supports GitHub and Planio OAuth providers.
 * Includes session management and account linking features.
 * @see https://better-auth.com
 */
const config =
  typeof useRuntimeConfig === "function"
    ? useRuntimeConfig()
    : {
        authGithubClientId: process.env.AUTH_GITHUB_CLIENT_ID || "",
        authGithubClientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET || "",
        authPlanioClientId: process.env.AUTH_PLANIO_CLIENT_ID || "",
        authPlanioClientSecret: process.env.AUTH_PLANIO_CLIENT_SECRET || "",
        authPlanioBaseUrl: process.env.AUTH_PLANIO_BASE_URL || "",
        authPlanioScopes: process.env.AUTH_PLANIO_SCOPES || "read",
        public: {
          nodeEnv: process.env.NODE_ENV || "development",
        },
      };

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlserver",
  }),

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "planio"],
      allowDifferentEmails: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
    freshAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    cookiePrefix: "th",
    useSecureCookies: config.public.nodeEnv === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  socialProviders: {
    github: {
      clientId: config.authGithubClientId,
      clientSecret: config.authGithubClientSecret,
    },
  },

  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "planio",
          clientId: config.authPlanioClientId,
          clientSecret: config.authPlanioClientSecret,
          pkce: true,
          authorizationUrl: `${config.authPlanioBaseUrl}/oauth/authorize`,
          tokenUrl: `${config.authPlanioBaseUrl}/oauth/token`,
          userInfoUrl: `${config.authPlanioBaseUrl}/users/current.json`,
          scopes: config.authPlanioScopes
            .split(",")
            .map((s: string) => s.trim()),

          /**
           * Fetch user info from Planio API
           * @param accessToken - OAuth access token
           * @returns User profile information
           */
          getUserInfo: async ({ accessToken }) => {
            try {
              // Fetch user info from Planio API
              const response = await $fetch(
                `${config.authPlanioBaseUrl}/users/current.json`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  timeout: 10000,
                },
              );

              // Validate response
              const validated = PlanioUserResponseSchema.safeParse(response);

              if (!validated.success) {
                const errorTree = z.treeifyError(validated.error);
                console.error(
                  "Failed to validate Planio user response:",
                  errorTree,
                );
                throw new Error("Invalid Planio user response");
              }

              const planioUser = validated.data.user;

              return {
                id: String(planioUser.id),
                name: planioUser.name,
                email: planioUser.mail,
                emailVerified: true,
                image: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
                  planioUser.name,
                )}&backgroundColor=0ea5e9,6366f1`,

                // Custom fields
                firstName: planioUser.firstname,
                lastName: planioUser.lastname,
              };
            } catch (error) {
              console.error("Error fetching Planio user info:", error);
              throw error;
            }
          },
        },
      ],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
