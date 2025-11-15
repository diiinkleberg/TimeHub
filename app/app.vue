<script setup lang="ts">
const colorMode = useColorMode()
const preferencesStore = usePreferencesStore()

if (import.meta.client) {
  preferencesStore.initializeAppConfig()
}

const themeColor = computed(() =>
  colorMode.value === 'dark' ? '#1b1718' : '#ffffff'
)

const faviconHref = computed(() =>
  colorMode.value === 'dark' ? '/brand_light.svg' : '/brand_dark.svg'
)

useHead(() => ({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: themeColor.value }
  ],
  link: [{ rel: 'icon', type: 'image/svg+xml', href: faviconHref.value }],
  htmlAttrs: {
    lang: 'en'
  }
}))

const seoTitle = 'TimeHub'
const seoDescription = 'PlanIO companion for faster, accurate time tracking.'

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <!-- Cookie Consent Banner -->
    <CookieBanner />
  </UApp>
</template>
