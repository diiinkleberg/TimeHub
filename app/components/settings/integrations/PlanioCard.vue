<!-- components/integrations/PlanioCard.vue -->
<script setup lang="ts">

</script>

<template>
  <UPageCard class="">
    <template #icon>
      <UIcon name="i-lucide-briefcase" class="size-8" />
    </template>

    <template #title>Planio</template>

    <template #description>
      <div class="space-y-3">
        <p class="text-muted">
          This is your primary authentication
          method.
        </p>

        <UAlert
          v-if="true"
          icon="i-lucide-check-circle"
          color="success"
          variant="soft"
          title="Active"
          description="Primary authentication method cannot be unlinked."
        />

        <UAlert
          v-else
          icon="i-lucide-alert-triangle"
          color="warning"
          variant="soft"
          title="Not Connected"
          description="Planio account not found."
        />
      </div>
    </template>
  </UPageCard>
</template>
