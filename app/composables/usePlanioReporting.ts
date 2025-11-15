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
      } else {
        set.add('No Issue')
      }
    })

    return Array.from(set).sort((a, b) => {
      if (a === 'No Issue') {
        return 1
      }

      if (b === 'No Issue') {
        return -1
      }

      return a.localeCompare(b)
    })
  })

  const truncateLabel = (value: string, maxLength = 56) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value

  const tooltipTemplate = (
    day: TimeEntriesChartDay,
    _index: number,
    _elements: (HTMLElement | SVGElement)[]
  ): HTMLElement | void => {
    // Create the main container element
    const container = document.createElement('div')
    container.className = 'p-4 rounded-xl shadow-xl bg-elevated text-default border border-default min-w-[260px] max-w-[420px] space-y-2'

    // Create header with date
    const header = document.createElement('div')
    header.className = 'text-sm font-semibold text-highlighted pb-2 mb-2'
    header.style.borderBottom = '1px solid rgb(var(--color-default) / 0.15)'
    header.textContent = day.dateLabel

    // Create rows container
    const rowsContainer = document.createElement('div')
    rowsContainer.className = 'flex flex-col gap-1'

    let totalHours = 0
    let hasRows = false

    // Add issue rows
    allIssues.value.forEach((issueKey, index) => {
      const hours = (day[issueKey] as number) || 0
      if (!hours) return

      hasRows = true
      totalHours += hours

      const row = document.createElement('div')
      row.className = 'flex items-center justify-between gap-4 py-1.5 text-sm'

      const leftSide = document.createElement('div')
      leftSide.className = 'flex items-center gap-2 min-w-0'

      const colorDot = document.createElement('span')
      colorDot.className = 'size-3 rounded-sm shrink-0'
      colorDot.style.backgroundColor = chartPalette[index % chartPalette.length]!

      const label = document.createElement('span')
      label.className = 'truncate text-default'
      label.textContent = truncateLabel(issueKey)
      label.title = issueKey

      const hoursSpan = document.createElement('span')
      hoursSpan.className = 'font-semibold text-highlighted tabular-nums'
      hoursSpan.textContent = `${hours.toFixed(2)}h`

      leftSide.appendChild(colorDot)
      leftSide.appendChild(label)
      row.appendChild(leftSide)
      row.appendChild(hoursSpan)
      rowsContainer.appendChild(row)
    })

    if (!hasRows) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'text-xs text-muted'
      emptyMessage.textContent = 'No tracked hours for this day.'

      container.appendChild(header)
      container.appendChild(emptyMessage)
      return container
    }

    // Create footer with total
    const footer = document.createElement('div')
    footer.className = 'flex justify-between items-center pt-3 mt-3 text-sm font-medium'
    footer.style.borderTop = '1px solid rgb(var(--color-default) / 0.15)'

    const totalLabel = document.createElement('span')
    totalLabel.className = 'text-muted'
    totalLabel.textContent = 'Total'

    const totalValue = document.createElement('span')
    totalValue.className = 'text-primary font-semibold tabular-nums'
    totalValue.textContent = `${totalHours.toFixed(2)}h`

    footer.appendChild(totalLabel)
    footer.appendChild(totalValue)

    // Assemble the tooltip
    container.appendChild(header)
    container.appendChild(rowsContainer)
    container.appendChild(footer)

    return container
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
