<script setup lang="ts">
import type { PlanioProject } from "#shared/schemas/planio/project";
import type { PlanioIssue } from "#shared/schemas/planio/issue";

const { user } = await useAuth();

// State
const selectedProject = ref<PlanioProject | null>(null);
const selectedIssue = ref<PlanioIssue | null>(null);
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      
    </template>
  </UDashboardPanel>
</template>
