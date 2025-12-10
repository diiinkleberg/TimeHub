<script setup lang="ts">
const route = useRoute()
const error = computed(() => route.query.error as string)

const errorTitle = computed(() => {
  switch (error.value) {
    case 'account_already_linked_to_different_user':
      return 'Account Already Linked'
    default:
      return 'An Error Occurred'
  }
})

const errorMessage = computed(() => {
  switch (error.value) {
    case 'account_already_linked_to_different_user':
      return 'This account is already linked to another user. Please sign in with that user to access it.'
    default:
      return 'Something went wrong. Please try again.'
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
    <UCard class="max-w-md w-full text-center">
      <div class="flex justify-center mb-4">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-error" />
      </div>
      
      <h1 class="text-xl font-bold mb-2">{{ errorTitle }}</h1>
      <p class="text-muted mb-6">{{ errorMessage }}</p>
      
      <UButton to="/dashboard" color="primary" block>
        Return to Dashboard
      </UButton>
    </UCard>
  </div>
</template>
