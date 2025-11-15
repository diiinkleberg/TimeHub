<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: false
})

const features = [
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
]

const route = useRoute()
const router = useRouter()
const { signInWithPlanio } = await useAuth()

const sessionExpired = computed(() => route.query.authExpired === '1')
const reauthLoading = ref(false)

const dismissSessionExpired = async () => {
  if (!sessionExpired.value) {
    return
  }

  const nextQuery = { ...route.query }
  delete nextQuery.authExpired

  await router.replace({
    path: route.path,
    query: nextQuery
  })
}

const handleReauth = async () => {
  reauthLoading.value = true

  try {
    await signInWithPlanio()
  } finally {
    reauthLoading.value = false
  }
}

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-screen flex-col">
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

    <main class="flex-1">
      <div
        v-if="sessionExpired"
        class="px-4 pt-6 mx-auto w-full max-w-3xl"
      >
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-alert-triangle"
          title="Session expired"
        >
          <template #description>
            <p class="text-sm">
              Your session ended due to inactivity. Please sign in again to keep using TimeHub.
            </p>
          </template>
          <template #actions>
            <div class="flex flex-wrap gap-2">
              <UButton
                size="xs"
                color="primary"
                :loading="reauthLoading"
                @click="handleReauth"
              >
                Sign in again
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                @click="dismissSessionExpired"
              >
                Dismiss
              </UButton>
            </div>
          </template>
        </UAlert>
      </div>
      <UPageSection
        id="features"
        title="Everything you need"
        class="py-24"
      >
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <UCard
            v-for="feature in features"
            :key="feature.title"
            class="transition-shadow hover:shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-primary/10 p-2">
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
    </main>

    <UFooter>
      <template #left>
        <span class="text-sm text-muted">© {{ currentYear }} TimeHub</span>
      </template>
      <template #right>
        <ULink
          to="https://github.com/skillnetworks/SF_TimeHub"
          :external="true"
        >
          GitHub
        </ULink>
      </template>
    </UFooter>
  </div>
</template>
