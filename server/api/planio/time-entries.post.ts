import { z } from "zod";
import { auth } from "~~/server/lib/auth.config";
import { getUserAccessToken } from "~~/server/utils/auth";

const CreateTimeEntrySchema = z.object({
  issue_id: z.number(),
  hours: z.number().min(0.25).max(24),
  comments: z.string().min(1),
  spent_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  activity_id: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validatedBody = CreateTimeEntrySchema.parse(body);

  const config = useRuntimeConfig();
  const baseUrl = config.authPlanioBaseUrl;

  const accessToken = await getUserAccessToken(event, "planio");

  try {
    const response = await $fetch(`${baseUrl}/time_entries.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: {
        time_entry: {
          issue_id: validatedBody.issue_id,
          hours: validatedBody.hours,
          comments: validatedBody.comments,
          spent_on: validatedBody.spent_on,
          activity_id: validatedBody.activity_id,
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Failed to create time entry:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to create time entry",
    });
  }
});