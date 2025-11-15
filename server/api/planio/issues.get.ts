import { PlanioIssuesResponseSchema } from '#shared/schemas/planio/issue'
import { getUserAccessToken } from '~~/server/utils/auth'
import { useServerLogger } from '~~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const logger = useServerLogger('planio:issues')
  try {
    const query = getQuery(event)
    const projectId = query.project_id as string | undefined
    const limit = query.limit as string | undefined

    const config = useRuntimeConfig()
    const baseUrl = config.authPlanioBaseUrl

    const accessToken = await getUserAccessToken(event, 'planio')

    const queryParams = {
      assigned_to: 'me',
      status_id: 'open',
      ...(projectId && { project_id: projectId }),
      ...(limit && { limit })
    }

    const response = await $fetch(`${baseUrl}/issues.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      query: queryParams
    })

    const validatedData = PlanioIssuesResponseSchema.parse(response)

    return validatedData.issues
  } catch (error) {
    logger.error(error, 'Failed to fetch Planio issues')
    throw error
  }
})
