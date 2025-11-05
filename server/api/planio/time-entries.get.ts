import { PlanioTimeEntriesResponseSchema } from "#shared/schemas/planio/time-entry";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { from, to, project_id, issue_id, limit } = query;
  const sort = (query.sort as string) || "spent_on:desc";

  const config = useRuntimeConfig();
  const baseUrl = config.authPlanioBaseUrl;

  const accessToken = await getUserAccessToken(event, "planio");
  try {
    const response = await $fetch(`${baseUrl}/time_entries.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      query: {
        user_id: "me",
        ...(from && { from: from as string }),
        ...(to && { to: to as string }),
        ...(project_id && { project_id: project_id as string }),
        ...(issue_id && { issue_id: issue_id as string }),
        ...(limit && { limit: limit as number}),
        sort,
      },
    });

    const validatedData = PlanioTimeEntriesResponseSchema.parse(response);
    return validatedData.time_entries;
  } catch (error: any) {
    console.error("❌ Planio API Error:", {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      data: error.data,
    });
    
    throw createError({
      statusCode: error.status || 500,
      message: error.data?.errors?.[0] || "Failed to fetch time entries from Planio",
    });
  }
});
