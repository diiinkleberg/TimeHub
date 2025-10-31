import { z } from "zod";

/**
 * Planio issue from API
 */
export const PlanioIssueSchema = z.object({
  id: z.number(),
  project: z.object({
    id: z.number(),
    name: z.string(),
  }),
  status: z.object({
    id: z.number(),
    name: z.string(),
  }),
  subject: z.string(),
  description: z.string(),
  estimated_hours: z.number().nullable(),
  spent_hours: z.number().nullable(),
  total_estimated_hours: z.number().nullable(),
  total_spent_hours: z.number().nullable(),
});

/**
 * Planio issues list response
 */
export const PlanioIssuesResponseSchema = z.object({
  issues: z.array(PlanioIssueSchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

export type PlanioIssue = z.infer<typeof PlanioIssueSchema>;
export type PlanioIssuesResponse = z.infer<typeof PlanioIssuesResponseSchema>;
