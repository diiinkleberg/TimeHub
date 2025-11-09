import { z } from 'zod'

/**
 * Planio user from API
 */
export const PlanioUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string(),
  mail: z.email(),
  firstname: z.string().optional(),
  lastname: z.string().optional()
})

/**
 * Planio user API response
 */
export const PlanioUserResponseSchema = z.object({
  user: PlanioUserSchema
})

export type PlanioUser = z.infer<typeof PlanioUserSchema>
export type PlanioUserResponse = z.infer<typeof PlanioUserResponseSchema>
