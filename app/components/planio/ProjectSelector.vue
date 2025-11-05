<script setup lang="ts">
import type { PlanioProject } from "#shared/schemas";

interface Props {
  modelValue?: PlanioProject | null;
}

interface Emits {
  (e: "update:modelValue", value: PlanioProject | null): void;
  (e: "projectSelected", project: PlanioProject): void;
}

const props = withDefaults(defineProps<Props>(), { modelValue: null });
const emit = defineEmits<Emits>();

const { data: projects, pending, error } = useFetch<PlanioProject[]>(
  "/api/planio/projects",
  {
    server: false,
    default: () => [],
  }
);

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

const handleSelection = (item: typeof projectItems.value[0] | undefined) => {
  if (item?.project) {
    emit("update:modelValue", item.project);
    emit("projectSelected", item.project);
  } else {
    emit("update:modelValue", null);
  }
};
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-highlighted">
      Select Project
    </label>

    <div
      v-if="pending"
      class="flex items-center gap-3 px-4 py-3 w-full h-12 bg-elevated border border-default rounded-lg"
    >
      <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-accent" />
      <span class="text-sm text-muted font-medium">Loading projects...</span>
    </div>

    <div
      v-else-if="error"
      class="text-sm text-red-400 bg-red-900/20 p-2 rounded border border-red-800"
    >
      Failed to load projects
    </div>

    <USelectMenu
      v-else
      v-model="selectedItem"
      :items="projectItems"
      placeholder="Search projects..."
      leading-icon="i-lucide-briefcase"
      searchable
      class="w-full h-10"
      :ui="{
        base: selectedItem ? 'bg-elevated border-primary text-primary font-bold' : 'bg-elevated border-default text-default',
        leadingIcon: selectedItem ? 'text-primary' : 'text-muted',
        placeholder: 'text-muted',
        content: 'bg-elevated border-default shadow-xl',
        viewport: 'p-1',
        item: 'text-default hover:bg-muted data-[highlighted]:bg-accented data-[highlighted]:text-highlighted rounded-md px-3 py-2',
        input: 'bg-elevated text-default placeholder:text-muted p-0.5'
      }"
      @update:model-value="handleSelection"
    >
      <template #item-label="{ item }">
        <div class="flex flex-col gap-0.5">
          <span class="font-medium text-default">{{ item.label }}</span>
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

    <!-- Debug info (remove in production) -->
    <div v-if="!pending && !error" class="text-xs text-muted">
      {{ projects.length }} project(s) loaded
    </div>
  </div>
</template>
