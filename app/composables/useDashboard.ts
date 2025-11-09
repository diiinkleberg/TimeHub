import { createSharedComposable } from '@vueuse/core'

const SHORTCUTS = {
  'g-h': '/',
  'g-i': '/dashboard',
  'g-s': '/settings'
} as const

const registerShortcuts = (router: ReturnType<typeof useRouter>) => {
  defineShortcuts(
    Object.fromEntries(
      Object.entries(SHORTCUTS).map(([combo, path]) => [
        combo,
        () => router.push(path)
      ])
    ) as Record<string, () => void>
  )
}

const _useDashboard = () => {
  if (import.meta.server) {
    return
  }

  const router = useRouter()
  registerShortcuts(router)
}

export const useDashboard = createSharedComposable(_useDashboard)
