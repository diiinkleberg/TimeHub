<script lang="ts" setup>
definePageMeta({
  layout: false,
});

const features = [
  {
    icon: "i-lucide-clock",
    title: "Quick Time Entry",
    description:
      "Log time faster and more efficiently",
  },
  {
    icon: "i-lucide-calendar",
    title: "Weekly Overview",
    description:
      "Visualize your time entries with interactive charts and summaries.",
  },
  {
    icon: "i-lucide-zap",
    title: "Fast & Lightweight",
    description: "Built with modern tools for speed and efficiency",
  },
  {
    icon: "i-lucide-database",
    title: "PlanIO Integration",
    description:
      "Seamlessly syncs with your PlanIO projects, issues, and activities",
  },
  {
    icon: "i-lucide-search",
    title: "Smart Search",
    description: "Find issues and projects quickly with intelligent search",
  },
  {
    icon: "i-lucide-bar-chart-3",
    title: "Analytics",
    description:
      "Track your productivity with detailed time tracking analytics",
  },
];
</script>

<template>
  <div class="min-h-screen bg-background">
    <UHeader>
      <template #left>
        <ULink to="/" class="flex items-center gap-2">
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
                <UIcon :name="feature.icon" class="size-6 text-primary" />
              </div>
              <h3 class="font-semibold">{{ feature.title }}</h3>
            </div>
          </template>
          <p class="text-muted">{{ feature.description }}</p>
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
          v-for="(step, index) in [
            {
              title: 'Connect your PlanIO account',
              description:
                'Securely authenticate with OAuth 2.0. We never store your password.',
              icon: 'i-lucide-link',
            },
            {
              title: 'Select your project and issue',
              description:
                'Use smart search to quickly find what you\'re working on.',
              icon: 'i-lucide-search',
            },
            {
              title: 'Log your time',
              description: 'Enter hours and description. Done in seconds.',
              icon: 'i-lucide-check',
            },
          ]"
          :key="index"
          class="flex gap-6 items-start"
        >
          <div
            class="shrink-0 size-12 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <UIcon :name="step.icon" class="size-6 text-primary" />
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold mb-2">
              {{ index + 1 }}. {{ step.title }}
            </h3>
            <p class="text-muted">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </UPageSection>

    <footer class="border-t border-default py-8 mt-24">
      <UContainer>
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <span class="text-sm text-muted">
            © 2025 TimeHub
          </span>
          <div class="flex items-center gap-4 text-sm">
            <NuxtLink
              to="/"
              class="text-muted hover:text-primary transition-colors"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/"
              class="text-muted hover:text-primary transition-colors"
            >
              Terms
            </NuxtLink>
            <a
              href="https://github.com/skillnetworks/SF_TimeHub"
              class="text-muted hover:text-primary transition-colors"
            >
              <UIcon name="i-lucide-github" class="size-5" />
            </a>
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
