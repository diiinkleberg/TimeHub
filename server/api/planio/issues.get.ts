import { PlanioIssuesResponseSchema } from "#shared/schemas/planio/issue";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const projectId = query.project_id as string | undefined;

  const config = useRuntimeConfig();
  const baseUrl = config.authPlanioBaseUrl;

  const accessToken = await getUserAccessToken(event, "planio");


  const response = await $fetch(`${baseUrl}/issues.json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    query: {
      assigned_to_id: "me",
      ...(projectId && { project_id: projectId }),
      limit: 100,
      status_id: "open",
    },
  });

  const validatedData = PlanioIssuesResponseSchema.parse(response);
  return validatedData.issues;
});