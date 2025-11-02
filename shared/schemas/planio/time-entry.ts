import { z } from "zod";

/**
 * Planio custom field from API
 */
export const PlanioCustomFieldSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
});

/**
 * Planio time entry from API
 */
export const PlanioTimeEntrySchema = z.object({
  id: z.number(),
  project: z.object({
    id: z.number(),
    name: z.string(),
  }),
  issue: z.object({
    id: z.number(),
  }).optional(),
  user: z.object({
    id: z.number(),
    name: z.string(),
  }),
  activity: z.object({
    id: z.number(),
    name: z.string(),
  }),
  hours: z.number(),
  comments: z.string(),
  spent_on: z.iso.date(), // YYYY-MM-DD format
  created_on: z.iso.date(),
  custom_fields: z.array(PlanioCustomFieldSchema).optional().default([]),
}).loose();

/**
 * Planio time entries list response
 */
export const PlanioTimeEntriesResponseSchema = z.object({
  time_entries: z.array(PlanioTimeEntrySchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

export type PlanioCustomField = z.infer<typeof PlanioCustomFieldSchema>;
export type PlanioTimeEntry = z.infer<typeof PlanioTimeEntrySchema>;
export type PlanioTimeEntriesResponse = z.infer<typeof PlanioTimeEntriesResponseSchema>;
