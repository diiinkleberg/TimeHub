import { betterAuth } from 'better-auth'
import { genericOAuth } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './db/prisma'
import { PlanioUserResponseSchema } from '#shared/schemas'
import { useServerLogger } from '../utils/logger'

/**
 * @description Authentication Configuration
 * @see https://better-auth.com
 */
const config = {
  authGithubClientId: process.env.AUTH_GITHUB_CLIENT_ID || '',
  authGithubClientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET || '',
  authPlanioClientId: process.env.AUTH_PLANIO_CLIENT_ID || '',
  authPlanioClientSecret: process.env.AUTH_PLANIO_CLIENT_SECRET || '',
  authPlanioBaseUrl: process.env.AUTH_PLANIO_BASE_URL || '',
  authPlanioScopes: process.env.AUTH_PLANIO_SCOPES || 'view_issues,view_time_entries',
  public: {
    nodeEnv: process.env.NODE_ENV || 'development'
  }
}

const toPlanioUrl = (path: string) => `${config.authPlanioBaseUrl}${path}`

const planioScopes = config.authPlanioScopes
  .split(',')
  .map(scope => scope.trim())
  .filter(Boolean)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlserver'
  }),

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
      clientSecret: config.authGithubClientSecret,
      scope: ['read:user', 'user:email', 'repo']
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
          authorizationUrl: toPlanioUrl('/oauth/authorize'),
          tokenUrl: toPlanioUrl('/oauth/token'),
          userInfoUrl: toPlanioUrl('/users/current.json'),
          scopes: planioScopes,

          /**
           * Fetch user info from Planio API
           * @param accessToken - OAuth access token
           * @returns User profile information
           */
          getUserInfo: async ({ accessToken }) => {
            const planioUserEndpoint = toPlanioUrl('/users/current.json')

            try {
              // Fetch user info from Planio API
              const response = await $fetch(planioUserEndpoint, {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 10000
              })

              // Validate response
              const { user: planioUser }
                = PlanioUserResponseSchema.parse(response)

              const avatarSeed = encodeURIComponent(
                planioUser.name?.slice(0, 3) || String(planioUser.id)
              )

              const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${avatarSeed}&backgroundColor=0ea5e9,6366f1`

              return {
                id: String(planioUser.id),
                name: planioUser.name,
                email: planioUser.mail,
                emailVerified: true,
                image: avatarUrl,

                // Custom fields
                firstName: planioUser.firstname,
                lastName: planioUser.lastname
              }
            } catch (error) {
              const logger = useServerLogger('auth:planio')
              logger.error(error, 'Failed to fetch Planio user info')
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
