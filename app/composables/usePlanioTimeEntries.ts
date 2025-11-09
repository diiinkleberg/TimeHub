import { computed, unref, type Ref } from 'vue'
import type { PlanioTimeEntry } from '#shared/schemas/planio/time-entry'

interface UsePlanioRecentTimeEntriesOptions {
  limit?: Ref<number | undefined> | number
}

export function usePlanioRecentTimeEntries(
  options: UsePlanioRecentTimeEntriesOptions = {}
) {
  const limit = computed(() => unref(options.limit) ?? 10)

  const state = useAsyncData(
    () => `planio-recent-time-entries-${limit.value}`,
    () =>
      $fetch<PlanioTimeEntry[]>('/api/planio/time-entries', {
        query: { limit: limit.value }
      }),
    {
      default: () => [],
      server: false,
      watch: [() => limit.value]
    }
  )

  const entries = computed(() => state.data.value ?? [])
  const totalHours = computed(() =>
    entries.value.reduce((sum, entry) => sum + entry.hours, 0)
  )
  const hasEntries = computed(() => entries.value.length > 0)

  return {
    ...state,
    entries,
    totalHours,
    hasEntries,
    limit
  }
}
