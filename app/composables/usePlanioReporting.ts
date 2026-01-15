import type { PlanioIssue } from '#shared/schemas/planio/issue'
import type { PlanioTimeEntry } from '#shared/schemas/planio/time-entry'
import type { Range } from '~/types'

const palette = [
  '#10b981', // emerald-500
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#eab308', // yellow-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#14b8a6'  // teal-500
] as const

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

const NO_ISSUE_LABEL = 'No Issue'

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  })

const parseIssueId = (label: string): number | null => {
  if (!label.startsWith('#')) return null
  const end = label.indexOf(':')
  const id = Number(label.slice(1, end === -1 ? undefined : end))
  return Number.isFinite(id) ? id : null
}

const sortIssueKeys = (keys: string[]) =>
  keys.sort((a, b) => {
    if (a === NO_ISSUE_LABEL) return 1
    if (b === NO_ISSUE_LABEL) return -1

    const idA = parseIssueId(a)
    const idB = parseIssueId(b)

    if (idA !== null && idB !== null && idA !== idB) return idA - idB
    if (idA !== null && idB === null) return -1
    if (idA === null && idB !== null) return 1

    return a.localeCompare(b)
  })

const issueLabel = (issue?: { id?: number; subject?: string }) =>
  issue?.id ? `#${issue.id}: ${issue.subject ?? 'Issue'}` : NO_ISSUE_LABEL

const dateRange = (range: Range) => {
  const start = new Date(range.start)
  const end = new Date(range.end)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const result: { iso: string; label: string }[] = []

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    result.push({
      iso: toIsoDate(cursor),
      label: formatDayLabel(cursor)
    })
  }

  return result
}

export function usePlanioTimeEntries(range: Ref<Range>) {
  const params = computed(() => ({
    from: toIsoDate(range.value.start),
    to: toIsoDate(range.value.end),
    limit: 100
  }))

  const key = computed(() => `planio-time-entries-${params.value.from}-${params.value.to}`)

  const state = useAsyncData(
    () => key.value,
    () =>
      $fetch<PlanioTimeEntry[]>('/api/planio/time-entries', {
        query: params.value
      }),
    {
      default: () => [],
      server: false,
      watch: [() => params.value.from, () => params.value.to]
    }
  )

  return {
    ...state,
    data: computed(() => state.data.value ?? [])
  }
}

export function usePlanioIssues(issueIds: Ref<number[]>) {
  const params = computed(() => {
    const ids = issueIds.value.filter(Boolean)
    return ids.length > 0
      ? { ids, query: { issue_id: ids.join(','), limit: 100 } }
      : { ids, query: null }
  })

  const key = computed(() => `planio-issues-${params.value.ids.join('-') || 'none'}`)

  const state = useAsyncData(
    () => key.value,
    async () => {
      if (!params.value.query) return [] as PlanioIssue[]

      return await $fetch<PlanioIssue[]>('/api/planio/issues', {
        query: params.value.query
      })
    },
    {
      default: () => [],
      server: false,
      watch: [() => params.value.query?.issue_id ?? '']
    }
  )

  return {
    ...state,
    data: computed(() => state.data.value ?? [])
  }
}

export interface TimeEntriesChartDay {
  date: string
  dateLabel: string
  [key: string]: any
}

export function useStackedTimeEntriesData(
  entries: Ref<PlanioTimeEntry[]>,
  issues: Ref<PlanioIssue[]>,
  range: Ref<Range>
) {
  const issueLookup = computed(() => {
    const map = new Map<number, PlanioIssue>()
    issues.value.forEach(issue => map.set(issue.id, issue))
    return map
  })

  // 1. Aggregate hours per issue per day
  const dailyAggregates = computed(() => {
    const days = new Map<string, Map<string, number>>()

    entries.value.forEach((entry) => {
      const issue = entry.issue?.id
        ? issueLookup.value.get(entry.issue.id) ?? entry.issue
        : undefined

      const key = issueLabel(issue)
      const day = days.get(entry.spent_on) ?? new Map<string, number>()

      day.set(key, (day.get(key) ?? 0) + entry.hours)
      days.set(entry.spent_on, day)
    })

    return days
  })

  // 2. Determine all unique issue keys (for legend/count)
  const issueKeys = computed(() => {
    const keys = new Set<string>()
    dailyAggregates.value.forEach((day) => {
      day.forEach((_, key) => keys.add(key))
    })
    return sortIssueKeys([...keys])
  })

  // 3. Determine max stack depth
  const maxStackDepth = computed(() => {
    let max = 0
    dailyAggregates.value.forEach((day) => {
      if (day.size > max) max = day.size
    })
    return max
  })

  // 4. Generate chart data with layers
  const chartData = computed<TimeEntriesChartDay[]>(() => {
    return dateRange(range.value).map(({ iso, label }) => {
      const dayData: TimeEntriesChartDay = { date: iso, dateLabel: label, _meta: {} }
      const dayAggregates = dailyAggregates.value.get(iso)

      if (dayAggregates) {
        // Sort entries for consistent stacking (by key)
        const sortedEntries = [...dayAggregates.entries()].sort((a, b) =>
          sortIssueKeys([a[0], b[0]])[0] === a[0] ? -1 : 1
        )

        sortedEntries.forEach(([key, hours], index) => {
          const layerKey = `layer${index}`
          dayData[layerKey] = hours
          dayData._meta[layerKey] = { key, hours }
        })
      }

      return dayData
    })
  })

  const colorForLayer = (index: number) => palette[index % palette.length] ?? palette[0]

  const tooltipTemplate = (day: TimeEntriesChartDay): HTMLElement | undefined => {
    const wrapper = document.createElement('div')
    wrapper.className = 'p-4 rounded-lg shadow-xl bg-elevated text-default border border-default space-y-2'

    const header = document.createElement('div')
    header.className = 'text-sm font-semibold text-highlighted'
    header.textContent = day.dateLabel
    wrapper.appendChild(header)

    let total = 0
    const rows = document.createElement('div')
    rows.className = 'flex flex-col gap-1'

    // Iterate through layers present in this day's meta
    const meta = day._meta as Record<string, { key: string, hours: number }>
    if (meta) {
      Object.entries(meta).forEach(([layerKey, { key, hours }]) => {
        total += hours
        const layerIndex = parseInt(layerKey.replace('layer', ''))

        const row = document.createElement('div')
        row.className = 'flex items-center justify-between gap-3 text-sm'

        const left = document.createElement('div')
        left.className = 'flex items-center gap-2 min-w-0'

        const swatch = document.createElement('span')
        swatch.className = 'size-3 rounded-sm shrink-0'
        swatch.style.backgroundColor = colorForLayer(layerIndex)

        const label = document.createElement('span')
        label.className = 'truncate text-default'
        label.textContent = key
        label.title = key

        const value = document.createElement('span')
        value.className = 'font-semibold text-highlighted tabular-nums'
        value.textContent = `${hours.toFixed(2)}h`

        left.appendChild(swatch)
        left.appendChild(label)
        row.appendChild(left)
        row.appendChild(value)
        rows.appendChild(row)
      })
    }

    if (!rows.childElementCount) {
      const empty = document.createElement('p')
      empty.className = 'text-xs text-muted'
      empty.textContent = 'No tracked hours for this day.'
      wrapper.appendChild(empty)
      return wrapper
    }

    const footer = document.createElement('div')
    footer.className = 'flex justify-between items-center pt-3 mt-2 text-sm font-medium border-t border-default'

    const footerLabel = document.createElement('span')
    footerLabel.className = 'text-muted'
    footerLabel.textContent = 'Total'

    const footerValue = document.createElement('span')
    footerValue.className = 'text-primary font-semibold tabular-nums'
    footerValue.textContent = `${total.toFixed(2)}h`

    footer.appendChild(footerLabel)
    footer.appendChild(footerValue)

    wrapper.appendChild(rows)
    wrapper.appendChild(footer)

    return wrapper
  }

  const xAccessor = (_: TimeEntriesChartDay, index: number) => index

  const yAccessors = computed(() =>
    Array.from({ length: maxStackDepth.value }, (_, i) =>
      (day: TimeEntriesChartDay) => Number(day[`layer${i}`] ?? 0)
    )
  )

  const xTickFormat = (value: number) => chartData.value[Math.round(value)]?.dateLabel ?? ''

  const hasEntries = computed(() => entries.value.length > 0)

  return {
    chartData,
    issueKeys,
    colors: computed(() => Array.from({ length: maxStackDepth.value }, (_, i) => colorForLayer(i))),
    tooltipTemplate,
    xAccessor,
    yAccessors,
    xTickFormat,
    hasEntries
  }
}
