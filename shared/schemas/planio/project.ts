import { z } from "zod";

/**
 * Planio project from API
 */
export const PlanioProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  identifier: z.string(),
  description: z.string(),
});

/**
 * Planio projects list response
 */
export const PlanioProjectsResponseSchema = z.object({
  projects: z.array(PlanioProjectSchema),
  total_count: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

export type PlanioProject = z.infer<typeof PlanioProjectSchema>;
export type PlanioProjectsResponse = z.infer<typeof PlanioProjectsResponseSchema>;
