<script setup lang="ts">
import { NEUTRAL_COLORS } from "~/stores/preferences";
const preferencesStore = usePreferencesStore();
</script>

<template>
  <UPageCard
    icon="i-lucide-palette"
    title="Neutral Color"
    description="Choose your base color"
  >
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
            'border-default': preferencesStore.neutralColor !== color,
          }"
          @click="preferencesStore.setNeutralColor(color)"
        >
          <span class="text-xs font-medium capitalize">{{ color }}</span>
        </button>
      </div>
    </UFormField>
  </UPageCard>
</template>
