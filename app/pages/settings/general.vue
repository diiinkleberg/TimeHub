<!-- filepath: e:\Repos\TimeHub\app\pages\settings\general.vue -->
<script setup lang="ts">
import { THEME_COLORS, NEUTRAL_COLORS } from '~/stores/preferences'

const preferencesStore = usePreferencesStore()
const colorMode = useColorMode()


// Color mode options
const colorModeOptions = [
  { value: 'light', label: 'Light', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-lucide-moon' },
  { value: 'system', label: 'System', icon: 'i-lucide-monitor' }
]

const selectedColorMode = computed({
  get: () => colorMode.preference,
  set: (value) => {
    colorMode.preference = value
  }
})
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <UPageHeader
          title="General Settings"
          description="Customize your TimeHub experience"
        />

        <UPageBody>
          <div class="space-y-8">
            <!-- Appearance Section -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-sun-moon"
                    class="size-5"
                  />
                  <h3 class="text-lg font-semibold">
                    Appearance
                  </h3>
                </div>
              </template>

              <div class="space-y-6">
                <!-- Color Mode -->
                <UFormField
                  label="Color Mode"
                  description="Choose your preferred color scheme"
                >
                  <URadioGroup
                    v-model="selectedColorMode"
                    :options="colorModeOptions"
                    class="grid grid-cols-3 gap-3"
                  >
                    <template #default="{ option }">
                      <URadio
                        v-bind="option"
                        class="hidden peer"
                      />
                      <label
                        :for="option.value"
                        class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-default cursor-pointer transition-all hover:bg-elevated peer-checked:border-primary peer-checked:bg-primary/10"
                      >
                        <UIcon
                          :name="option.icon"
                          class="size-6"
                        />
                        <span class="text-sm font-medium">{{ option.label }}</span>
                      </label>
                    </template>
                  </URadioGroup>
                </UFormField>

                <USeparator />

                <!-- Primary Color -->
                <UFormField
                  label="Primary Color"
                  description="Choose your accent color"
                >
                  <div class="grid grid-cols-5 gap-3">
                    <button
                      v-for="color in THEME_COLORS"
                      :key="color"
                      type="button"
                      class="group relative flex items-center justify-center size-12 rounded-lg transition-all hover:scale-110"
                      :class="{
                        'ring-2 ring-offset-2 ring-offset-background': preferencesStore.primaryColor === color
                      }"
                      :style="{
                        backgroundColor: `var(--color-${color}-500)`,
                        '--tw-ring-color': `var(--color-${color}-500)`
                      }"
                      @click="preferencesStore.setPrimaryColor(color)"
                    >
                      <UIcon
                        v-if="preferencesStore.primaryColor === color"
                        name="i-lucide-check"
                        class="size-5 text-white"
                      />
                      <span class="sr-only">{{ color }}</span>

                      <!-- Tooltip -->
                      <UTooltip :text="color">
                        <span class="absolute inset-0" />
                      </UTooltip>
                    </button>
                  </div>
                </UFormField>

                <USeparator />

                <!-- Neutral Color -->
                <UFormField
                  label="Neutral Color"
                  description="Choose your base color palette"
                >
                  <div class="grid grid-cols-5 gap-3">
                    <button
                      v-for="color in NEUTRAL_COLORS"
                      :key="color"
                      type="button"
                      class="group relative flex items-center justify-center size-12 rounded-lg transition-all hover:scale-110"
                      :class="{
                        'ring-2 ring-offset-2 ring-offset-background': preferencesStore.neutralColor === color
                      }"
                      :style="{
                        backgroundColor: color === 'neutral' 
                          ? 'var(--color-old-neutral-500)' 
                          : `var(--color-${color}-500)`,
                        '--tw-ring-color': color === 'neutral'
                          ? 'var(--color-old-neutral-500)'
                          : `var(--color-${color}-500)`
                      }"
                      @click="preferencesStore.setNeutralColor(color)"
                    >
                      <UIcon
                        v-if="preferencesStore.neutralColor === color"
                        name="i-lucide-check"
                        class="size-5 text-white"
                      />
                      <span class="sr-only">{{ color }}</span>

                      <!-- Tooltip -->
                      <UTooltip :text="color">
                        <span class="absolute inset-0" />
                      </UTooltip>
                    </button>
                  </div>
                </UFormField>
              </div>
            </UCard>

            <!-- Preview Section -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-eye"
                    class="size-5"
                  />
                  <h3 class="text-lg font-semibold">
                    Preview
                  </h3>
                </div>
              </template>

              <div class="space-y-4">
                <div class="flex flex-wrap gap-3">
                  <UButton
                    color="primary"
                    label="Primary"
                  />
                  <UButton
                    color="primary"
                    variant="outline"
                    label="Outline"
                  />
                  <UButton
                    color="primary"
                    variant="soft"
                    label="Soft"
                  />
                  <UButton
                    color="primary"
                    variant="ghost"
                    label="Ghost"
                  />
                </div>

                <div class="flex flex-wrap gap-3">
                  <UBadge
                    color="primary"
                    label="Badge"
                  />
                  <UBadge
                    color="primary"
                    variant="outline"
                    label="Outline"
                  />
                  <UBadge
                    color="primary"
                    variant="soft"
                    label="Soft"
                  />
                </div>

                <UAlert
                  icon="i-lucide-info"
                  color="primary"
                  variant="soft"
                  title="Preview Alert"
                  description="This is how alerts will look with your selected colors"
                />
              </div>
            </UCard>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>