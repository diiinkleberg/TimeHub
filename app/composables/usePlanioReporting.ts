import { computed, type Ref } from 'vue'
import type { PlanioIssue } from '#shared/schemas/planio/issue'
import type { PlanioTimeEntry } from '#shared/schemas/planio/time-entry'
import type { Range } from '~/types'

const chartPalette = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#f43f5e'
] as const

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

export function usePlanioTimeEntries(range: Ref<Range>) {
  const params = computed(() => ({
    from: toIsoDate(range.value.start),
    to: toIsoDate(range.value.end),
    limit: 100
  }))

  const state = useAsyncData(
    () =>
      `planio-time-entries-${params.value.from}-${params.value.to}`,
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

  const data = computed(() => state.data.value ?? [])

  return {
    ...state,
    data
  }
}

export function usePlanioIssues(issueIds: Ref<number[]>) {
  const params = computed(() => {
    const ids = issueIds.value.filter(Boolean)

    return {
      ids,
      query: ids.length > 0 ? { issue_id: ids.join(','), limit: 100 } : null
    }
  })

  const state = useAsyncData(
    () => `planio-issues-${params.value.ids.join('-') || 'none'}`,
    async () => {
      if (!params.value.query) {
        return [] as PlanioIssue[]
      }

      return await $fetch<PlanioIssue[]>('/api/planio/issues', {
        query: params.value.query
      })
    },
    {
      default: () => [],
      server: false,
      watch: [() => params.value.ids.join('-'), () => params.value.query?.issue_id ?? '']
    }
  )

  const data = computed(() => state.data.value ?? [])

  return {
    ...state,
    data
  }
}

export interface TimeEntriesChartDay {
  date: string
  dateLabel: string
  [key: string]: string | number
}

export function useStackedTimeEntriesData(
  entries: Ref<PlanioTimeEntry[]>,
  issues: Ref<PlanioIssue[]>
) {
  const issueMap = computed(() => {
    const map = new Map<number, PlanioIssue>()

    issues.value.forEach((issue) => {
      map.set(issue.id, issue)
    })

    return map
  })

  const chartData = computed<TimeEntriesChartDay[]>(() => {
    if (!entries.value.length) {
      return []
    }

    const groups = new Map<string, Map<string, number>>()

    entries.value.forEach((entry) => {
      const issueRecord = entry.issue?.id
        ? issueMap.value.get(entry.issue.id)
        : undefined

      const issueKey = issueRecord
        ? `#${issueRecord.id}: ${issueRecord.subject}`
        : 'No Issue'

      if (!groups.has(entry.spent_on)) {
        groups.set(entry.spent_on, new Map())
      }

      const group = groups.get(entry.spent_on)!
      group.set(issueKey, (group.get(issueKey) ?? 0) + entry.hours)
    })

    return Array.from(groups.entries())
      .map(([date, group]) => {
        const day: TimeEntriesChartDay = {
          date,
          dateLabel: new Date(date).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
          })
        }

        group.forEach((hours, key) => {
          day[key] = hours
        })

        return day
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  const allIssues = computed(() => {
    const set = new Set<string>()

    entries.value.forEach((entry) => {
      const issueRecord = entry.issue?.id
        ? issueMap.value.get(entry.issue.id)
        : undefined

      if (issueRecord) {
        set.add(`#${issueRecord.id}: ${issueRecord.subject}`)
      }
    })

    return Array.from(set).sort()
  })

  const tooltipTemplate = (day: TimeEntriesChartDay) => {
    const rows = allIssues.value
      .map((issueKey, index) => {
        const hours = (day[issueKey] as number) || 0

        if (!hours) {
          return null
        }

        const label = issueKey.length > 45 ? `${issueKey.slice(0, 42)}...` : issueKey
        const color = chartPalette[index % chartPalette.length]

        return `
        <div class="flex items-center justify-between gap-4 py-1.5">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm" style="background-color: ${color}"></div>
            <span class="text-sm">${label}</span>
          </div>
          <strong class="text-sm font-bold" style="color: ${color}">
            ${hours.toFixed(2)}h
          </strong>
        </div>
      `
      })
      .filter(Boolean)
      .join('')

    const total = allIssues.value.reduce((sum, key) => {
      const value = day[key]
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)

    return `
    <div class="p-4 bg-gray-900 border border-blue-500/30 rounded-lg shadow-2xl min-w-[300px] max-w-[450px]">
      <div class="font-bold mb-3 text-gray-100 text-base border-b border-gray-700 pb-2">
        ${day.dateLabel}
      </div>
      <div class="space-y-1">${rows}</div>
      <div class="border-t border-gray-700 mt-3 pt-3 flex justify-between items-center">
        <span class="font-semibold text-gray-300">Total:</span>
        <strong class="text-blue-400 text-xl font-bold">${total.toFixed(2)}h</strong>
      </div>
    </div>
  `
  }

  const xAccessor = (_: TimeEntriesChartDay, index: number) => index

  const yAccessors = computed(() =>
    allIssues.value.map(issueKey => (
      day: TimeEntriesChartDay
    ) => (day[issueKey] as number) ?? 0)
  )

  const xTickFormat = (value: number) => {
    const day = chartData.value[Math.round(value)]
    return day?.dateLabel ?? ''
  }

  return {
    chartData,
    allIssues,
    colors: chartPalette,
    tooltipTemplate,
    xAccessor,
    yAccessors,
    xTickFormat
  }
}
