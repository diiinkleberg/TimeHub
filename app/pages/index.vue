<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: false
})

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

const loginLoading = ref(false)
const handleLogin = async () => {
  loginLoading.value = true
  try {
    await signInWithPlanio()
  } finally {
    loginLoading.value = false
  }
}

const currentYear = new Date().getFullYear()

const items = [
  '/Dashboard.png',
  '/Settings.png',
  '/TimeEntries.png'
]
</script>

<template>
  <div class="flex min-h-screen flex-col justify-center">
    <main class="flex-1 flex items-center">
      <UContainer class="w-full py-12">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-8 text-center lg:text-left">
            <UColorModeImage light="/brand_dark.svg" dark="/brand_light.svg" class="w-auto h-16 mx-auto lg:mx-0" />
            
            <div class="space-y-4">
              <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                TimeHub
              </h1>
              <p class="text-lg text-gray-500 dark:text-gray-400">
                Internal Time Tracking & Reporting
              </p>
            </div>

            <div class="flex justify-center lg:justify-start gap-4">
              <UButton
                size="lg"
                color="primary"
                :loading="loginLoading"
                @click="handleLogin"
              >
                Sign in with Planio
              </UButton>
              <UColorModeButton />
            </div>
          </div>

          <div class="relative">
            <UCarousel
              v-slot="{ item }"
              :items="items"
              :ui="{ item: 'basis-full' }"
              class="rounded-xl overflow-hidden shadow-2xl ring-1 ring-primary/20"
              arrows
              indicators
              autoplay
            >
              <img :src="item" class="w-full" draggable="false">
            </UCarousel>
          </div>
        </div>
      </UContainer>

      <div
        v-if="sessionExpired"
        class="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
      >
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-alert-triangle"
          title="Session expired"
        >
          <template #description>
            <p class="text-sm">
              Your session has expired. Please sign in again.
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
                Sign in
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
    </main>
  </div>
</template>
