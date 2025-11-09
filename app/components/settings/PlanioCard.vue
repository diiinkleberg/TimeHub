<script setup lang="ts">

</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg">
          <UIcon
            name="i-lucide-briefcase"
            class="size-5"
          />
        </div>
        <div>
          <h3 class="text-base font-semibold">
            Planio
          </h3>
          <p class="text-sm text-muted">
            Primary authentication
          </p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted">
        This is your primary authentication method for accessing TimeHub and syncing time entries.
      </p>

      <UAlert
        v-if="true"
        icon="i-lucide-check-circle"
        color="success"
        variant="soft"
        title="Active"
        description="Primary authentication method cannot be unlinked."
      />
    </div>
  </UCard>
</template>
