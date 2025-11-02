<script lang="ts" setup>
definePageMeta({
  layout: false,
});

const features = [
  {
    icon: "i-lucide-clock",
    title: "Quick Time Entry",
    description:
      "Log time in seconds with smart autocomplete and project filtering.",
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
    description: "Built with modern tools for speed and efficiency. No bloat.",
  },
  {
    icon: "i-lucide-database",
    title: "PlanIO Integration",
    description:
      "Seamlessly syncs with your PlanIO projects, issues, and activities.",
  },
  {
    icon: "i-lucide-search",
    title: "Smart Search",
    description: "Find issues and projects quickly with intelligent search.",
  },
  {
    icon: "i-lucide-bar-chart-3",
    title: "Analytics",
    description:
      "Track your productivity with detailed time tracking analytics.",
  },
];

const stats = [
  { label: "Average time saved per entry", value: "30 seconds" },
  { label: "Faster than PlanIO web", value: "3x" },
  { label: "User satisfaction", value: "100%" },
];
</script>

<!-- filepath: e:\Repos\TimeHub\app\pages\index.vue -->
<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
        <AuthLoginModal />
      </template>
    </UHeader>

    <!-- Hero Section -->
    <UPageSection class="py-24">
      <div class="text-center max-w-3xl mx-auto">
        <h1
          class="text-5xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-primary-300 bg-clip-text text-transparent"
        >
          Track Time Faster with PlanIO
        </h1>
        <p class="text-xl text-muted mb-8">
          A modern, lightning-fast time tracking interface for your PlanIO
          projects. Log hours in seconds, not minutes.
        </p>
        <div class="flex items-center justify-center gap-4">
          <AuthLoginModal>
            <UButton
              label="Get Started"
              size="xl"
              icon="i-lucide-arrow-right"
              trailing
            />
          </AuthLoginModal>
          <UButton
            label="View Demo"
            size="xl"
            variant="ghost"
            icon="i-lucide-play"
            to="#demo"
          />
        </div>
      </div>
    </UPageSection>

    <!-- Stats Section -->
    <UPageSection class="py-16 bg-muted/30">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <div class="text-4xl font-bold text-primary mb-2">
            {{ stat.value }}
          </div>
          <div class="text-muted">{{ stat.label }}</div>
        </div>
      </div>
    </UPageSection>

    <!-- Features Section -->
    <UPageSection
      id="features"
      title="Everything you need"
      description="Built for developers who value their time"
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

    <!-- How It Works Section -->
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
            class="flex-shrink-0 size-12 rounded-full bg-primary/10 flex items-center justify-center"
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

    <!-- CTA Section -->
    <UPageSection class="py-24 text-center">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-4xl font-bold mb-6">Ready to save time?</h2>
        <p class="text-xl text-muted mb-8">
          Join developers who track their time without the hassle.
        </p>
        <AuthLoginModal>
          <UButton
            label="Start Tracking Time"
            size="xl"
            icon="i-lucide-rocket"
          />
        </AuthLoginModal>
      </div>
    </UPageSection>

    <!-- ✅ Footer (Custom, not UPageFooter) -->
    <footer class="border-t border-default py-8 mt-24">
      <UContainer>
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <span class="text-sm text-muted">
            © 2024 TimeHub. Built with ❤️ for PlanIO users.
          </span>
          <div class="flex items-center gap-4 text-sm">
            <NuxtLink
              to="/privacy"
              class="text-muted hover:text-primary transition-colors"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="text-muted hover:text-primary transition-colors"
            >
              Terms
            </NuxtLink>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
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
