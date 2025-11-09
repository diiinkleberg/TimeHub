<script setup lang="ts">
import { storeToRefs } from 'pinia'

const preferencesStore = usePreferencesStore()
const { shouldShowCookieBanner } = storeToRefs(preferencesStore)

const handleAccept = () => {
  if (!shouldShowCookieBanner.value) {
    return
  }

  preferencesStore.acceptCookies()
}
</script>

<template>
  <UAlert
    v-if="shouldShowCookieBanner"
    color="neutral"
    variant="subtle"
    icon="i-lucide-cookie"
    title="Cookie Notice"
    class="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md shadow-xl z-50"
  >
    <template #description>
      <div class="space-y-3">
        <p class="text-sm">
          We use essential cookies to keep you signed in and remember your
          preferences. No tracking or third-party cookies are used.
        </p>

        <div class="text-xs space-y-1">
          <p class="font-medium">
            Cookies used:
          </p>
          <ul class="list-disc list-inside space-y-0.5 ml-2">
            <li>
              <code class="text-xs bg-elevated px-1 py-0.5 rounded">session</code>
              - Authentication
            </li>
            <li>
              <code class="text-xs bg-elevated px-1 py-0.5 rounded">preferences</code>
              - Theme settings
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #actions>
      <UButton
        color="primary"
        label="Accept"
        size="xs"
        @click="handleAccept"
      />
    </template>
  </UAlert>
</template>
