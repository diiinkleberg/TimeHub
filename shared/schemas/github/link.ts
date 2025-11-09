import { z } from 'zod'

/**
 * GitHub account link status
 */
export const GitHubLinkStatusSchema = z.object({
  linked: z.boolean()
})

/**
 * GitHub unlink response)
 */
export const GitHubUnlinkResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

// Type exports
export type GitHubLinkStatus = z.infer<typeof GitHubLinkStatusSchema>
export type GitHubUnlinkResponse = z.infer<typeof GitHubUnlinkResponseSchema>
