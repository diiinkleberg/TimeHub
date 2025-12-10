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


Anhangverzeichnis

A1  - Projektantrag
A2  - Use-Case-Diagramm
A3  - Systemarchitektur-Diagramm
A4  - Auth-Flow-Diagramm (Sequenzdiagramm)
A5  - Datenbank-ERM
A6  - Datenbankmodell (Tabellenstruktur)
A7  - UI/UX-Mockups
A8  - API-Design (OpenAPI-Spezifikation)
A9  - API-Dokumentation
A10 - Screenshots der fertigen Anwendung
A11 - Benutzerhandbuch
A12 - Wirtschaftlichkeitsanalyse (Amortisationsrechnung)
A13 - Zeitplanung (Gantt-Diagramm oder Tabelle)
A14 - Testprotokolle (Unit- und E2E-Tests)
A15 - Quellcode-Auszüge (optional, relevante Stellen)