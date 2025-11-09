<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { THEME_COLORS } from '~/stores/preferences'

const preferencesStore = usePreferencesStore()
const { primaryColor } = storeToRefs(preferencesStore)

type ThemeColor = (typeof THEME_COLORS)[number]

const setPrimaryColor = (color: ThemeColor) => {
  if (primaryColor.value === color) {
    return
  }

  preferencesStore.setPrimaryColor(color)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-primary/10">
          <UIcon
            name="i-lucide-palette"
            class="size-5 text-primary"
          />
        </div>
        <div>
          <h3 class="text-base font-semibold">
            Primary Color
          </h3>
          <p class="text-sm text-muted">
            Choose your preferred accent color
          </p>
        </div>
      </div>
    </template>
    <UFormField label="Select Color">
      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
        <button
          v-for="color in THEME_COLORS"
          :key="color"
          type="button"
          class="flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-elevated hover:scale-105 active:scale-95"
          :class="{
            'border-primary bg-primary/10 shadow-md': primaryColor === color,
            'border-default': primaryColor !== color
          }"
          @click="setPrimaryColor(color)"
        >
          <span class="text-xs font-medium capitalize">{{ color }}</span>
        </button>
      </div>
    </UFormField>
  </UCard>
</template>
