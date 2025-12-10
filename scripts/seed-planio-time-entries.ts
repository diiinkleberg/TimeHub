#!/usr/bin/env ts-node
/**
 * Seed Planio with time entries for one or more users across existing projects/issues.
 * - Distributes hours on weekdays only over the previous calendar month.
 * - Each user gets ~TARGET_HOURS total, spread evenly per weekday; last day adjusts remainder.
 *
 * Env vars:
 *  PLANIO_BASE_URL=https://your.plan.io
 *  PLANIO_API_KEY=abc123 (admin key)
 *  PLANIO_USER_IDS=1,2,3           # required (comma-separated Planio user ids)
 *  PLANIO_ACTIVITY_ID=10           # optional; defaults to first activity
 *  PLANIO_TARGET_HOURS=30          # optional; default 30 hours per user
 *
 * Run:
 *  pnpm dlx ts-node scripts/seed-planio-time-entries.ts
 */

import { config as loadEnv } from 'dotenv'
loadEnv()

const BASE_URL = (process.env.PLANIO_BASE_URL || '').replace(/\/$/, '')
const API_KEY = process.env.PLANIO_API_KEY
const USER_IDS = (process.env.PLANIO_USER_IDS || '')
  .split(',')
  .map(s => Number(s.trim()))
  .filter(n => Number.isFinite(n) && n > 0)

const ACTIVITY_ID_ENV = Number(process.env.PLANIO_ACTIVITY_ID || 0)
const TARGET_HOURS = Number(process.env.PLANIO_TARGET_HOURS || 30)

if (!BASE_URL || !API_KEY) {
  console.error('Missing PLANIO_BASE_URL or PLANIO_API_KEY')
  process.exit(1)
}

if (USER_IDS.length === 0) {
  console.error('Missing PLANIO_USER_IDS (comma-separated user IDs)')
  process.exit(1)
}

const apiKey: string = API_KEY

type TimeEntryActivity = { id: number; name: string }
type Issue = { id: number; project: { id: number; name: string } }

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

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Redmine-API-Key': apiKey
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST ${path} failed: ${res.status} ${res.statusText} -> ${text}`)
  }
  return res.json() as Promise<T>
}

async function resolveActivityId(): Promise<number> {
  try {
    const { time_entry_activities } = await apiGet<{ time_entry_activities: TimeEntryActivity[] }>(
      '/enumerations/time_entry_activities.json'
    )
    if (time_entry_activities.length === 0) throw new Error('No time entry activities configured')
    if (Number.isFinite(ACTIVITY_ID_ENV) && ACTIVITY_ID_ENV > 0) {
      const found = time_entry_activities.find(a => a.id === ACTIVITY_ID_ENV)
      if (found) return found.id
    }
    return time_entry_activities[0].id
  } catch (err) {
    console.error('Failed to resolve time entry activity. Set PLANIO_ACTIVITY_ID to a valid value.', err)
    process.exit(1)
  }
}

async function fetchIssues(): Promise<Issue[]> {
  // Grab up to 200 issues across projects (adjust limit if needed)
  const { issues } = await apiGet<{ issues: Issue[] }>(
    '/issues.json?include=project&status_id=*&limit=200'
  )
  if (!issues || issues.length === 0) {
    throw new Error('No issues found; seed issues before creating time entries.')
  }
  return issues
}

function previousMonthRange(today = new Date()) {
  const firstOfThisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const firstOfPrev = new Date(Date.UTC(firstOfThisMonth.getUTCFullYear(), firstOfThisMonth.getUTCMonth() - 1, 1))
  const firstOfThis = firstOfThisMonth
  const lastOfPrev = new Date(firstOfThis.getTime() - 24 * 60 * 60 * 1000)
  return { start: firstOfPrev, end: lastOfPrev }
}

function listWeekdaysInRange(start: Date, end: Date): string[] {
  const days: string[] = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay()
    if (day === 0 || day === 6) continue // skip weekends
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return days
}

function buildDailyHours(total: number, dates: string[]): Array<{ date: string; hours: number }> {
  if (dates.length === 0) return []
  const base = Math.floor((total / dates.length) * 100) / 100 // 2-dec precision
  const entries = dates.map(date => ({ date, hours: base }))
  // Adjust remainder on last day to hit the total exactly
  const used = base * dates.length
  const diff = Math.round((total - used) * 100) / 100
  entries[entries.length - 1].hours = Math.max(0.25, entries[entries.length - 1].hours + diff)
  return entries
}

async function createTimeEntry(payload: {
  issue_id: number
  hours: number
  comments: string
  spent_on: string
  activity_id: number
  user_id?: number
}) {
  const body = { time_entry: payload }
  const { time_entry } = await apiPost<{ time_entry: { id: number } }>(
    '/time_entries.json',
    body
  )
  console.log(`  ↳ Time entry ${time_entry.id} on issue ${payload.issue_id} (${payload.spent_on})`)
}

async function main() {
  const activityId = await resolveActivityId()
  const issues = await fetchIssues()

  const { start, end } = previousMonthRange()
  const dates = listWeekdaysInRange(start, end)

  for (const userId of USER_IDS) {
    const daily = buildDailyHours(TARGET_HOURS, dates)
    let issueIndex = 0

    for (const [idx, day] of daily.entries()) {
      const split = idx % 3 === 0 // every 3rd day gets two entries on the same date
      const hoursA = split ? Math.max(0.25, Math.round(day.hours * 0.6 * 100) / 100) : day.hours
      const hoursB = split ? Math.max(0.25, Math.round((day.hours - hoursA) * 100) / 100) : 0

      const entriesForDay = split ? [hoursA, hoursB] : [day.hours]

      for (const hours of entriesForDay) {
        const issue = issues[issueIndex % issues.length]
        issueIndex++
        try {
          await createTimeEntry({
            issue_id: issue.id,
            hours,
            comments: 'Seeded worklog',
            spent_on: day.date,
            activity_id: activityId,
            user_id: userId
          })
        } catch (err) {
          console.error(`Failed to create time entry for user ${userId} on ${day.date}:`, err)
        }
      }
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
