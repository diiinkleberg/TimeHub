import type { SimpleProject } from '#shared/types/planio'
import { PlanioIssuesResponseSchema } from '#shared/schemas/planio/issue'
import { getUserAccessToken } from '~~/server/utils/auth'
import { useServerLogger } from '~~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const logger = useServerLogger('planio:projects')
  try {
    const config = useRuntimeConfig()
    const baseUrl = config.authPlanioBaseUrl
    const accessToken = await getUserAccessToken(event, 'planio')

    const response = await $fetch(`${baseUrl}/issues.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        assigned_to_id: 'me',
        limit: 100,
        status_id: '*'
      }
    })

    const { issues } = PlanioIssuesResponseSchema.parse(response)

    // Extract unique projects from issues
    const uniqueProjects = Array.from(
      new Map(
        issues.map(issue => [
          issue.project.id,
          {
            id: issue.project.id,
            name: issue.project.name
          } satisfies SimpleProject
        ])
      ).values()
    )

    return uniqueProjects
  } catch (error) {
    logger.error(error, 'Failed to fetch Planio projects')
    throw error
  }
})
