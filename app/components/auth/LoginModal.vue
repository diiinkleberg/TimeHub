<script lang="ts" setup>
const { signInWithPlanio } = await useAuth()
const isLoading = ref(false)

const handleSignIn = async () => {
  isLoading.value = true

  try {
    await signInWithPlanio()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UModal
    title="Sign in to TimeHub"
    description="Connect your PlanIO account to start tracking time."
    class="flex items-center justify-center"
  >
    <UButton
      label="Sign In"
      color="primary"
      variant="subtle"
    />

    <template #body>
      <div class="flex flex-col items-center justify-center w-full">
        <UButton
          type="button"
          size="lg"
          color="primary"
          icon="material-symbols:login"
          :trailing="true"
          :loading="isLoading"
          class="flex items-center justify-center w-full"
          @click="handleSignIn"
        >
          Continue with PlanIO
        </UButton>
      </div>
    </template>
  </UModal>
</template>
