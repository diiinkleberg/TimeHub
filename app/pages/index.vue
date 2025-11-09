<script setup lang="ts">
definePageMeta({
  layout: false
})

interface FeatureCard {
  icon: string
  title: string
  description: string
}

const features: ReadonlyArray<FeatureCard> = [
  {
    icon: 'i-lucide-clock',
    title: 'Quick Time Entry',
    description: 'Log time faster and more efficiently.'
  },
  {
    icon: 'i-lucide-calendar',
    title: 'Weekly Overview',
    description:
      'Visualise your time entries with interactive charts and summaries.'
  },
  {
    icon: 'i-lucide-zap',
    title: 'Fast & Lightweight',
    description: 'Built with modern Nuxt tooling for speed and efficiency.'
  },
  {
    icon: 'i-lucide-database',
    title: 'PlanIO Integration',
    description: 'Sync projects, issues, and activities directly from PlanIO.'
  },
  {
    icon: 'i-lucide-search',
    title: 'Smart Search',
    description: 'Find issues and projects instantly with intelligent search.'
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Analytics',
    description:
      'Track productivity with detailed, ready-to-share time analytics.'
  }
] as const

const steps = [
  {
    title: 'Connect your PlanIO account',
    description:
      'Securely authenticate with OAuth 2.0 — your credentials stay with PlanIO.',
    icon: 'i-lucide-link'
  },
  {
    title: 'Select your project and issue',
    description:
      'Use smart search to quickly locate the work item you need to update.',
    icon: 'i-lucide-search'
  },
  {
    title: 'Log your time',
    description: 'Enter hours and a description. Done in a few seconds.',
    icon: 'i-lucide-check'
  }
] as const

const footerLinks = [
  { label: 'Privacy', to: '/' },
  { label: 'Terms', to: '/' }
] as const

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen bg-background">
    <UHeader>
      <template #left>
        <ULink
          to="/"
          class="flex items-center gap-2"
        >
          <AppLogo class="w-auto h-6 shrink-0" />
        </ULink>
      </template>

      <template #right>
        <UColorModeButton />
        <AuthLoginModal />
      </template>
    </UHeader>

    <UPageSection
      id="features"
      title="Everything you need"
      class="py-24"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <UCard
          v-for="feature in features"
          :key="feature.title"
          class="hover:shadow-lg transition-shadow"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon
                  :name="feature.icon"
                  class="size-6 text-primary"
                />
              </div>
              <h3 class="font-semibold">
                {{ feature.title }}
              </h3>
            </div>
          </template>
          <p class="text-muted">
            {{ feature.description }}
          </p>
        </UCard>
      </div>
    </UPageSection>

    <UPageSection
      title="How it works"
      description="Get started in three simple steps"
      class="py-24 bg-muted/30"
    >
      <div class="max-w-4xl mx-auto space-y-12">
        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="flex gap-6 items-start"
        >
          <div
            class="shrink-0 size-12 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <UIcon
              :name="step.icon"
              class="size-6 text-primary"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold mb-2">
              {{ index + 1 }}. {{ step.title }}
            </h3>
            <p class="text-muted">
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>
    </UPageSection>

    <footer class="border-t border-default py-8 mt-24">
      <UContainer>
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <span class="text-sm text-muted">© {{ currentYear }} TimeHub</span>
          <div class="flex items-center gap-4 text-sm">
            <NuxtLink
              v-for="link in footerLinks"
              :key="link.label"
              :to="link.to"
              class="text-muted hover:text-primary transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
            <a
              href="https://github.com/skillnetworks/SF_TimeHub"
              class="text-muted hover:text-primary transition-colors"
            >
              <UIcon
                name="i-lucide-github"
                class="size-5"
              />
            </a>
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
