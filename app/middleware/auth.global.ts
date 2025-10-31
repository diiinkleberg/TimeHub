import { authClient } from "~/lib/auth-client"

/**
 * Global authentication middleware.
 * - Redirects authenticated users away from the landing page.
 * - Protects non-public routes from unauthenticated access.
 * Uses replace navigation to avoid history stack issues.
 */


export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  const isAuthenticated = !!session.value?.user

  const isPublic = ['/', '/error'].includes(to.path)

  // Redirect logged-in users away from landing page
  if (to.path === '/' && isAuthenticated) {
    return navigateTo('/dashboard', { replace: true })
  }

  // Protect all non-public routes
  if (!isPublic && !isAuthenticated) {
    return navigateTo('/', { replace: true })
  }
})

