# TimeHub Documentation

## Future Improvements & TODO

### Caching Strategy

- **Status**: Not implemented yet
- **Priority**: Medium
- **Description**: Implement server-side caching for GitHub and Planio link status endpoints
- **Benefits**:
  - Reduce database queries
  - Improve response times
  - 30-day cache with manual invalidation on link/unlink
- **Implementation notes**:
  - Use `defineCachedEventHandler` with explicit `name` option
  - Invalidate cache using `escapeKey()` utility on mutations
  - Pattern: `nitro/handlers:${name}:${userId}.json`
- **Files to update**:
  - `server/api/github/link/status.get.ts` - Add caching
  - `server/api/github/link/unlink.post.ts` - Add cache invalidation
  - `server/api/planio/link/status.get.ts` - Add caching
  - `server/api/planio/link/unlink.post.ts` - Add cache invalidation

---

## GitHub OAuth Notes

### Why don't I have a refresh token?

Github doesn't issue refresh tokens for OAuth apps. For regular OAuth apps, GitHub issues access tokens that remain valid indefinitely unless the user revokes them, the app revokes them, or they go unused for a year. There's no need for a refresh token because the access token doesn't expire on a short interval like Google or Discord.
