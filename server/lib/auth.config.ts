import { betterAuth } from 'better-auth'
import { genericOAuth } from 'better-auth/plugins'
import { z } from 'zod'
import { PlanioUserResponseSchema } from '#shared/types/planio'
import { dialect } from './db'
import { authLogger } from '../utils/logger'

/**
 * Authentication configuration using BetterAuth with Drizzle ORM adapter.
 * Supports GitHub and Planio OAuth providers.
 * Includes session management and account linking features.
 * @see https://better-auth.com
 */

const config = useRuntimeConfig()

export const auth = betterAuth({
  database: {
    dialect,
    type: 'mssql'
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ['github', 'planio'],
      allowDifferentEmails: true
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 // 1 hour
    },
    freshAge: 60 * 60 * 24 // 1 day
  },
  advanced: {
    cookiePrefix: 'th',
    useSecureCookies: config.public.nodeEnv === 'production',
    crossSubDomainCookies: {
      enabled: false
    }
  },

  socialProviders: {
    github: {
      clientId: config.authGithubClientId,
      clientSecret: config.authGithubClientSecret
    }
  },

  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: false
      },
      lastName: {
        type: 'string',
        required: false
      }
    }
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'planio',
          clientId: config.authPlanioClientId,
          clientSecret: config.authPlanioClientSecret,
          pkce: true,
          authorizationUrl: `${config.authPlanioBaseUrl}/oauth/authorize`,
          tokenUrl: `${config.authPlanioBaseUrl}/oauth/token`,
          userInfoUrl: `${config.authPlanioBaseUrl}/users/current.json`,
          scopes: config.authPlanioScopes.split(',').map((s: string) => s.trim()),

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
                  timeout: 10000
                }
              )

              // Validate response
              const validated = PlanioUserResponseSchema.safeParse(response)

              if (!validated.success) {
                const errorTree = z.treeifyError(validated.error)
                authLogger.error(
                  'Failed to validate Planio user response:',
                  errorTree
                )
                throw new Error('Invalid Planio user response')
              }

              const planioUser = validated.data.user

              return {
                id: String(planioUser.id),
                name: planioUser.name,
                email: planioUser.mail,
                emailVerified: true,
                image: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(planioUser.name)}&backgroundColor=0ea5e9,6366f1`,

                // Custom fields
                firstName: planioUser.firstname,
                lastName: planioUser.lastname
              }
            } catch (error) {
              authLogger.error('Error fetching Planio user info:', error)
              throw error
            }
          }
        }
      ]
    })
  ]
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
