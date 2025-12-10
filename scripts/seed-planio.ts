#!/usr/bin/env ts-node
/**
 * Seed Planio with a few realistic projects and issues.
 * Requires an Admin API key.
 *
 * Env vars:
 *  PLANIO_BASE_URL=https://your.plan.io
 *  PLANIO_API_KEY=abc123 (admin key)
 *  PLANIO_TRACKER_ID=1 (optional)
 *  PLANIO_STATUS_ID=1 (optional)
 *  PLANIO_PRIORITY_ID=4 (optional)
 *
 * Run:
 *  pnpm dlx ts-node scripts/seed-planio.ts
 */

// Load .env locally for convenience
import { config as loadEnv } from 'dotenv'
loadEnv()

const BASE_URL = (process.env.PLANIO_BASE_URL || '').replace(/\/$/, '')
const API_KEY = process.env.PLANIO_API_KEY
const TRACKER_ID = Number(process.env.PLANIO_TRACKER_ID || 1)
const STATUS_ID = Number(process.env.PLANIO_STATUS_ID || 1)
const PRIORITY_ID = Number(process.env.PLANIO_PRIORITY_ID || 4)

if (!BASE_URL || !API_KEY) {
  console.error('Missing PLANIO_BASE_URL or PLANIO_API_KEY')
  process.exit(1)
}

const apiKey: string = API_KEY

type IssuePriority = { id: number; name: string }

async function resolvePriorityId(): Promise<number> {
  // If env looks valid, optimistically use it but verify existence if we can.
  if (Number.isFinite(PRIORITY_ID) && PRIORITY_ID > 0) {
    try {
      const { issue_priorities } = await apiGet<{ issue_priorities: IssuePriority[] }>(
        '/enumerations/issue_priorities.json'
      )
      const found = issue_priorities.find(p => p.id === PRIORITY_ID)
      if (found) return found.id
      if (issue_priorities.length > 0) return issue_priorities[0].id
    } catch {
      // If enumeration endpoint is unavailable, fall back to provided value.
      return PRIORITY_ID
    }
  }

  try {
    const { issue_priorities } = await apiGet<{ issue_priorities: IssuePriority[] }>(
      '/enumerations/issue_priorities.json'
    )
    if (issue_priorities.length === 0) throw new Error('No issue priorities configured in Planio')
    return issue_priorities[0].id
  } catch (err) {
    console.error('Failed to resolve issue priorities; please set PLANIO_PRIORITY_ID to a valid value.', err)
    process.exit(1)
  }
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

interface ProjectSeed {
  name: string
  identifier?: string
  description: string
}

interface IssueSeed {
  subject: string
  description: string
  estimated_hours?: number
  assigned_to_id?: number
  start_date?: string
  due_date?: string
  done_ratio?: number
}

async function createProject(seed: ProjectSeed) {
  const payload = { project: seed }
  const { project } = await apiPost<{ project: { id: number; name: string } }>(
    '/projects.json',
    payload
  )
  console.log(`Created project ${project.name} (id: ${project.id})`)
  return project.id
}

async function createIssue(projectId: number, seed: IssueSeed) {
  const resolvedPriorityId = await resolvePriorityId()
  const payload = {
    issue: {
      project_id: projectId,
      tracker_id: TRACKER_ID,
      status_id: STATUS_ID,
      priority_id: resolvedPriorityId,
      ...seed
    }
  }
  const { issue } = await apiPost<{ issue: { id: number; subject: string } }>(
    '/issues.json',
    payload
  )
  console.log(`  ↳ Created issue ${issue.subject} (id: ${issue.id})`)
  return issue.id
}

async function main() {
  try {
    // quick sanity check
    await apiGet('/projects.json?limit=1')
  } catch (err) {
    console.error('API check failed:', err)
    process.exit(1)
  }

  const projects: ProjectSeed[] = [
    {
      name: 'Website Redesign',
      identifier: 'website-redesign',
      description: 'Modernize the marketing site, redesign IA, and refresh brand assets.'
    },
    {
      name: 'Mobile App Launch',
      identifier: 'mobile-app',
      description: 'Deliver v1 of the mobile companion app with auth, sync, and push notifications.'
    },
    {
      name: 'Data Platform',
      identifier: 'data-platform',
      description: 'Build a unified data pipeline for analytics and reporting.'
    },
    {
      name: 'Customer Support Portal',
      identifier: 'support-portal',
      description: 'Self-service knowledge base, ticket intake, and SLA reporting.'
    },
    {
      name: 'Billing & Invoicing',
      identifier: 'billing-invoicing',
      description: 'Revamp billing flows, dunning, and payment retries.'
    },
    {
      name: 'Analytics Dashboard',
      identifier: 'analytics-dashboard',
      description: 'Executive dashboards with KPIs, cohorting, and export.'
    },
    {
      name: 'Onboarding Experience',
      identifier: 'onboarding',
      description: 'Streamline signup, activation emails, and first-run setup.'
    },
    {
      name: 'Infrastructure Hardening',
      identifier: 'infra-hardening',
      description: 'Reliability, backups, alerts, and cost controls across environments.'
    }
  ]

  for (const project of projects) {
    let projectId: number
    try {
      projectId = await createProject(project)
    } catch (err: any) {
      // if identifier already exists, try to fetch its id and continue
      const alreadyExists = /Identifier has already been taken/i.test(String(err?.message))
      if (!alreadyExists || !project.identifier) throw err
      const existing = await apiGet<{ projects: Array<{ id: number; identifier?: string }> }>(
        '/projects.json?limit=100'
      )
      const found = existing.projects.find(p => p.identifier === project.identifier)
      if (!found) throw err
      projectId = found.id
      console.log(`Project ${project.identifier} already exists, using id ${projectId}`)
    }

    const issues: IssueSeed[] = [
      {
        subject: 'Project skeleton & CI',
        description: 'Bootstrap repo, CI, code owners, linting, formatter, and PR template.',
        estimated_hours: 8,
        done_ratio: 0
      },
      {
        subject: 'Core user journey',
        description: 'Implement primary flow end-to-end with happy path tests.',
        estimated_hours: 24,
        start_date: '2025-01-05',
        due_date: '2025-01-20'
      },
      {
        subject: 'Auth & roles',
        description: 'Set up login, session handling, and role-based permissions.',
        estimated_hours: 14
      },
      {
        subject: 'Data model finalization',
        description: 'Normalize entities, add indexes, migrations, and seed data.',
        estimated_hours: 10
      },
      {
        subject: 'API surface',
        description: 'Design and ship versioned API endpoints with validation.',
        estimated_hours: 16
      },
      {
        subject: 'UI polish',
        description: 'Apply design system components, spacing, and accessibility fixes.',
        estimated_hours: 12
      },
      {
        subject: 'Observability',
        description: 'Add logs, metrics, traces, and error alerts for key paths.',
        estimated_hours: 10
      },
      {
        subject: 'Performance pass',
        description: 'Profile hot paths, add caching, and tighten DB queries.',
        estimated_hours: 12
      },
      {
        subject: 'Security review',
        description: 'Secrets handling, dependency audit, SSRF/CSRF protections.',
        estimated_hours: 8
      },
      {
        subject: 'Release readiness',
        description: 'Cut release notes, rollback plan, and smoke tests.',
        estimated_hours: 6
      }
    ]

    for (const issue of issues) {
      try {
        await createIssue(projectId, issue)
      } catch (err) {
        console.error('Issue creation failed:', err)
      }
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
