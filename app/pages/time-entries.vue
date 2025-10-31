<!-- filepath: e:\Repos\TimeHub\app\pages\time-entries.vue -->
<script setup lang="ts">

const selectedDate = ref(new Date().toISOString().split('T')[0])
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
            <!-- Date Picker -->
            <UCard>
              <UFormField label="Select Date">
                <input
                  v-model="selectedDate"
                  type="date"
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  :max="new Date().toISOString().split('T')[0]"
                >
              </UFormField>
            </UCard>

            <!-- Empty State -->
            <UCard>
              <UEmpty
                icon="i-lucide-clock"
                title="No time entries yet"
                description="Start tracking your time by creating your first entry"
              >
                <template #actions>
                  <UButton
                    icon="i-lucide-plus"
                    label="Add Time Entry"
                    disabled
                  />
                </template>
              </UEmpty>
            </UCard>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>