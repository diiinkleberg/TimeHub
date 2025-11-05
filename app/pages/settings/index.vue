<script setup lang="ts">

</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingsPlanioCard />
        <SettingsLinkGithubCard />
      </div>
      <SettingsColorModeCard />
      <SettingsPrimaryColorCard />
      <SettingsNeutralColorCard />
    </template>
  </UDashboardPanel>
</template>
