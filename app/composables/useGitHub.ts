import type { GitHubCommitSummary } from '#shared/schemas/github/commits'

export interface GitHubRepoOption {
  id: number
  name: string
  fullName: string
  owner?: string | null
  description?: string | null
  htmlUrl?: string | null
  private?: boolean
}

export const useGitHub = () => {
  const repos = ref<GitHubRepoOption[]>([])
  const repoLoading = ref(false)
  const repoError = ref<string | null>(null)

  const commits = ref<GitHubCommitSummary[]>([])
  const commitsLoading = ref(false)
  const commitsError = ref<string | null>(null)

  const fetchRepos = async () => {
    repoLoading.value = true
    repoError.value = null
    try {
      repos.value = await $fetch<GitHubRepoOption[]>('/api/github/repos')
    } catch (error: any) {
      repoError.value = error.message || 'Failed to load repositories'
    } finally {
      repoLoading.value = false
    }
  }

  const fetchCommits = async (repo: string, date: Date) => {
    commitsLoading.value = true
    commitsError.value = null
    try {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)

      const response = await $fetch<{ data: GitHubCommitSummary[] }>('/api/github/commits', {
        query: {
          repo,
          since: start.toISOString(),
          until: end.toISOString(),
          limit: 100
        }
      })
      commits.value = response.data
    } catch (error: any) {
      commitsError.value = error.message || 'Failed to load commits'
      commits.value = []
    } finally {
      commitsLoading.value = false
    }
  }

  return {
    repos,
    repoLoading,
    repoError,
    commits,
    commitsLoading,
    commitsError,
    fetchRepos,
    fetchCommits
  }
}
