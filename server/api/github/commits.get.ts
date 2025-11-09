import { Octokit } from '@octokit/core'
import { getUserAccessToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const repoFullName = (query.repo as string) || (query.full_name as string)
    const since = query.since as string | undefined
    const until = query.until as string | undefined
    const limit = Number(query.limit) || 20

    if (!repoFullName) {
      throw createError({
        statusCode: 400,
        message: 'Repository is required'
      })
    }

    const [owner, repo] = repoFullName.split('/')

    if (!owner || !repo) {
      throw createError({
        statusCode: 400,
        message: 'Repository must be provided as owner/repo'
      })
    }

    const accessToken = await getUserAccessToken(event, 'github')
    const octokit = new Octokit({ auth: accessToken })

    const perPage = Math.min(Math.max(limit, 1), 100)

    const { data: commits } = await octokit.request(
      'GET /repos/{owner}/{repo}/commits',
      {
        owner,
        repo,
        since,
        until,
        per_page: perPage
      }
    )

    return commits.slice(0, limit).map(commit => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      date: commit.commit.author?.date || commit.commit.committer?.date,
      url: commit.html_url,
      repo: repoFullName
    }))
  } catch (error: any) {
    console.error('GitHub commits error:', error)

    throw createError({
      statusCode: error.status || 500,
      message: error.message || 'Failed to fetch commits'
    })
  }
})
