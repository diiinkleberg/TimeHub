import { z } from 'zod'

/**
 * Planio project from API
 */
export const PlanioProjectSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  identifier: z.string().optional(),
  description: z.string().optional().default(''),
  status: z.number().optional(),
  is_public: z.boolean().optional(),
  created_on: z.iso.datetime().optional(),
  updated_on: z.iso.datetime().optional()
})

/**
 * Planio projects list response
 */
export const PlanioProjectsResponseSchema = z.looseObject({
  projects: z.array(PlanioProjectSchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
})

export type PlanioProject = z.infer<typeof PlanioProjectSchema>
export type PlanioProjectsResponse = z.infer<
  typeof PlanioProjectsResponseSchema
>
