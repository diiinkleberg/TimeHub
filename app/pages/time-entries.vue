<script setup lang="ts">
import type { PlanioTimeEntry } from "#shared/schemas/planio/time-entry";

const {
  data: timeEntries,
  pending,
  error,
  refresh,
} = useFetch<PlanioTimeEntry[]>("/api/planio/time-entries", {
  query: {
    limit: 10,
  },
  default: () => [],
});

const handleSuccess = () => refresh();
</script>

<template>
  <UDashboardPanel id="time-entries">
    <template #header>
      <UDashboardNavbar title="Time Entries" icon="i-lucide-clock">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="pending"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Time Entry Form -->
        <TimeEntriesTimeEntryForm @success="handleSuccess" />

        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center py-12">
          <UIcon
            name="i-lucide-loader-2"
            class="size-8 animate-spin text-primary"
          />
        </div>

        <!-- Error State -->
        <UCard v-else-if="error">
          <div class="text-center py-8">
            <UIcon
              name="i-lucide-alert-circle"
              class="size-12 mx-auto mb-4 text-error"
            />
            <h3 class="text-lg font-semibold mb-2">
              Failed to load time entries
            </h3>
            <UButton label="Retry" variant="ghost" @click="refresh()" />
          </div>
        </UCard>

        <!-- Recent Entries List -->
        <TimeEntriesTimeEntryList
          v-else-if="timeEntries.length > 0"
          :entries="timeEntries"
          :pending="pending"
        />

        <!-- Empty State -->
        <UCard v-else>
          <div class="text-center py-12">
            <UIcon
              name="i-lucide-clock"
              class="size-12 mx-auto mb-4 text-muted"
            />
            <h3 class="text-lg font-semibold mb-2">No time entries found</h3>
            <p class="text-sm text-muted">
              Create your first time entry to get started
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
