<script setup lang="ts">

const {
  entries,
  pending,
  error,
  refresh,
  hasEntries
} = usePlanioRecentTimeEntries({ limit: 10 })

const handleSuccess = () => refresh()
</script>

<template>
  <UDashboardPanel id="time-entries">
    <template #header>
      <UDashboardNavbar
        title="Time Entries"
        icon="i-lucide-clock"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <TimeEntriesTimeEntryForm @success="handleSuccess" />

        <div
          v-if="pending"
          class="flex justify-center py-12"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="size-8 animate-spin text-primary"
          />
        </div>

        <UCard v-else-if="error">
          <div class="text-center py-8">
            <UIcon
              name="i-lucide-alert-circle"
              class="size-12 mx-auto mb-4 text-error"
            />
            <h3 class="text-lg font-semibold mb-2">
              Failed to load time entries
            </h3>
            <UButton
              label="Retry"
              variant="ghost"
              @click="refresh()"
            />
          </div>
        </UCard>

        <TimeEntriesTimeEntryList
          v-else-if="hasEntries"
          :entries="entries"
          :pending="pending"
        />

        <UCard v-else>
          <div class="text-center py-12">
            <UIcon
              name="i-lucide-clock"
              class="size-12 mx-auto mb-4 text-muted"
            />
            <h3 class="text-lg font-semibold mb-2">
              No time entries found
            </h3>
            <p class="text-sm text-muted">
              Create your first time entry to get started
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
