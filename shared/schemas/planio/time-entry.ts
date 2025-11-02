import { z } from "zod";

/**
 * Planio custom field from API
 */
export const PlanioCustomFieldSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional(),
});

/**
 * Planio time entry from API
 */
export const PlanioTimeEntrySchema = z.looseObject({
  id: z.number(),
  project: z.looseObject({
    id: z.number(),
    name: z.string(),
  }),
  issue: z
    .looseObject({
      id: z.number(),
    })
    .optional(),
  user: z.looseObject({
    id: z.number(),
    name: z.string(),
  }),
  activity: z.looseObject({
    id: z.number(),
    name: z.string(),
  }),
  hours: z.number(),
  comments: z.string().default(""),
  spent_on: z.iso.date(), // YYYY-MM-DD format
  created_on: z.iso.datetime(), // ISO 8601 timestamp
  updated_on: z.iso.datetime().optional(), // ISO 8601 timestamp
  custom_fields: z.array(PlanioCustomFieldSchema).optional().default([]),
});

/**
 * Planio time entries list response
 */
export const PlanioTimeEntriesResponseSchema = z.looseObject({
  time_entries: z.array(PlanioTimeEntrySchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

export type PlanioCustomField = z.infer<typeof PlanioCustomFieldSchema>;
export type PlanioTimeEntry = z.infer<typeof PlanioTimeEntrySchema>;
export type PlanioTimeEntriesResponse = z.infer<
  typeof PlanioTimeEntriesResponseSchema
>;
