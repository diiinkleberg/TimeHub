<script setup lang="ts">
import { NEUTRAL_COLORS } from '~/stores/preferences'

const preferencesStore = usePreferencesStore()
const colorMode = useColorMode()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-primary/10">
          <UIcon
            name="oui:color"
            class="size-5 text-primary"
          />
        </div>
        <div>
          <h3 class="text-base font-semibold">
            Background Color
          </h3>
          <p class="text-sm text-muted">
            Choose your preferred accent color
          </p>
        </div>
      </div>
    </template>
    <UFormField label="Select Base Color">
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <button
          v-for="color in NEUTRAL_COLORS"
          :key="color"
          type="button"
          class="flex flex-col items-center py-5 rounded-xl border-2 transition-all cursor-pointer hover:bg-elevated hover:scale-105 active:scale-95"
          :class="{
            'border-primary bg-primary/10 shadow-md':
              preferencesStore.neutralColor === color,
            'border-default': preferencesStore.neutralColor !== color
          }"
          @click="preferencesStore.setNeutralColor(color)"
        >
          <span class="text-xs font-medium capitalize">{{ color }}</span>
        </button>
      </div>
    </UFormField>
  </UCard>
</template>
