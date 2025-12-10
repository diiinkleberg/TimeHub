import { Octokit } from '@octokit/core'
import { GitHubCommitsResponseSchema } from '#shared/schemas/github/commits'
import { getUserAccessToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const repoFullName = (query.repo as string) || (query.full_name as string)
    const since = query.since as string | undefined
    const until = query.until as string | undefined
    const requestedDate = query.date as string | undefined
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

    const mapped = commits.slice(0, limit).map((commit) => {
      const message = commit.commit.message?.trim() ?? ''
      const [firstLine = ''] = message.split('\n')
      const summary = firstLine.trim() || '(no commit message)'
      const date = commit.commit.author?.date
        || commit.commit.committer?.date
        || new Date().toISOString()

      return {
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        summary,
        message: message || summary,
        date,
        repo: repoFullName
      }
    })

    const dateLabel = requestedDate
      || (since ? new Date(since).toISOString().slice(0, 10) : undefined)
      || new Date().toISOString().slice(0, 10)

    return GitHubCommitsResponseSchema.parse({
      success: true,
      date: dateLabel,
      repo: repoFullName,
      count: mapped.length,
      data: mapped
    })
  } catch (error: any) {
    console.error('GitHub commits error:', error)

    throw createError({
      statusCode: error.status || 500,
      message: error.message || 'Failed to fetch commits'
    })
  }
})
