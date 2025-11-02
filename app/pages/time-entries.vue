<!-- filepath: e:\Repos\TimeHub\app\pages\time-entries.vue -->
<script setup lang="ts">
import type { Range } from "~/types";
import { subDays } from "date-fns";

// ✅ Date range state
const range = ref<Range>({
  start: subDays(new Date(), 30),
  end: new Date(),
});

// ✅ Fetch time entries based on date range
const {
  data: timeEntries,
  pending,
  error,
  refresh,
} = useFetch("/api/planio/time-entries", {
  query: computed(() => ({
    from: range.value.start.toISOString().split("T")[0],
    to: range.value.end.toISOString().split("T")[0],
  })),
  watch: [range],
  default: () => [],
});

// ✅ Refresh after new entry
const handleTimeEntrySuccess = () => {
  refresh();
};
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <UPageHeader
          title="Time Entries"
          description="Track and manage your work hours"
        />

        <UPageBody>
          <div class="space-y-6">
            <!-- Date Range Picker -->
            <div class="flex items-center gap-4">
              <DashboardDateRangePicker v-model="range" />
              <UButton
                icon="i-lucide-refresh-cw"
                variant="ghost"
                color="neutral"
                :loading="pending"
                @click="refresh()"
              />
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="flex items-center justify-center py-12">
              <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
            </div>

            <!-- Error State -->
            <UCard v-else-if="error" color="error">
              <div class="text-center py-8">
                <UIcon name="i-lucide-alert-circle" class="size-12 mx-auto mb-4 text-error" />
                <h3 class="text-lg font-semibold mb-2">Failed to load time entries</h3>
                <UButton
                  label="Retry"
                  variant="ghost"
                  @click="refresh()"
                />
              </div>
            </UCard>

            <template v-else>
              <!-- Chart -->
              <TimeEntriesTime :time-entries="timeEntries" />

              <!-- Form -->
              <TimeEntriesTimeEntryForm @success="handleTimeEntrySuccess" />

              <!-- Entries List (Optional - for later) -->
              <UCard v-if="timeEntries.length > 0">
                <template #header>
                  <h3 class="text-lg font-semibold">Recent Entries</h3>
                </template>
                
                <div class="divide-y divide-default">
                  <div
                    v-for="entry in timeEntries.slice(0, 5)"
                    :key="entry.id"
                    class="py-3 flex items-center justify-between"
                  >
                    <div class="flex-1">
                      <div class="font-medium">{{ entry.issue?.id }} - {{ entry.comments }}</div>
                      <div class="text-sm text-muted">{{ entry.project?.name }}</div>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="text-sm text-muted">{{ entry.spent_on }}</span>
                      <span class="font-semibold">{{ entry.hours }}h</span>
                    </div>
                  </div>
                </div>
              </UCard>
            </template>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>