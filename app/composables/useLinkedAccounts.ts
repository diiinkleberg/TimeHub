interface LinkedAccountSummary {
  id?: string
  providerId: string
  providerType?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  [key: string]: unknown
}

export const useLinkedAccounts = async () => {
  const isClient = import.meta.client
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

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const refresh = async (showSpinner = true) => {
    if (!isClient) {
      return
    }

    if (showSpinner) {
      setLoading(true)
    }

    try {
      const response = await listAccounts()
      accounts.value = response?.data ?? []
    } catch (error) {
      console.error('Failed to load linked accounts:', error)
    } finally {
      if (showSpinner) {
        setLoading(false)
      }
      initialized.value = true
    }
  }

  if (!initialized.value) {
    if (isClient) {
      await refresh()
    } else {
      initialized.value = true
    }
  }

  const isGithubLinked = computed(() =>
    accounts.value.some(account => account.providerId === 'github')
  )

  const withLoading = async (task: () => Promise<void>) => {
    setLoading(true)

    try {
      await task()
    } finally {
      setLoading(false)
    }
  }

  const linkGithub = async () => {
    await withLoading(async () => {
      await linkGithubAccount()
      await refresh(false)
    })
  }

  const unlinkGithub = async () => {
    await withLoading(async () => {
      await unlinkGithubAccount()
      await refresh(false)
    })
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
