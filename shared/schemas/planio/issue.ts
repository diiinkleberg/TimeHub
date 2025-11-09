import { z } from 'zod'

/**
 * Planio issue from API
 */
export const PlanioIssueSchema = z.looseObject({
  id: z.number(),
  project: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  tracker: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  status: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  priority: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  author: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  assigned_to: z
    .looseObject({
      id: z.number(),
      name: z.string()
    })
    .optional(),
  subject: z.string(),
  description: z.string().default(''),
  start_date: z.iso.date().nullable().optional(),
  due_date: z.iso.date().nullable().optional(),
  done_ratio: z.number().default(0),
  estimated_hours: z.number().nullable().optional(),
  spent_hours: z.number().nullable().optional(),
  total_estimated_hours: z.number().nullable().optional(),
  total_spent_hours: z.number().nullable().optional(),
  created_on: z.iso.datetime(),
  updated_on: z.iso.datetime(),
  closed_on: z.iso.datetime().nullable().optional(),
  custom_fields: z.array(z.any()).optional().default([])
})

/**
 * Planio issues list response
 */
export const PlanioIssuesResponseSchema = z.looseObject({
  issues: z.array(PlanioIssueSchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
})

export type PlanioIssue = z.infer<typeof PlanioIssueSchema>
export type PlanioIssuesResponse = z.infer<typeof PlanioIssuesResponseSchema>
