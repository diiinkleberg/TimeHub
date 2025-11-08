import { PlanioIssuesResponseSchema } from "#shared/schemas/planio/issue";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const projectId = query.project_id as string | undefined;
    const issueIds = query.issue_id as string | undefined; // Can be comma-separated: "8,9,10"
    const limit = query.limit as string | undefined;

    const config = useRuntimeConfig();
    const baseUrl = config.authPlanioBaseUrl;

    const accessToken = await getUserAccessToken(event, "planio");

    console.log("Fetching issues with query:", { projectId, issueIds, limit });

    // Build query parameters
    const queryParams: Record<string, any> = {};

    if (issueIds) {
      // When filtering by specific issue IDs, don't apply other filters
      queryParams.issue_id = issueIds;
    } else {
      // Only apply these filters when not fetching specific issues
      queryParams.assigned_to = "me";
      queryParams.status_id = "open";
      if (projectId) {
        queryParams.project_id = projectId;
      }
    }

    if (limit) {
      queryParams.limit = limit;
    }

    const response = await $fetch(`${baseUrl}/issues.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      query: queryParams,
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
