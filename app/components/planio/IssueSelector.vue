<script setup lang="ts">
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import { whenever } from "@vueuse/core";

interface Props {
  modelValue?: PlanioIssue | null;
  projectId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  projectId: null,
});
const emit = defineEmits<{
  "update:modelValue": [value: PlanioIssue | null];
  "issueSelected": [issue: PlanioIssue];
}>();

// ✅ Fetch issues with project filter
const { data: issues, pending, error } = useFetch<PlanioIssue[]>
(
  "/api/planio/issues",
  {
    server: false,
    default: () => [],
    query: computed(() => ({
      ...(props.projectId && { project_id: props.projectId }),
    })),
    watch: [() => props.projectId],
  }
);

// ✅ Transform for select menu
const issueItems = computed(() =>
  issues.value.map((issue) => ({
    label: issue.subject,
    value: issue.id,
    description: `#${issue.id} • ${issue.project.name} • ${issue.status.name}`,
    issue,
  })),
);

// ✅ Find selected item
const selectedItem = computed(() =>
  props.modelValue
    ? issueItems.value.find((item) => item.value === props.modelValue!.id)
    : null
);

// ✅ Handle selection
const handleSelection = (item: typeof issueItems.value[0] | null) => {
  if (item?.issue) {
    emit("update:modelValue", item.issue);
    emit("issueSelected", item.issue);
  } else {
    emit("update:modelValue", null);
  }
};

// ✅ Clear selection when project changes
whenever(
  () => props.projectId,
  () => {
    if (props.modelValue && props.projectId !== props.modelValue.project.id) {
      emit("update:modelValue", null);
    }
  }
);
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-highlighted">
      Select Issue
    </label>

    <div
      v-if="!projectId && !pending && issues.length === 0"
      class="text-sm text-muted px-3 py-2 mb-2"
    >
      💡 Tip: Select a project to filter issues, or search all assigned issues
    </div>

    <div
      v-if="pending"
      class="flex items-center gap-3 px-4 py-3 w-full h-12 bg-elevated border border-default rounded-lg"
    >
      <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-accent" />
      <span class="text-sm text-muted font-medium">Loading issues...</span>
    </div>

    <div
      v-else-if="error"
      class="text-sm text-red-400 bg-red-900/20 p-2 rounded border border-red-800"
    >
      Failed to load issues
    </div>

    <USelectMenu
      v-else
      :model-value="selectedItem"
      :items="issueItems"
      :placeholder="projectId ? 'Search issues in project...' : 'Search all your issues...'"
      leading-icon="i-lucide-circle-dot"
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
          <p class="text-sm">
            {{ projectId ? "No issues found in this project" : "No open issues assigned to you" }}
          </p>
        </div>
      </template>
    </USelectMenu>
  </div>
</template>
