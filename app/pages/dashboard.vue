<script setup lang="ts">
import {
  startOfWeek,
  endOfWeek,
  today,
  getLocalTimeZone
} from '@internationalized/date'
import type { Range } from '~/types'

const dateRange = ref<Range>({
  start: startOfWeek(today(getLocalTimeZone()), 'de-DE').toDate(
    getLocalTimeZone()
  ),
  end: endOfWeek(today(getLocalTimeZone()), 'de-DE').toDate(getLocalTimeZone())
})

// Generate unique key for chart re-rendering
const chartKey = computed(
  () => `${dateRange.value.start.getTime()}-${dateRange.value.end.getTime()}`
)
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
          <DashboardDateRangePicker v-model="dateRange" />
        </div>

        <DashboardTimeEntriesChart
          :key="chartKey"
          :date-range="dateRange"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
