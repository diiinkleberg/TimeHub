<script setup lang="ts">
import type { NuxtError } from '#app'
import { clearError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

if (props.error?.statusCode === 401) {
  await clearError({
    redirect: '/?authExpired=1'
  })
}

useSeoMeta({
  title: 'Page not found',
  description: 'We’re sorry, but the page you requested could not be found.'
})

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
