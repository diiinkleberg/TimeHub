<script setup lang="ts">

</script>

<template>
  <UDashboardPanel
    id="settings"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <section class="space-y-8">
        <div>
          <h2 class="text-lg font-semibold mb-3 text-highlighted">
            Integrations
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsPlanioCard />
            <SettingsLinkGithubCard />
          </div>
        </div>

        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-highlighted">
            Appearance
          </h2>
          <div class="grid grid-cols-1 gap-6">
            <SettingsColorModeCard />
            <SettingsPrimaryColorCard />
            <SettingsNeutralColorCard />
          </div>
        </div>
      </section>
    </template>
  </UDashboardPanel>
</template>
