import { PlanioProjectsResponseSchema } from "#shared/schemas/planio/project";
import { auth } from "~~/server/lib/auth.config";
import { getUserAccessToken } from "~~/server/utils/auth";

export default defineCachedEventHandler(
  async (event) => {
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
  },
  {
    maxAge: 60 * 60 * 24, // 24 hours
    name: "planio-projects",
    getKey: (event) => `planio-projects:${event.context.user?.id}`,
  },
);
