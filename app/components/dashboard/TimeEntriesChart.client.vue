<script setup lang="ts">
import { computed, toRef, watch } from 'vue'
import {
  VisXYContainer,
  VisStackedBar,
  VisAxis,
  VisTooltip
} from '@unovis/vue'
import { StackedBar } from '@unovis/ts'
import type { Range } from '~/types'
import {
  usePlanioIssues,
  usePlanioTimeEntries,
  useStackedTimeEntriesData,
  type TimeEntriesChartDay
} from '~/composables/usePlanioReporting'

interface Props {
  dateRange: Range
}

const props = defineProps<Props>()
const range = toRef(props, 'dateRange')

const {
  data: timeEntries,
  pending: entriesPending,
  error: entriesError,
  refresh: refreshEntries
} = usePlanioTimeEntries(range)

const issueIds = computed(() => {
  const ids = new Set<number>()

  timeEntries.value.forEach((entry) => {
    if (entry.issue?.id) {
      ids.add(entry.issue.id)
    }
  })

  return Array.from(ids)
})

const {
  data: issues,
  pending: issuesPending,
  error: issuesError
} = usePlanioIssues(issueIds)

const {
  chartData,
  allIssues,
  colors,
  tooltipTemplate,
  xAccessor,
  yAccessors,
  xTickFormat
} = useStackedTimeEntriesData(timeEntries, issues)

const barColor = (_: TimeEntriesChartDay, index: number) =>
  colors[index % colors.length]

const pending = computed(() => entriesPending.value || issuesPending.value)
const error = computed(() => entriesError.value ?? issuesError.value ?? null)

const focused = useWindowFocus()
watch(focused, (isFocused) => {
  if (isFocused) {
    refreshEntries()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="pending"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
      <span class="ml-3 text-muted">Loading time entries...</span>
    </div>

    <div
      v-else-if="error"
      class="text-center py-12 text-error bg-error/20 rounded-lg border border-error/40"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="size-8 mx-auto mb-2"
      />
      <p>Failed to load time entries</p>
      <p class="text-sm mt-2">
        {{ error.message ?? "Unknown error" }}
      </p>
    </div>

    <div
      v-else-if="!chartData.length"
      class="text-center py-12 text-muted"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="size-12 mx-auto mb-3 opacity-50"
      />
      <p class="text-lg font-medium">
        No time entries found for this period
      </p>
      <p class="text-sm mt-2">
        {{
          timeEntries.length
            ? `Found ${timeEntries.length} entr${timeEntries.length === 1 ? "y" : "ies"} without issue context`
            : "Start logging time to see your activity chart"
        }}
      </p>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div class="bg-elevated/50 rounded-lg border border-default p-4">
        <VisXYContainer
          :data="chartData"
          :height="350"
          :margin="{ top: 10, right: 20, bottom: 60, left: 60 }"
        >
          <VisStackedBar
            :x="xAccessor"
            :y="yAccessors"
            :color="barColor"
            :rounded-corners="4"
            :bar-padding="0.3"
            :bar-max-width="90"
          />

          <VisAxis
            type="x"
            :num-ticks="chartData.length"
            :tick-format="xTickFormat"
            :grid-line="false"
            :tick-text-angle="-45"
          />

          <VisAxis
            type="y"
            label="Hours"
            :tick-format="(value: number) => `${value}h`"
            :grid-line="true"
          />

          <VisTooltip :triggers="{ [StackedBar.selectors.bar]: tooltipTemplate }" />
        </VisXYContainer>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-layers"
              class="size-4 text-primary"
            />
            <h3 class="font-semibold text-highlighted">
              Issues ({{ allIssues.length }})
            </h3>
          </div>
        </template>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="(issue, index) in allIssues"
            :key="issue"
            class="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-elevated border border-default hover:border-primary/50 transition-colors"
          >
            <div
              class="size-3 rounded-sm"
              :style="{ backgroundColor: colors[index % colors.length] }"
            />
            <span
              class="text-default truncate max-w-[280px]"
              :title="issue"
            >
              {{ issue }}
            </span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.vis-xy-container {
  --vis-stacked-bar-cursor: pointer;
  --vis-axis-tick-color: rgb(var(--color-muted));
  --vis-axis-grid-color: rgb(var(--color-default) / 0.1);
  --vis-axis-tick-label-color: rgb(var(--color-muted));
  --vis-axis-label-color: rgb(var(--color-highlighted));
  --vis-font-family: inherit;
}
</style>
