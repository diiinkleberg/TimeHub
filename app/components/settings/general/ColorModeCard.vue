<script setup lang="ts">
const colorMode = useColorMode();

const colorModeOptions = [
  { value: "light", label: "Light", icon: "i-lucide-sun" },
  { value: "dark", label: "Dark", icon: "i-lucide-moon" },
  { value: "system", label: "System", icon: "i-lucide-monitor" },
];

const selectedColorMode = computed({
  get: () => colorMode.preference,
  set: (value) => {
    colorMode.preference = value;
  },
});
</script>

<template>
  <UPageCard
    icon="i-lucide-sun-moon"
    title="Appearance"
    description="Choose your preferred color scheme."
  >
    <UFormField label="Color Mode">
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="option in colorModeOptions"
          :key="option.value"
          type="button"
          class="flex flex-col items-center gap-3 py-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-elevated hover:scale-105 active:scale-95"
          :class="{
            'border-primary bg-primary/10 shadow-md':
              selectedColorMode === option.value,
            'border-default': selectedColorMode !== option.value,
          }"
          @click="selectedColorMode = option.value"
        >
          <UIcon :name="option.icon" class="size-6" />
          <span class="text-sm font-medium">{{ option.label }}</span>
        </button>
      </div>
    </UFormField>
  </UPageCard>
</template>
