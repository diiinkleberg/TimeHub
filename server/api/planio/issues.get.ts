import { PlanioIssuesResponseSchema } from "#shared/schemas/planio/issue";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineCachedEventHandler(
  async (event) => {
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
        ...(projectId && { project_id: projectId }), // ✅ Only include if defined
        limit: 100,
        status_id: "open",
      },
    });

    const validatedData = PlanioIssuesResponseSchema.parse(response);
    return validatedData.issues;
  },
  {
    maxAge: 60 * 2,
    name: "planio-issues",
    getKey: (event) => {
      const query = getQuery(event);
      return `planio-issues:${event.context.user?.id}:${query.project_id || "all"}`;
    },
  }
);