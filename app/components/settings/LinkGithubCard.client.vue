<script setup lang="ts">
import { useLinkedAccounts } from '~/composables/useLinkedAccounts'

const {
  loading,
  isGithubLinked,
  linkGithub,
  unlinkGithub
} = await useLinkedAccounts()

const showUnlinkConfirm = ref(false)

const handleLink = async () => {
  try {
    await linkGithub()
  } catch (error) {
    console.error('Failed to link GitHub:', error)
  }
}

const handleUnlink = async () => {
  try {
    await unlinkGithub()
    showUnlinkConfirm.value = false
  } catch (error) {
    console.error('Failed to unlink GitHub:', error)
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg">
          <UIcon
            name="i-simple-icons-github"
            class="size-5"
          />
        </div>
        <div>
          <h3 class="text-base font-semibold">
            GitHub
          </h3>
          <p class="text-sm text-muted">
            Connect your account
          </p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted">
        Link your GitHub account to track commits and view contribution data.
      </p>

      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex items-center gap-2 text-muted py-4"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-4 animate-spin"
        />
        <span class="text-sm">Loading connection status...</span>
      </div>

      <!-- Not connected state -->
      <template v-if="!isGithubLinked && !loading">
        <UAlert
          icon="i-lucide-info"
          color="error"
          variant="soft"
          title="Not Connected"
          description="Link your GitHub account to start tracking commits and contributions."
        />

        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="solid"
          size="sm"
          @click="handleLink"
        >
          Link GitHub Account
        </UButton>
      </template>

      <!-- Connected state -->
      <template v-else-if="isGithubLinked && !showUnlinkConfirm">
        <UAlert
          icon="i-lucide-check-circle"
          color="success"
          variant="soft"
          title="Connected"
          description="Your GitHub account is linked and active."
        />

        <UButton
          icon="i-lucide-unlink"
          color="error"
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="showUnlinkConfirm = true"
        >
          Unlink Account
        </UButton>
      </template>

      <!-- Confirmation alert -->
      <template v-if="showUnlinkConfirm">
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="outline"
          title="Unlink GitHub Account?"
          description="This will remove access to your GitHub commits. You can always reconnect later."
        />
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="showUnlinkConfirm = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            size="sm"
            :loading="loading"
            @click="handleUnlink"
          >
            Confirm Unlink
          </UButton>
        </div>
      </template>
    </div>
  </UCard>
</template>
