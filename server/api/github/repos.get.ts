import { Octokit } from '@octokit/core'
import { getUserAccessToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Number(query.limit) || 50
    const page = Number(query.page) || 1
    const perPage = Math.min(Math.max(limit, 1), 100)

    const accessToken = await getUserAccessToken(event, 'github')
    const octokit = new Octokit({ auth: accessToken })

    const { data: repos } = await octokit.request('GET /user/repos', {
      per_page: perPage,
      page,
      sort: 'pushed',
      direction: 'desc'
    })

    const mapped = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner?.login,
      htmlUrl: repo.html_url,
      description: repo.description,
      defaultBranch: repo.default_branch,
      private: repo.private
    }))

    const search = (query.search as string | undefined)?.trim().toLowerCase()

    if (!search) {
      return mapped
    }

    return mapped.filter((repo) => {
      const label = `${repo.fullName} ${repo.description ?? ''}`.toLowerCase()
      return label.includes(search)
    })
  } catch (error: any) {
    console.error('GitHub repos error:', error)

    throw createError({
      statusCode: error.status || 500,
      message: error.message || 'Failed to fetch repositories'
    })
  }
})
