<script setup lang="ts">;

const { linkGithubAccount, unlinkGithubAccount, listAccounts } = await useAuth();
const route = useRoute();

const accounts = ref<Array<any>>([]);
const isLoading = ref(true);
const showUnlinkConfirm = ref(false);

async function fetchAccounts() {
  isLoading.value = true;
  try {
    const result = await listAccounts();
    if (result.data) {
      accounts.value = result.data;
    }
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
  } finally {
    isLoading.value = false;
  }
}

const isGithubLinked = computed(() => 
  accounts.value.some((acc) => acc.providerId === 'github')
);

async function handleLink() {
  isLoading.value = true;
  try {
    await linkGithubAccount();
  } catch (error) {
    console.error("Failed to link GitHub:", error);
  } finally {
    isLoading.value = false;
  }
}

async function handleUnlink() {
  isLoading.value = true;
  try {
    await unlinkGithubAccount();
    await fetchAccounts();
    showUnlinkConfirm.value = false;
  } catch (error) {
    console.error("Failed to unlink GitHub:", error);
  } finally {
    isLoading.value = false;
  }
}

// Initial fetch
onMounted(async () => {
  await fetchAccounts();
});
</script>

<template>
  <UPageCard>
    <template #title>GitHub</template>

    <template #description>
      <div class="space-y-3">
        <p class="text-muted">
          Connect your GitHub account
        </p>

        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          <span>Loading...</span>
        </div>

        <!-- Confirmation alert -->
        <UAlert
          v-else-if="showUnlinkConfirm"
          icon="i-lucide-alert-triangle"
          color="error"
          variant="outline"
          title="Unlink GitHub Account?"
          description="This will remove access to your GitHub commits. You can always reconnect later."
        >
          <template #actions>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              @click="showUnlinkConfirm = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              size="xs"
              :loading="isLoading"
              @click="handleUnlink"
            >
              Unlink
            </UButton>
          </template>
        </UAlert>

        <!-- Connected state -->
        <div v-else-if="isGithubLinked">
          <UAlert
            icon="i-lucide-check-circle"
            color="success"
            variant="soft"
            title="Connected"
            description="Your GitHub account is linked and ready to use."
          />

          <div class="flex gap-3 mt-4">
            <UButton
              icon="i-lucide-unlink"
              color="error"
              variant="outline"
              :disabled="isLoading"
              @click="showUnlinkConfirm = true"
            >
              Unlink
            </UButton>
          </div>
        </div>

        <!-- Not connected state -->
        <div v-else>
          <UAlert
            icon="i-lucide-info"
            color="error"
            variant="soft"
            title="Not connected"
            description="Link your GitHub account to start tracking commits"
          />

          <UButton
            icon="i-simple-icons-github"
            color="neutral"
            variant="solid"
            class="mt-4"
            @click="handleLink"
          >
            Link GitHub Account
          </UButton>
        </div>
      </div>
    </template>
  </UPageCard>
</template>
