<script setup lang="ts">
import type { PlanioProject } from "#shared/schemas/planio/project";
import { whenever } from "@vueuse/core";

interface Props {
  modelValue?: PlanioProject | null;
}

interface Emits {
  (e: "update:modelValue", value: PlanioProject | null): void;
  (e: "projectSelected", project: PlanioProject): void;
}

const props = withDefaults(defineProps<Props>(), { modelValue: null });
const emit = defineEmits<Emits>();

const {
  data: projects,
  pending,
  error,
  refresh,
} = useFetch<PlanioProject[]>("/api/planio/projects", {
  server: false,
  default: () => [],
  immediate: true,
});

const projectItems = computed(() =>
  projects.value.map((project) => ({
    label: project.name,
    value: project.id,
    description: project.identifier,
    project,
  }))
);

const selectedItem = computed(() =>
  props.modelValue
    ? projectItems.value.find((item) => item.value === props.modelValue!.id)
    : undefined
);

// ✅ VueUse: Handle selection changes
const handleSelection = (selectedItem?: { 
  label: string; 
  value: number; 
  project: PlanioProject 
}) => {
  const project = selectedItem?.project ?? null;
  emit("update:modelValue", project);
  
  // ✅ Only emit projectSelected if actually selected (not cleared)
  if (project) {
    emit("projectSelected", project);
  }
};
</script>

<template>
  <UFormField label="Project">
    <div v-if="pending" class="flex items-center gap-2 px-3 py-2 text-sm text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      <span>Loading projects...</span>
    </div>

    <div v-else-if="error" class="text-sm text-red-500">
      Failed to load projects
      <UButton
        size="xs"
        variant="ghost"
        label="Retry"
        @click="refresh()"
      />
    </div>

    <USelectMenu
      v-else
      :model-value="selectedItem"
      :items="projectItems"
      placeholder="Select a project..."
      leading-icon="i-lucide-folder"
      searchable
      clearable
      @update:model-value="handleSelection"
    >
      <template #item-label="{ item }">
        <div class="flex flex-col gap-0.5">
          <span class="font-medium">{{ item.label }}</span>
          <span class="text-xs text-muted">{{ item.description }}</span>
        </div>
      </template>
    </USelectMenu>
  </UFormField>
</template>