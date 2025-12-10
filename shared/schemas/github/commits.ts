import { z } from 'zod'

/**
 * GitHub commit author/committer
 */
export const GitHubCommitAuthorSchema = z.object({
  name: z.string(),
  email: z.email(),
  date: z.iso.datetime()
})

/**
 * GitHub commit from API
 */
export const GitHubCommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    author: GitHubCommitAuthorSchema,
    committer: GitHubCommitAuthorSchema,
    message: z.string(),
    tree: z.object({
      sha: z.string()
    })
  }),
  html_url: z.url(),
  author: z
    .object({
      login: z.string(),
      avatar_url: z.url()
    })
    .nullable(),
  committer: z
    .object({
      login: z.string(),
      avatar_url: z.url()
    })
    .nullable()
})

/**
 * Simplified commit info used inside TimeHub UI
 */
export const GitHubCommitSummarySchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  summary: z.string(),
  message: z.string(),
  date: z.iso.datetime(),
  repo: z.string()
})

/**
 * GitHub commits search API response
 */
export const GitHubCommitsSearchResponseSchema = z.object({
  total_count: z.number(),
  incomplete_results: z.boolean(),
  items: z.array(GitHubCommitSchema)
})

/**
 * GitHub commits response (from our API)
 */
export const GitHubCommitsResponseSchema = z.object({
  success: z.boolean(),
  date: z.iso.date(),
  repo: z.string(),
  count: z.number(),
  data: z.array(GitHubCommitSummarySchema)
})

// Type exports
export type GitHubCommitAuthor = z.infer<typeof GitHubCommitAuthorSchema>
export type GitHubCommit = z.infer<typeof GitHubCommitSchema>
export type GitHubCommitSummary = z.infer<typeof GitHubCommitSummarySchema>
export type GitHubCommitsSearchResponse = z.infer<
  typeof GitHubCommitsSearchResponseSchema
>
export type GitHubCommitsResponse = z.infer<
  typeof GitHubCommitsResponseSchema
>
