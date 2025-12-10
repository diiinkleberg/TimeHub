<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
const route = useRoute()

useDashboard()

const closeSidebar = () => {
  open.value = false
}

const baseLinks: NavigationMenuItem[] = [
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/dashboard'
  },
  {
    label: 'Time Entries',
    icon: 'i-lucide-clock',
    to: '/time-entries'
  },
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    to: '/profile'
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings'
  }
]

const links = computed(() =>
  baseLinks.map(link => ({
    ...link,
    onSelect: closeSidebar
  }))
)

const colorMode = useColorMode()
const logoSrc = computed(() =>
  colorMode.value === 'dark'
    ? '/brand_light.svg'
    : '/brand_dark.svg'
)

watch(
  () => route.path,
  () => {
    closeSidebar()
  }
)

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.value
  }
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div
          v-if="!collapsed"
          class="w-full flex justify-center items-center p-4"
        >
          <ClientOnly>
            <img
              :src="logoSrc"
              alt="TimeHub Logo"
              class="h-12 w-auto mr-2"
            >
          </ClientOnly>
        </div>
        <div
          v-else
          class="p-4 flex w-full justify-center items-center font-bold"
        >
          <h1>SF</h1>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <AuthUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
