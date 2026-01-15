import { auth } from '~~/server/lib/auth.config'
import { createError, toWebRequest, type H3Event } from 'h3'

/**
 * Get user's access token for a specific OAuth provider
 *
 * @param event - H3 event context
 * @param providerId - OAuth provider ID (e.g., "planio", "google")
 * @returns Access token string
 * @throws 401 error if account not linked
 */
export async function getUserAccessToken(
  event: H3Event,
  providerId: string
): Promise<string> {
  const request = toWebRequest(event)

  const session = await auth.api.getSession({
    headers: request.headers
  })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Session not found. Please sign in again.'
    })
  }

  try {
    // Use Better Auth's getAccessToken API to handle token decryption and refresh
    const tokenResponse = await auth.api.getAccessToken({
      headers: request.headers,
      body: {
        providerId,
        userId: session.user.id
      }
    })

    return tokenResponse.accessToken
  } catch {
    throw createError({
      statusCode: 401,
      message: `No ${providerId} account linked`
    })
  }
}
