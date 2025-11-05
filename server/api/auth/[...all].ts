import { auth } from '~~/server/lib/auth.config'

/**
 * API route for authentication handling.
 * @returns {Promise<any>} The authentication response.
 */
export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
