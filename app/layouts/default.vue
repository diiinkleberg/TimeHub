<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const open = ref(false);
const route = useRoute();

const routeTitle = computed(() => {
  const currentRoute =
    route.path.split("/").findLast((segment) => segment.length > 0) || "Dashboard";
    return currentRoute
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
});

const links = [
  {
    label: "Home",
    icon: "i-lucide-house",
    to: "/dashboard",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Time Entries",
    icon: "i-lucide-clock",
    to: "/time-entries",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Profile",
    icon: "i-lucide-user",
    to: "/profile",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Settings",
    to: "/settings",
    icon: "i-lucide-settings",
    defaultOpen: true,
    type: "trigger",
    children: [
      {
        label: "General",
        to: "/settings/general",
        exact: true,
        onSelect: () => {
          open.value = false;
        },
      },
      {
        label: "Integrations",
        to: "/settings/integrations",
        exact: true,
        onSelect: () => {
          open.value = false;
        },
      },
    ],
  },
] satisfies NavigationMenuItem[];

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links,
  },
]);
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
        <h1 class="text-xl font-bold">TimeHub</h1>
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
      <UDashboardNavbar :title="routeTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardSearch :groups="groups" />

      <slot />
    </div>
  </UDashboardGroup>
</template>
