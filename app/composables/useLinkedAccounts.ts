import { computed } from 'vue'
import { useState } from '#app'

interface LinkedAccountSummary {
  id?: string
  providerId: string
  providerType?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  [key: string]: unknown
}

export const useLinkedAccounts = async () => {
  const accounts = useState<LinkedAccountSummary[]>(
    'linked-accounts',
    () => []
  )
  const loading = useState<boolean>('linked-accounts-loading', () => false)
  const initialized = useState<boolean>(
    'linked-accounts-initialized',
    () => false
  )

  const {
    listAccounts,
    linkGithubAccount,
    unlinkGithubAccount
  } = await useAuth()

  const refresh = async () => {
    loading.value = true

    try {
      const response = await listAccounts()
      accounts.value = response?.data ?? []
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  if (!initialized.value) {
    await refresh()
  }

  const isGithubLinked = computed(() =>
    accounts.value.some(account => account.providerId === 'github')
  )

  const linkGithub = async () => {
    loading.value = true

    try {
      await linkGithubAccount()
      await refresh()
    } finally {
      loading.value = false
    }
  }

  const unlinkGithub = async () => {
    loading.value = true

    try {
      await unlinkGithubAccount()
      await refresh()
    } finally {
      loading.value = false
    }
  }

  return {
    accounts,
    loading,
    isGithubLinked,
    refresh,
    linkGithub,
    unlinkGithub
  }
}
