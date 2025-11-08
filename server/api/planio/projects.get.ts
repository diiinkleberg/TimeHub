import type { SimpleProject } from "#shared/types/planio";
import { PlanioIssuesResponseSchema } from "#shared/schemas/planio/issue";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const baseUrl = config.authPlanioBaseUrl;
    const accessToken = await getUserAccessToken(event, "planio");

    console.log("📁 Fetching projects from issues endpoint...");

    const response = await $fetch(`${baseUrl}/issues.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      query: {
        assigned_to_id: "me",
        limit: 100,
        status_id: "*",
      },
    });

    const { issues } = PlanioIssuesResponseSchema.parse(response);

    // Extract unique projects from issues
    const uniqueProjects = Array.from(
      new Map(
        issues.map((issue) => [
          issue.project.id,
          {
            id: issue.project.id,
            name: issue.project.name,
          } satisfies SimpleProject,
        ]),
      ).values(),
    );

    console.log("📁 Extracted unique projects:", uniqueProjects.length);
    return uniqueProjects;
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
    }
    throw error;
  }
});
