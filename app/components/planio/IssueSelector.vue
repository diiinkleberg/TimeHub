<script setup lang="ts">
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import { whenever } from "@vueuse/core";

interface Props {
  modelValue?: PlanioIssue | null;
  projectId?: number | null;
}

interface Emits {
  (e: "update:modelValue", value: PlanioIssue | null): void;
  (e: "issueSelected", issue: PlanioIssue): void;
}

const props = withDefaults(defineProps<Props>(), { 
  modelValue: null,
  projectId: null 
});
const emit = defineEmits<Emits>();

const {
  data: issues,
  pending,
  error,
  refresh,
} = useFetch<PlanioIssue[]>("/api/planio/issues", {
  server: false,
  default: () => [],
  query: computed(() => ({
    ...(props.projectId && { project_id: props.projectId }), // ✅ Only include if defined
  })),
  watch: [() => props.projectId],
  immediate: false, // ✅ Don't fetch until projectId is set
});

// ✅ VueUse: Auto-fetch when projectId changes
whenever(
  () => props.projectId,
  () => {
    refresh();
  },
  { immediate: true }
);

const issueItems = computed(() =>
  issues.value.map((issue) => ({
    label: issue.subject,
    value: issue.id,
    description: `${issue.project.name} • ${issue.status.name}`,
    issue,
  }))
);

const selectedItem = computed(() =>
  props.modelValue
    ? issueItems.value.find((item) => item.value === props.modelValue!.id)
    : undefined
);

const handleSelection = (selectedItem?: {
  label: string;
  value: number;
  issue: PlanioIssue;
}) => {
  const issue = selectedItem?.issue ?? null;
  emit("update:modelValue", issue);
  
  if (issue) {
    emit("issueSelected", issue);
  }
};

// ✅ Clear selection when project changes
watch(() => props.projectId, () => {
  if (props.modelValue) {
    emit("update:modelValue", null);
  }
});
</script>

<template>
  <UFormField label="Issue">
    <div v-if="!projectId" class="text-sm text-muted px-3 py-2">
      Select a project first to see issues
    </div>

    <div v-else-if="pending" class="flex items-center gap-2 px-3 py-2 text-sm text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      <span>Loading issues...</span>
    </div>

    <div v-else-if="error" class="text-sm text-red-500">
      Failed to load issues
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
      :items="issueItems"
      placeholder="Select an issue..."
      leading-icon="i-lucide-circle-dot"
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