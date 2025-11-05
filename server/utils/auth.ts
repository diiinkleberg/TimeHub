import { auth } from "~~/server/lib/auth.config";
import { toWebRequest, H3Event } from "h3";
import prisma from "../lib/db/prisma";

/**
 * Get user's access token for a specific OAuth provider
 *
 * @param event - H3 event context
 * @param providerId - OAuth provider ID (e.g., "planio", "google")
 * @returns Access token string
 * @throws 401 error if account not linked
 */
export async function getUserAccessToken(
  event: H3Event,
  providerId: string,
): Promise<string> {
  const request = toWebRequest(event);
  
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: "Session not found. Please sign in again.",
    });
  }

  // Get account for provider
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: providerId,
    },
  });

  if (!account?.accessToken) {
    throw createError({
      statusCode: 401,
      message: `No ${providerId} account linked`,
    });
  }

  return account.accessToken;
}
