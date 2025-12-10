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
    title="Authentication Required"
    description="Please sign in with your PlanIO account to access the application."
    class="flex items-center justify-center"
  >
    <UButton
      label="Sign In"
      color="primary"
      size="lg"
    />

    <template #body>
      <div class="flex flex-col items-center justify-center w-full py-4">
        <UButton
          type="button"
          size="xl"
          color="primary"
          icon="material-symbols:login"
          :trailing="true"
          :loading="isLoading"
          class="flex items-center justify-center w-full"
          @click="handleSignIn"
        >
          Authenticate with PlanIO
        </UButton>
      </div>
    </template>
  </UModal>
</template>
