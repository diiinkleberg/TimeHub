import { beforeEach, afterEach, vi, type Mock } from 'vitest'
import {
  createApp,
  toWebHandler,
  eventHandler,
  getQuery as h3GetQuery,
  readBody as h3ReadBody,
  createError as h3CreateError,
  type EventHandler
} from 'h3'
import type { PlanioIssue } from '../../../shared/schemas/planio/issue'
import type { PlanioTimeEntry } from '../../../shared/schemas/planio/time-entry'

const runtimeConfig = {
  authPlanioBaseUrl: 'https://planio.test'
}

const getUserAccessTokenMock = vi.fn(async () => 'mock-token')

type LoggerMock = Mock<(...args: any[]) => void>
const logger: Record<'error' | 'info' | 'warn', LoggerMock> = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}

type Fetcher = (url: string, options: Record<string, unknown>) => Promise<unknown>
type FetchMock = Mock<Fetcher>

vi.mock('~~/server/utils/auth', () => ({
  getUserAccessToken: getUserAccessTokenMock
}))

vi.mock('~~/server/utils/logger', () => ({
  useServerLogger: () => logger
}))

const installNuxtAutoImports = () => {
  const target = globalThis as Record<string, unknown>
  const autoImports: Record<string, unknown> = {
    defineEventHandler: eventHandler,
    getQuery: h3GetQuery,
    readBody: h3ReadBody,
    createError: h3CreateError,
    useRuntimeConfig: () => runtimeConfig
  }

  Object.entries(autoImports).forEach(([key, value]) => {
    if (!(key in target)) {
      target[key] = value
    }
  })
}

installNuxtAutoImports()

vi.mock(
  '#imports',
  () => ({
    defineEventHandler: eventHandler,
    getQuery: h3GetQuery,
    readBody: h3ReadBody,
    createError: h3CreateError,
    useRuntimeConfig: () => runtimeConfig
  }),
  { virtual: true }
)

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

const callHandler = (handler: WebHandler, url: string, init?: RequestInit) =>
  handler(new Request(url, init))

export const setupPlanioApiTest = () => {
  const originalFetch = (globalThis as any).$fetch
  const state: { fetchMock: FetchMock | null } = { fetchMock: null }

  beforeEach(() => {
    state.fetchMock = vi.fn<Fetcher>()
    ;(globalThis as any).$fetch = state.fetchMock
    getUserAccessTokenMock.mockClear()
    Object.values(logger).forEach(spy => spy.mockClear())
  })

  afterEach(() => {
    vi.clearAllMocks()
    if (originalFetch) {
      ;(globalThis as any).$fetch = originalFetch
    } else {
      delete (globalThis as any).$fetch
    }
  })

  return {
    get fetchMock() {
      if (!state.fetchMock) {
        throw new Error('fetchMock is not initialised')
      }
      return state.fetchMock
    },
    registerHandler,
    callHandler,
    makeIssue,
    makeTimeEntry,
    logger,
    getUserAccessTokenMock,
    runtimeConfig
  }
}

export type PlanioTestContext = ReturnType<typeof setupPlanioApiTest>
