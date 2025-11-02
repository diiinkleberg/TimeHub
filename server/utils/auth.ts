import { auth } from "~~/server/lib/auth.config";
import type { H3Event } from "h3";

/**
 * Get user's access token for a specific OAuth provider
 *
 * @param event - H3 event context
 * @param providerId - OAuth provider ID (e.g., "planio", "google")
 * @returns Access token string
 * @throws 404 error if account not linked
 */
export async function getUserAccessToken(
  event: H3Event,
  providerId: string,
): Promise<string> {
  try {
    // ✅ User is already authenticated by middleware
    // The middleware attaches user to event.context
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        message: "Not authenticated. Please sign in.",
      });
    }

    // ✅ FIX: Get the session first, then use it to get the access token
    const session = await auth.api.getSession({
      headers: event.headers,
    });

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: "Session not found. Please sign in again.",
      });
    }

    // ✅ FIX: Pass the session along with the providerId
    const accessTokenResponse = await auth.api.getAccessToken({
      body: {
        providerId,
        // Better Auth expects either userId or the full session
      },
      headers: event.headers,
      // ✅ The session is in the headers/cookies, but we need to ensure it's valid
    });

    if (!accessTokenResponse?.accessToken) {
      console.error(`❌ No access token found for provider: ${providerId}`);
      throw createError({
        statusCode: 404,
        message: `${providerId} account not linked. Please connect your ${providerId} account in settings.`,
      });
    }

    console.log(
      `✅ Access token retrieved for ${providerId}:`,
      accessTokenResponse.accessToken.substring(0, 10) + "...",
    );

    return accessTokenResponse.accessToken;
  } catch (error: any) {
    console.error(`❌ Failed to get access token for ${providerId}:`, error);

    // Re-throw with appropriate status code
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || `Failed to retrieve ${providerId} credentials`,
    });
  }
}
