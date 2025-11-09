import { z } from 'zod'

/**
 * Planio custom field from API
 */
export const PlanioCustomFieldSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional()
})

/**
 * Planio time entry from API
 */
export const PlanioTimeEntrySchema = z.looseObject({
  id: z.number(),
  project: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  issue: z
    .looseObject({
      id: z.number()
      // Don't include subject - API doesn't provide it in time_entries
    })
    .optional(),
  user: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  activity: z.looseObject({
    id: z.number(),
    name: z.string()
  }),
  hours: z.number(),
  comments: z.string().default(''),
  spent_on: z.iso.date(), // YYYY-MM-DD format
  created_on: z.iso.datetime(), // ISO 8601 timestamp
  updated_on: z.iso.datetime().optional(), // ISO 8601 timestamp
  custom_fields: z.array(PlanioCustomFieldSchema).optional().default([])
})

/**
 * Planio time entries list response
 */
export const PlanioTimeEntriesResponseSchema = z.looseObject({
  time_entries: z.array(PlanioTimeEntrySchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
})

/**
 * Payload for creating a Planio time entry
 */
export const PlanioCreateTimeEntrySchema = z.object({
  issue_id: z.number().positive('Issue ID must be a positive number'),
  hours: z
    .number()
    .min(0.25, 'Minimum time entry is 0.25 hours (15 minutes)')
    .max(24, 'Maximum time entry is 24 hours'),
  comments: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description is too long'),
  spent_on: z.iso.date(),
  activity_id: z.number().optional()
})

export type PlanioCustomField = z.infer<typeof PlanioCustomFieldSchema>
export type PlanioTimeEntry = z.infer<typeof PlanioTimeEntrySchema>
export type PlanioTimeEntriesResponse = z.infer<
  typeof PlanioTimeEntriesResponseSchema
>
export type PlanioCreateTimeEntryInput = z.infer<
  typeof PlanioCreateTimeEntrySchema
>
