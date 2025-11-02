import { PlanioProjectsResponseSchema } from "#shared/schemas/planio/project";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.authPlanioBaseUrl;

  const accessToken = await getUserAccessToken(event, "planio");

  const response = await $fetch(`${baseUrl}/projects.json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    query: { limit: 100 },
  });

  const validatedData = PlanioProjectsResponseSchema.parse(response);
  return validatedData.projects;
});
