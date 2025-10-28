<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const route = useRoute()
const routeTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/time-entries': 'Time Entries',
    '/settings': 'Settings',
    '/settings/general': 'Settings - General'
  }
  return titles[route.path] || 'TimeHub'
})

const links = [
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/dashboard',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Time Entries',
    icon: 'i-lucide-clock',
    to: '/time-entries',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: 'i-lucide-settings',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'General',
        to: '/settings/general',
        exact: true,
        onSelect: () => {
          open.value = false
        }
      }
    ]
  }
] satisfies NavigationMenuItem[]

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
        target: '_blank'
      }
    ]
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
      <template #header>
        <h1>TimeHub</h1>
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

    <div class="flex-1 flex flex-col w-0">
      <UDashboardNavbar
        :title="routeTitle"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <UDashboardSearch :groups="groups" />
      <slot />
    </div>
  </UDashboardGroup>
</template>
