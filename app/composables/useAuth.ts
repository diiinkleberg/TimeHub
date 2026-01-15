import type { ComputedRef, Ref } from 'vue'
import { createSingletonPromise } from '@vueuse/core'
import type { Session } from '~~/server/lib/auth.config'
import { authClient } from '~/lib/auth-client'
import type { User } from '#shared/types/auth'

interface UseAuthReturn {
  session: Ref<Session | null>
  user: ComputedRef<User | undefined>
  isAuthenticated: ComputedRef<boolean>
  signInWithPlanio: () => Promise<void>
  linkGithubAccount: () => Promise<void>
  listAccounts: () => ReturnType<typeof authClient.listAccounts>
  signOut: () => Promise<void>
  unlinkGithubAccount: () => Promise<void>
}

async function createAuth(): Promise<UseAuthReturn> {
  const { data: session } = await authClient.useSession(useFetch)

  const user = computed(() => session.value?.user as User | undefined)
  const isAuthenticated = computed(() => Boolean(user.value))

  const signInWithPlanio = async () => {
    await authClient.signIn.social({
      provider: 'planio',
      callbackURL: '/dashboard',
      errorCallbackURL: '/error'
    })
  }

  const linkGithubAccount = async () => {
    await authClient.linkSocial({
      provider: 'github',
      callbackURL: '/settings',
      errorCallbackURL: '/error'
    })
  }

  const unlinkGithubAccount = async () => {
    await authClient.unlinkAccount({
      providerId: 'github'
    })
  }

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          session.value = null
          await navigateTo('/', { replace: true })
        }
      }
    })
  }

  const listAccounts = () => authClient.listAccounts()

  return {
    session,
    user,
    isAuthenticated,
    signInWithPlanio,
    linkGithubAccount,
    listAccounts,
    signOut,
    unlinkGithubAccount
  }
}
// resuable auth singleton with leak prevention
const useAuthSingleton = import.meta.client
  ? createSingletonPromise(createAuth)
  : null

export const useAuth = () =>
  import.meta.client && useAuthSingleton
    ? useAuthSingleton()
    : createAuth()
