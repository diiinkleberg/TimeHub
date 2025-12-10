#!/usr/bin/env ts-node
/**
 * Assign existing Planio issues to a given user.
 *
 * Env vars:
 *  PLANIO_BASE_URL=https://your.plan.io
 *  PLANIO_API_KEY=abc123 (admin key)
 *  PLANIO_ASSIGN_USER_ID=8           # optional single target id
 *  PLANIO_ASSIGN_USER_IDS=8,9        # optional comma list (takes priority)
 *  PLANIO_PROJECT_ID=5               # optional filter to a single project
 *
 * Run:
 *  pnpm dlx ts-node scripts/assign-planio-issues.ts
 */

import { config as loadEnv } from 'dotenv'
loadEnv()

const BASE_URL = (process.env.PLANIO_BASE_URL || '').replace(/\/$/, '')
const API_KEY = process.env.PLANIO_API_KEY
const ASSIGN_USER_IDS = (process.env.PLANIO_ASSIGN_USER_IDS || '')
  .split(',')
  .map(s => Number(s.trim()))
  .filter(n => Number.isFinite(n) && n > 0)

const ASSIGN_USER_ID_SINGLE = Number(process.env.PLANIO_ASSIGN_USER_ID || 0)
const PROJECT_ID = process.env.PLANIO_PROJECT_ID

if (!BASE_URL || !API_KEY) {
  console.error('Missing PLANIO_BASE_URL or PLANIO_API_KEY')
  process.exit(1)
}

const TARGET_USER_IDS = ASSIGN_USER_IDS.length
  ? ASSIGN_USER_IDS
  : Number.isFinite(ASSIGN_USER_ID_SINGLE) && ASSIGN_USER_ID_SINGLE > 0
  ? [ASSIGN_USER_ID_SINGLE]
  : []

if (TARGET_USER_IDS.length === 0) {
  console.error('Missing PLANIO_ASSIGN_USER_ID or PLANIO_ASSIGN_USER_IDS (numeric)')
  process.exit(1)
}

const apiKey: string = API_KEY

type IssueLite = { id: number; subject?: string }

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-Redmine-API-Key': apiKey
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText} -> ${text}`)
  }
  return res.json() as Promise<T>
}

async function apiPut<T>(path: string, payload: unknown): Promise<T | void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Redmine-API-Key': apiKey
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PUT ${path} failed: ${res.status} ${res.statusText} -> ${text}`)
  }
  // Planio may return 204 No Content; avoid parsing empty bodies.
  if (res.status === 204) return
  const text = await res.text()
  if (!text) return
  return JSON.parse(text) as T
}

async function fetchAllIssues(): Promise<IssueLite[]> {
  const all: IssueLite[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const projectFilter = PROJECT_ID ? `&project_id=${PROJECT_ID}` : ''
    const { issues, total_count } = await apiGet<{ issues: IssueLite[]; total_count?: number }>(
      `/issues.json?status_id=*&limit=${limit}&offset=${offset}${projectFilter}`
    )
    all.push(...issues)
    if (!issues.length || (typeof total_count === 'number' && all.length >= total_count)) break
    offset += limit
  }
  return all
}

async function assignIssue(issueId: number, userId: number) {
  await apiPut(`/issues/${issueId}.json`, {
    issue: { assigned_to_id: userId }
  })
  console.log(`Assigned issue ${issueId} to user ${userId}`)
}

async function main() {
  const issues = await fetchAllIssues()
  if (!issues.length) {
    console.log('No issues found to assign.')
    return
  }

  // If multiple target users are provided, round-robin assign issues across them
  let userIdx = 0
  for (const issue of issues) {
    const userId = TARGET_USER_IDS[userIdx % TARGET_USER_IDS.length]
    userIdx++
    try {
      await assignIssue(issue.id, userId)
    } catch (err) {
      console.error(`Failed to assign issue ${issue.id}:`, err)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
