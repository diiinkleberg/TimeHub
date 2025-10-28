// shared/planio/contracts.ts
import { z } from 'zod'

/**
 * Planio User Schema
 * @description Core user fields from Planio API response
 */
export const PlanioUserSchema = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  name: z.string(),
  mail: z.email()
})

/**
 * Planio API Response Wrapper
 */
export const PlanioUserResponseSchema = z.object({
  user: PlanioUserSchema
})

// Type exports
export type PlanioUser = z.infer<typeof PlanioUserSchema>
export type PlanioUserResponse = z.infer<typeof PlanioUserResponseSchema>
