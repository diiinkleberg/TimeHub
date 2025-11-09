import { PlanioCreateTimeEntrySchema, type PlanioCreateTimeEntryInput } from '#shared/schemas/planio/time-entry'
import { ZodError } from 'zod'
import { getUserAccessToken } from '~~/server/utils/auth'
import { useServerLogger } from '~~/server/utils/logger'

interface PlanioTimeEntryResponse {
  time_entry: {
    id: number
    project: { id: number, name: string }
    issue: { id: number }
    user: { id: number, name: string }
    activity: { id: number, name: string }
    hours: number
    comments: string
    spent_on: string
    created_on: string
    updated_on: string
  }
}

export default defineEventHandler(async (event) => {
  const logger = useServerLogger('planio:time-entry')
  const config = useRuntimeConfig()
  const baseUrl = config.authPlanioBaseUrl

  // Parse and validate request body
  const body = await readBody(event)

  let validatedBody: PlanioCreateTimeEntryInput
  try {
    validatedBody = PlanioCreateTimeEntrySchema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        message: error.issues[0]?.message || 'Invalid request data'
      })
    }
    throw error
  }

  // Get user's access token
  const accessToken = await getUserAccessToken(event, 'planio')

  try {
    const response = await $fetch<PlanioTimeEntryResponse>(
      `${baseUrl}/time_entries.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          time_entry: {
            issue_id: validatedBody.issue_id,
            hours: validatedBody.hours,
            comments: validatedBody.comments,
            spent_on: validatedBody.spent_on,
            ...(validatedBody.activity_id && {
              activity_id: validatedBody.activity_id
            })
          }
        }
      }
    )

    return response
  } catch (error: any) {
    logger.error(error, 'Failed to create Planio time entry')

    if (error.statusCode === 422) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Invalid Time Entry',
        message:
          'The time entry data was rejected by Planio. Please check your input.'
      })
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication Failed',
        message: 'Your Planio session has expired. Please re-authenticate.'
      })
    }

    if (error.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Issue Not Found',
        message: 'The specified issue could not be found.'
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error',
      message:
        error.message || 'Failed to create time entry. Please try again.'
    })
  }
})
