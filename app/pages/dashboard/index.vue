<script lang="ts" setup>
import { authClient } from '~/lib/auth-client'

// ✅ Get session (protected by middleware)
const { data: session } = await authClient.useSession(useFetch)
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">
          Dashboard
        </h1>
        <p class="text-muted-foreground mt-2">
          Welcome back, {{ session?.user?.name || session?.user?.email }}!
        </p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-clock"
              class="size-5"
            />
            <h3 class="font-semibold">
              Time Entries
            </h3>
          </div>
        </template>
        <p class="text-muted-foreground">
          Track your time entries here.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-calendar"
              class="size-5"
            />
            <h3 class="font-semibold">
              Weekly Report
            </h3>
          </div>
        </template>
        <p class="text-muted-foreground">
          View your weekly summary.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-settings"
              class="size-5"
            />
            <h3 class="font-semibold">
              Settings
            </h3>
          </div>
        </template>
        <p class="text-muted-foreground">
          Manage your preferences.
        </p>
      </UCard>
    </div>
  </div>
</template>
