import { PlanioIssuesResponseSchema } from "#shared/schemas/planio/issue";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.authPlanioBaseUrl;

  const accessToken = await getUserAccessToken(event, "planio");

  // Fetch issues to extract projects (OAuth workaround)
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

  // Extract unique projects
  const uniqueProjects = Array.from(
    new Map(
      issues.map((issue) => [
        issue.project.id,
        {
          id: issue.project.id,
          name: issue.project.name,
          identifier: `project-${issue.project.id}`,
          description: "",
        },
      ])
    ).values()
  );
  console.log("Unique projects extracted:", uniqueProjects.length);

  return uniqueProjects;
});