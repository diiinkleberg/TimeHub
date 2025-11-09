import { authClient } from '~/lib/auth-client'

const PUBLIC_PATHS = new Set(['/', '/error'])

/**
 * Global authentication middleware
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  const isAuthenticated = Boolean(session.value?.user)
  const isPublicRoute = PUBLIC_PATHS.has(to.path)

  if (to.path === '/' && isAuthenticated) {
    return navigateTo('/dashboard', { replace: true })
  }

  if (!isPublicRoute && !isAuthenticated) {
    return navigateTo('/', { replace: true })
  }

  return undefined
})
