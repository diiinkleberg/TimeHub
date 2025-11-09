<script setup lang="ts">
import SettingsPlanioCard from '~/components/settings/PlanioCard.vue'
import SettingsLinkGithubCard from '~/components/settings/LinkGithubCard.vue'
import SettingsColorModeCard from '~/components/settings/ColorModeCard.vue'
import SettingsPrimaryColorCard from '~/components/settings/PrimaryColorCard.vue'
import SettingsNeutralColorCard from '~/components/settings/NeutralColorCard.vue'

const integrations = [
  { key: 'planio', component: SettingsPlanioCard },
  { key: 'github', component: SettingsLinkGithubCard }
] as const

const appearance = [
  { key: 'color-mode', component: SettingsColorModeCard },
  { key: 'primary-color', component: SettingsPrimaryColorCard },
  { key: 'neutral-color', component: SettingsNeutralColorCard }
] as const
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
            <component
              :is="card.component"
              v-for="card in integrations"
              :key="card.key"
            />
          </div>
        </div>

        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-highlighted">
            Appearance
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <component
              :is="card.component"
              v-for="card in appearance"
              :key="card.key"
            />
          </div>
        </div>
      </section>
    </template>
  </UDashboardPanel>
</template>
