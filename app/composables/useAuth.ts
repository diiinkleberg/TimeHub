import { authClient } from '~/lib/auth-client'
import type { User } from '#shared/types'

export const useAuth = async () => {
  const sessionData = await authClient.useSession(useFetch)

  const user = computed(() => sessionData.data.value?.user as User | undefined)
  const isAuthenticated = computed(() => !!user.value)
  const isPending = computed(() => sessionData.isPending)

  return {
    authClient,
    session: sessionData.data,
    isPending,
    user,
    isAuthenticated,

    signInWithPlanio: () =>
      authClient.signIn.social({
        provider: 'planio',
        callbackURL: '/dashboard',
        errorCallbackURL: '/error'
      }),
    linkGithubAccount: () =>
      authClient.linkSocial({
        provider: 'github',
        callbackURL: '/settings/general',
        errorCallbackURL: '/error'
      }),
    signOut: async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            sessionData.data.value = null
            navigateTo('/', { replace: true })
          }
        }
      })
    }
  }
}
