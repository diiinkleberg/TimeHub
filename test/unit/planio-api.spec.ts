import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { createApp, toWebHandler, type EventHandler } from 'h3'
import type { PlanioIssue } from '../../shared/schemas/planio/issue'
import type {
  PlanioCreateTimeEntryInput,
  PlanioTimeEntry
} from '../../shared/schemas/planio/time-entry'

// Maintain mutable runtime config and access token across tests
const runtimeConfig = {
  authPlanioBaseUrl: 'https://planio.test'
}

const getUserAccessTokenMock = vi.fn(async () => 'mock-token')
const logger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}

vi.mock('~~/server/utils/auth', () => ({
  getUserAccessToken: getUserAccessTokenMock
}))

vi.mock('~~/server/utils/logger', () => ({
  useServerLogger: () => logger
}))

vi.mock('#imports', async () => {
  const h3 = await import('h3')
  return {
    defineEventHandler: h3.eventHandler,
    getQuery: h3.getQuery,
    readBody: h3.readBody,
    createError: h3.createError,
    useRuntimeConfig: () => runtimeConfig
  }
})
const projectsHandlerPromise = import('../../server/api/planio/projects.get')
const issuesHandlerPromise = import('../../server/api/planio/issues.get')
const timeEntriesGetHandlerPromise = import('../../server/api/planio/time-entries.get')
const timeEntriesPostHandlerPromise = import('../../server/api/planio/time-entries.post')

type FetchArgs = [string, Record<string, unknown>]
type FetchReturn = Promise<unknown>

const makeIssue = (overrides: Partial<PlanioIssue> = {}): PlanioIssue => ({
  id: 1,
  project: { id: 10, name: 'Alpha' },
  tracker: { id: 1, name: 'Bug' },
  status: { id: 1, name: 'Open' },
  priority: { id: 1, name: 'Normal' },
  author: { id: 1, name: 'Jane Dev' },
  subject: 'Fix login bug',
  description: 'Important bug',
  start_date: '2025-01-01',
  due_date: null,
  done_ratio: 0,
  estimated_hours: null,
  spent_hours: 1,
  total_estimated_hours: null,
  total_spent_hours: null,
  created_on: '2025-01-01T10:00:00Z',
  updated_on: '2025-01-01T11:00:00Z',
  closed_on: null,
  custom_fields: [],
  ...overrides
}) as PlanioIssue

const makeTimeEntry = (overrides: Partial<PlanioTimeEntry> = {}): PlanioTimeEntry => ({
  id: 99,
  project: { id: 10, name: 'Alpha' },
  issue: { id: 1 },
  user: { id: 5, name: 'Jane Dev' },
  activity: { id: 9, name: 'Development' },
  hours: 2,
  comments: 'Worked on feature',
  spent_on: '2025-01-02',
  created_on: '2025-01-02T12:00:00Z',
  updated_on: '2025-01-02T13:00:00Z',
  custom_fields: [],
  ...overrides
}) as PlanioTimeEntry

let fetchMock: Mock<FetchArgs, FetchReturn>
const originalFetch = (globalThis as any).$fetch

beforeEach(() => {
  fetchMock = vi.fn<FetchArgs, FetchReturn>()
  (globalThis as any).$fetch = fetchMock
  getUserAccessTokenMock.mockClear()
  Object.values(logger).forEach(spy => spy.mockClear())
})

afterEach(() => {
  vi.clearAllMocks()
  if (originalFetch) {
    (globalThis as any).$fetch = originalFetch
  } else {
    delete (globalThis as any).$fetch
  }
})

type WebHandler = ReturnType<typeof toWebHandler>

type HandlerModule = { default: EventHandler }

const registerHandler = async (
  path: string,
  handlerModulePromise: Promise<HandlerModule>
) => {
  const handlerModule = await handlerModulePromise
  const app = createApp()
  app.use(path, handlerModule.default)
  return toWebHandler(app)
}

const callHandler = (handler: WebHandler, url: string, init?: RequestInit) => handler(new Request(url, init))

describe('GET /api/planio/projects', () => {
  it('returns unique projects for the authenticated user', async () => {
    // Arrange: fake Planio payload contains duplicate project ids to mirror real API constraints
    fetchMock.mockResolvedValueOnce({
      issues: [
        makeIssue(),
        makeIssue({ id: 2 }),
        makeIssue({ id: 3, project: { id: 11, name: 'Beta' } })
      ]
    });

    const handler = await registerHandler('/api/planio/projects', projectsHandlerPromise)
    const response = await callHandler(handler, 'http://localhost/api/planio/projects')
    const data = await response.json()

    expect(fetchMock).toHaveBeenCalledWith('https://planio.test/issues.json', expect.objectContaining({
      headers: { Authorization: 'Bearer mock-token' },
      query: expect.objectContaining({ assigned_to_id: 'me', limit: 100, status_id: '*' })
    }))

    expect(data).toEqual([
      { id: 10, name: 'Alpha' },
      { id: 11, name: 'Beta' }
    ])
  })
})

describe('GET /api/planio/issues', () => {
  it('passes optional filters and returns validated issues', async () => {
    // Arrange: Planio response shaped to pass through schema validation
    fetchMock.mockResolvedValueOnce({
      issues: [makeIssue({ id: 7 })]
    });

    const handler = await registerHandler('/api/planio/issues', issuesHandlerPromise)
    const response = await callHandler(handler, 'http://localhost/api/planio/issues?project_id=42&limit=25')
    const data = await response.json()

    expect(fetchMock).toHaveBeenCalledWith('https://planio.test/issues.json', expect.objectContaining({
      query: expect.objectContaining({
        assigned_to: 'me',
        status_id: 'open',
        project_id: '42',
        limit: '25'
      })
    }))

    expect(data).toEqual([makeIssue({ id: 7 })])
  })
})

describe('GET /api/planio/time-entries', () => {
  it('includes default filters and maps Planio response', async () => {
    // Arrange: planio returns a single time entry so we can assert exact propagation
    fetchMock.mockResolvedValueOnce({
      time_entries: [makeTimeEntry()]
    });

    const handler = await registerHandler('/api/planio/time-entries', timeEntriesGetHandlerPromise)
    const response = await callHandler(handler, 'http://localhost/api/planio/time-entries?from=2025-01-01&to=2025-01-31&limit=50')
    const data = await response.json()

    expect(fetchMock).toHaveBeenCalledWith('https://planio.test/time_entries.json', expect.objectContaining({
      query: expect.objectContaining({
        user_id: 'me',
        from: '2025-01-01',
        to: '2025-01-31',
        limit: '50',
        include: 'issue',
        sort: 'spent_on:desc'
      })
    }))

    expect(data).toEqual([makeTimeEntry()])
  })

  it('transforms Planio errors into Nitro errors', async () => {
    // Arrange: simulate Planio returning a forbidden error payload
    const error = Object.assign(new Error('Planio failed'), {
      status: 403,
      data: { errors: ['authorization failed'] }
    });
    fetchMock.mockRejectedValueOnce(error);

    const handler = await registerHandler('/api/planio/time-entries', timeEntriesGetHandlerPromise)
    const response = await callHandler(handler, 'http://localhost/api/planio/time-entries')

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload).toMatchObject({ message: 'authorization failed' })
    expect(logger.error).toHaveBeenCalled()
  })
})

describe('POST /api/planio/time-entries', () => {
  it('validates input and forwards payload to Planio', async () => {
    // Arrange: successful Planio creation to confirm our payload contract and happy path response
    fetchMock.mockResolvedValueOnce({});

    const handler = await registerHandler('/api/planio/time-entries', timeEntriesPostHandlerPromise)
    const payload: PlanioCreateTimeEntryInput = {
      issue_id: 1,
      hours: 2,
      comments: 'Working on feature',
      spent_on: '2025-01-02',
      activity_id: 5
    }

    const response = await callHandler(handler, 'http://localhost/api/planio/time-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' }
    })

    expect(fetchMock).toHaveBeenCalledWith('https://planio.test/time_entries.json', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
      body: {
        time_entry: {
          issue_id: 1,
          hours: 2,
          comments: 'Working on feature',
          spent_on: '2025-01-02',
          activity_id: 5
        }
      }
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('rejects invalid payloads with 400 errors', async () => {
    // Arrange: intentionally malformed payload to assert Zod validation protects the upstream API
    const handler = await registerHandler('/api/planio/time-entries', timeEntriesPostHandlerPromise)

    const response = await callHandler(handler, 'http://localhost/api/planio/time-entries', {
      method: 'POST',
      body: JSON.stringify({ hours: 0, comments: '', spent_on: 'invalid-date' }),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.message).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps Planio 422 responses to descriptive errors', async () => {
    // Arrange: mimic Planio validation failure so we surface a helpful error to the client
  const rejection = Object.assign(new Error('unprocessable'), { statusCode: 422 });
  fetchMock.mockRejectedValueOnce(rejection);

    const handler = await registerHandler('/api/planio/time-entries', timeEntriesPostHandlerPromise)

    const payload: PlanioCreateTimeEntryInput = {
      issue_id: 1,
      hours: 2,
      comments: 'Working on feature',
      spent_on: '2025-01-02'
    }

    const response = await callHandler(handler, 'http://localhost/api/planio/time-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      statusMessage: 'Invalid Time Entry'
    })
  })
})
