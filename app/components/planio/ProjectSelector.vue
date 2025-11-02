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

// ✅ Get auth state
const { user } = await useAuth();

// ✅ Fetch projects
const {
  data: projects,
  pending,
  error,
  refresh,
} = useFetch<PlanioProject[]>("/api/planio/projects", {
  server: false,
  lazy: true,
  default: () => [],
  immediate: false,
});

// ✅ Wait for Nuxt hydration to complete, then fetch
const nuxtApp = useNuxtApp();

nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
  // This runs AFTER all hydration is complete
  if (user.value) {
    refresh();
  }
});

const projectItems = computed(() =>
  projects.value.map((project) => ({
    label: project.name,
    value: project.id,
    description: project.identifier,
    project,
  })),
);

const selectedItem = computed(() =>
  props.modelValue
    ? projectItems.value.find((item) => item.value === props.modelValue!.id)
    : undefined,
);

const handleSelection = (
  selectedItem?: {
    label: string;
    value: number;
    project: PlanioProject;
  } | null,
) => {
  if (!selectedItem) {
    emit("update:modelValue", null);
    return;
  }

  const project = selectedItem.project;
  emit("update:modelValue", project);
  emit("projectSelected", project);
};

// ✅ Auto-select if only one project
whenever(
  () => projects.value.length === 1 && !props.modelValue,
  () => {
    const project = projects.value[0];
    if (project) {
      emit("update:modelValue", project);
      emit("projectSelected", project);
    }
  },
);
</script>

<template>
  <UFormField label="Project">
    <div
      v-if="pending"
      class="flex items-center gap-2 px-3 py-2 text-sm text-muted"
    >
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      <span>Loading projects...</span>
    </div>

    <div v-else-if="error" class="text-sm text-red-500">
      Failed to load projects. Please check your connection and try again.
      <UButton size="xs" variant="ghost" label="Retry" @click="refresh()" />
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

      <template #empty>
        <div class="text-center py-6 text-muted">
          <UIcon name="i-lucide-inbox" class="size-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No projects found</p>
        </div>
      </template>
    </USelectMenu>
  </UFormField>
</template>
