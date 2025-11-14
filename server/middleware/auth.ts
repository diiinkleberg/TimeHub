import { auth } from '~~/server/lib/auth.config'

/**
 * @global Authentication middleware for protecting API routes.
 * @description This middleware checks for a valid session on incoming API requests,
 *              except for public routes such as authentication and health check endpoints.
 *              If a valid session is found, the user information is attached to the event context.
 *              If no valid session is found, a 401 Unauthorized error is thrown.
 */
export default defineEventHandler(async (event) => {
  const path = event.path

  if (!path.startsWith('/api')) {
    return
  }

  const publicApiPrefixes = [
    '/api/auth/',
    '/api/health',
    '/api/public/'
  ]

  // Allow Nuxt's internal API helpers (icons, islands, etc.) without auth
  const nuxtInternalApiPrefixes = [
    '/api/_nuxt',
    '/api/_nuxt_icon'
  ]

  if (
    publicApiPrefixes.some(prefix => path.startsWith(prefix))
    || nuxtInternalApiPrefixes.some(prefix => path.startsWith(prefix))
  ) {
    return
  }

  try {
    const session = await auth.api.getSession({
      headers: event.headers
    })

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'You must be signed in to access this resource'
      })
    }

    event.context.user = session.user
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid or expired session'
    })
  }
})
