import type { H3Event } from 'h3'
import { auth } from '~~/server/lib/auth.config'

/**
 *
 * @param H3Event
 * @returns
 */

export async function requireAuth(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  event.context.user = session.user
  return session.user
}
