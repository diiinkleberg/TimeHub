<script lang="ts" setup>
definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
        <AuthLoginModal />
      </template>
    </UHeader>

    <!-- Hero Section -->
    <UPageSection
      id="features"
      title="Track time faster with PlanIO"
      description="Modern time tracking interface for your PlanIO projects."
      :features="[
        {
          icon: 'i-lucide-clock',
          title: 'Quick Time Entry',
          description: 'Log time in seconds with smart autocomplete.'
        },
        {
          icon: 'i-lucide-calendar',
          title: 'Weekly Overview',
          description: 'See your time entries at a glance.'
        },
        {
          icon: 'i-lucide-zap',
          title: 'Fast & Lightweight',
          description: 'Optimized for speed and efficiency.'
        }
      ]"
    />
  </div>
</template>
