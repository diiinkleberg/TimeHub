import { PlanioTimeEntriesResponseSchema } from '#shared/schemas/planio/time-entry'
import { getUserAccessToken } from '~~/server/utils/auth'
import { useServerLogger } from '~~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const logger = useServerLogger('planio:time-entries')
  const query = getQuery(event)
  const { from, to, project_id, issue_id, limit } = query
  const sort = (query.sort as string) || 'spent_on:desc'

  const config = useRuntimeConfig()
  const baseUrl = config.authPlanioBaseUrl

  const accessToken = await getUserAccessToken(event, 'planio')
  try {
    const response = await $fetch(`${baseUrl}/time_entries.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        user_id: 'me',
        ...(from && { from: from as string }),
        ...(to && { to: to as string }),
        ...(project_id && { project_id: project_id as string }),
        ...(issue_id && { issue_id: issue_id as string }),
        ...(limit && { limit: limit as number }),
        include: 'issue',
        sort
      }
    })

    const validatedData = PlanioTimeEntriesResponseSchema.parse(response)
    return validatedData.time_entries
  } catch (error: any) {
    logger.error(
      {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        data: error.data
      },
      'Failed to fetch Planio time entries'
    )

    throw createError({
      statusCode: error.status || 500,
      message:
        error.data?.errors?.[0] || 'Failed to fetch time entries from Planio'
    })
  }
})
