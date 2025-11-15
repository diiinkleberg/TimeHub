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

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const refresh = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true)
    }

    try {
      const response = await listAccounts()
      accounts.value = response?.data ?? []
    } finally {
      if (showSpinner) {
        setLoading(false)
      }
      initialized.value = true
    }
  }

  if (!initialized.value) {
    await refresh()
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
