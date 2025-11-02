<!-- pages/settings/integrations.vue -->
<script setup lang="ts">
</script>

<template>
  <UPage>
    <UPageBody>
      <UContainer>
        <UPageGrid :columns="2">
          <SettingsIntegrationsPlanioCard />
          <SettingsIntegrationsLinkGithubCard />
        </UPageGrid>
      </UContainer>
    </UPageBody>
  </UPage>
</template>