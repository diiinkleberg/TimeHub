import { getUserAccessToken } from "~~/server/utils/auth";
import { Octokit } from "@octokit/core";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const since = query.since as string | undefined;
    const until = query.until as string | undefined;
    const limit = Number(query.limit) || 10;

    console.log("🔍 GitHub Commits - Query params:", { since, until, limit });

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

    // Debug: Show event types
    const eventTypes = events.reduce((acc: Record<string, number>, evt) => {
      const type = evt.type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log("📊 Event types breakdown:", eventTypes);

    // Extract unique repos from PushEvents and fetch commits directly
    const commits: any[] = [];
    const sinceDate = since ? new Date(since) : null;
    const untilDate = until ? new Date(until) : null;

    console.log("🗓️  Filtering:", {
      since: sinceDate?.toISOString() || "No start date",
      until: untilDate?.toISOString() || "No end date",
    });

    // Get unique repos from push events
    const reposToCheck = new Set<string>();
    for (const evt of events) {
      if (evt.type === "PushEvent") {
        reposToCheck.add(evt.repo.name);
      }
    }

    console.log(`� Found ${reposToCheck.size} repos with push events`);

    // Fetch commits from each repo
    for (const repoName of Array.from(reposToCheck).slice(0, 5)) {
      // Limit to 5 repos
      try {
        const [owner, repo] = repoName.split("/");
        console.log(`  📂 Fetching commits from ${repoName}...`);

        const { data: repoCommits } = await octokit.request(
          "GET /repos/{owner}/{repo}/commits",
          {
            owner,
            repo,
            author: user.login,
            since: sinceDate?.toISOString(),
            until: untilDate?.toISOString(),
            per_page: 10,
          },
        );

        console.log(`    ✅ Found ${repoCommits.length} commits by ${user.login}`);

        for (const commit of repoCommits) {
          commits.push({
            sha: commit.sha.substring(0, 7),
            message: commit.commit.message.split("\n")[0],
            date: commit.commit.author?.date || commit.commit.committer?.date,
            url: commit.html_url,
            repo: repoName,
          });
        }
      } catch (repoError: any) {
        console.warn(`    ⚠️ Could not fetch from ${repoName}:`, repoError.message);
      }

      if (commits.length >= limit) break;
    }

    console.log(`✅ Found ${commits.length} total commits`);

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
