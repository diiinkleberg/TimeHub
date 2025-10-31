<script setup lang="ts">
const { user } = await useAuth();

const stats = [
  {
    label: "Total Hours",
    value: "42.5",
    icon: "i-lucide-clock",
    color: "primary" as const,
  },
  {
    label: "This Week",
    value: "18.2",
    icon: "i-lucide-calendar",
    color: "success" as const,
  },
  {
    label: "Projects",
    value: "5",
    icon: "i-lucide-folder",
    color: "info" as const,
  },
];
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>

        <UPageBody>
          <UPageGrid>
            <!-- Stats Cards -->
            <UPageCard
              v-for="stat in stats"
              :key="stat.label"
              :title="stat.value"
              :description="stat.label"
            >
              <template #icon>
                <UIcon
                  :name="stat.icon"
                  class="size-8"
                  :class="`text-${stat.color}`"
                />
              </template>
            </UPageCard>
          </UPageGrid>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>
