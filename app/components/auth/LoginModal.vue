<script lang="ts" setup>
const isLoading = ref(false)

async function handleSignIn() {
  isLoading.value = true
  try {
    const { signInWithPlanio } = await useAuth()
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
  >
    <UButton
      label="Sign In"
      color="neutral"
      variant="subtle"
    />

    <template #body>
      <div class="space-y-4">
        <UButton
          type="button"
          block
          size="lg"
          color="primary"
          icon="simple-icons:adblock"
          :loading="isLoading"
          @click="handleSignIn"
        >
          Continue with PlanIO
        </UButton>

        <p class="text-xs text-center text-muted">
          By signing in, you agree to our
          <ULink
            to="/terms"
            class="text-primary hover:underline"
          >
            Terms of Service
          </ULink>
          and
          <ULink
            to="/privacy"
            class="text-primary hover:underline"
          >
            Privacy Policy
          </ULink>.
        </p>
      </div>
    </template>
  </UModal>
</template>
