import { getUserAccessToken } from "~~/server/utils/auth";
import { Octokit } from "@octokit/core";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const since = query.since as string | undefined;
    const limit = Number(query.limit) || 10;

    console.log("🔍 GitHub Commits - Query params:", { since, limit });

    const accessToken = await getUserAccessToken(event, "github");
    const octokit = new Octokit({ auth: accessToken });

    // Get username
    const { data: user } = await octokit.request("GET /user");
    console.log("👤 GitHub user:", user.login);

    // Get recent push events
    const { data: events } = await octokit.request(
      "GET /users/{username}/events",
      {
        username: user.login,
        per_page: 100,
      },
    );

    console.log(`📅 Total events fetched: ${events.length}`);

    // Extract commits from PushEvents
    const commits: any[] = [];
    const sinceDate = since ? new Date(since) : null;

    console.log("🗓️  Filtering since:", sinceDate?.toISOString() || "No date filter");

    for (const evt of events) {
      if (evt.type !== "PushEvent") continue;

      const eventDate = new Date(evt.created_at as string);
      if (sinceDate && eventDate < sinceDate) continue;

      const pushEvent = evt as any;
      for (const commit of pushEvent.payload?.commits || []) {
        commits.push({
          sha: commit.sha.substring(0, 7),
          message: commit.message.split("\n")[0],
          date: evt.created_at,
          url: commit.url
            .replace("api.github.com/repos", "github.com")
            .replace("/commits/", "/commit/"),
          repo: evt.repo.name,
        });
      }

      if (commits.length >= limit) break;
    }

    console.log(`✅ Found ${commits.length} commits matching criteria`);

    const sortedCommits = commits
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    console.log("📤 Returning commits:", sortedCommits.length);

    return sortedCommits;
  } catch (error: any) {
    console.error("❌ GitHub commits error:", error);

    throw createError({
      statusCode: error.status || 500,
      message: error.message || "Failed to fetch commits",
    });
  }
});
