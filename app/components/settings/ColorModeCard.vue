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
  <UCard>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-primary/10">
          <UIcon name="line-md:light-dark" class="size-5 text-primary" />
        </div>
        <div>
          <h3 class="text-base font-semibold">Color Mode</h3>
          <p class="text-sm text-muted">Choose your preferred color mode</p>
        </div>
      </div>
    </template>
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="option in colorModeOptions"
        :key="option.value"
        type="button"
        class="flex flex-col items-center justify-center gap-3 py-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-elevated/50 active:scale-95"
        :class="{
          'border-primary bg-primary/10 shadow-sm':
            selectedColorMode === option.value,
          'border-default': selectedColorMode !== option.value,
        }"
        @click="selectedColorMode = option.value"
      >
        <UIcon :name="option.icon" class="size-6" />
        <span class="text-sm font-medium">{{ option.label }}</span>
      </button>
    </div>
  </UCard>
</template>
