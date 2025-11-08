<script setup lang="ts">
import {
  startOfWeek,
  endOfWeek,
  today,
  getLocalTimeZone,
} from "@internationalized/date";
import type { Range } from "~/types";

const dateRange = ref<Range>({
  start: startOfWeek(today(getLocalTimeZone()), "en-US").toDate(
    getLocalTimeZone(),
  ),
  end: endOfWeek(today(getLocalTimeZone()), "en-US").toDate(getLocalTimeZone()),
});

// Generate unique key for chart re-rendering
const chartKey = computed(
  () => `${dateRange.value.start.getTime()}-${dateRange.value.end.getTime()}`,
);
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

        <ClientOnly>
          <DashboardTimeEntriesChart :key="chartKey" :date-range="dateRange" />

          <template #fallback>
            <div
              class="h-96 bg-elevated/50 rounded-lg border border-default animate-pulse"
            />
          </template>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
