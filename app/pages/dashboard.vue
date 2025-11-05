<script setup lang="ts">
import {
  startOfWeek,
  endOfWeek,
  today,
  getLocalTimeZone,
} from "@internationalized/date";
import type { Range } from "~/types";

const { user } = await useAuth();

const dateRange = ref<Range>({
  start: startOfWeek(today(getLocalTimeZone()), "en-US").toDate(
    getLocalTimeZone(),
  ),
  end: endOfWeek(today(getLocalTimeZone()), "en-US").toDate(getLocalTimeZone()),
});
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
      <div class="p-6 space-y-6">
        <!-- Date Range Picker -->
        <DashboardDateRangePicker v-model="dateRange" />

        <!-- Chart -->
        <DashboardTimeEntriesChart :date-range="dateRange" />
      </div>
    </template>
  </UDashboardPanel>
</template>
