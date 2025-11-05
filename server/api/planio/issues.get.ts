import { PlanioIssuesResponseSchema } from "#shared/schemas/planio/issue";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const projectId = query.project_id as string | undefined;

    const config = useRuntimeConfig();
    const baseUrl = config.authPlanioBaseUrl;

    const accessToken = await getUserAccessToken(event, "planio");

    console.log("Fetching issues with query:", { projectId });

    const response = await $fetch(`${baseUrl}/issues.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      query: {
        assigned_to: "me",
        ...(projectId && { project_id: projectId }),
        status_id: "open",
      },
    });

    const validatedData = PlanioIssuesResponseSchema.parse(response);

    console.log("Validated issues:", validatedData.issues.length);

    return validatedData.issues;
  } catch (error) {
    console.error("Error fetching issues:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    throw error;
  }
});
