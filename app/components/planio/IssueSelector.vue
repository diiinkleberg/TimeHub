<script setup lang="ts">
import type { PlanioIssue } from "#shared/schemas/planio/issue";

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
  projectId: null,
});
const emit = defineEmits<Emits>();

// ✅ Get auth state
const { user } = await useAuth();

// ✅ Fetch issues
const {
  data: issues,
  pending,
  error,
  refresh,
} = useFetch<PlanioIssue[]>("/api/planio/issues", {
  server: false,
  lazy: true,
  default: () => [],
  query: computed(() => ({
    ...(props.projectId && { project_id: props.projectId }),
  })),
  watch: [() => props.projectId],
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

const issueItems = computed(() =>
  issues.value.map((issue) => ({
    label: issue.subject,
    value: issue.id,
    description: `#${issue.id} • ${issue.project.name} • ${issue.status.name}`,
    issue,
  })),
);

const selectedItem = computed(() =>
  props.modelValue
    ? issueItems.value.find((item) => item.value === props.modelValue!.id)
    : undefined,
);

const handleSelection = (
  selectedItem?: {
    label: string;
    value: number;
    issue: PlanioIssue;
  } | null,
) => {
  if (!selectedItem) {
    emit("update:modelValue", null);
    return;
  }

  const issue = selectedItem.issue;
  emit("update:modelValue", issue);
  emit("issueSelected", issue);
};

// ✅ Clear selection when project filter changes
watch(
  () => props.projectId,
  () => {
    if (props.modelValue && props.projectId) {
      if (props.modelValue.project.id !== props.projectId) {
        emit("update:modelValue", null);
      }
    }
  },
);
</script>

<template>
  <UFormField label="Issue">
    <div
      v-if="!projectId && !pending && issues.length === 0"
      class="text-sm text-muted px-3 py-2 mb-2"
    >
      💡 Tip: Select a project to filter issues, or search all assigned issues
    </div>

    <div
      v-if="pending"
      class="flex items-center gap-2 px-3 py-2 text-sm text-muted"
    >
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      <span>Loading issues...</span>
    </div>

    <div v-else-if="error" class="text-sm text-red-500">
      Failed to load issues
      <UButton size="xs" variant="ghost" label="Retry" @click="refresh()" />
    </div>

    <USelectMenu
      v-else
      :model-value="selectedItem"
      :items="issueItems"
      :placeholder="
        projectId ? 'Search issues in project...' : 'Search all your issues...'
      "
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

      <template #empty>
        <div class="text-center py-6 text-muted">
          <UIcon name="i-lucide-inbox" class="size-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">
            {{
              projectId
                ? "No issues found in this project"
                : "No open issues assigned to you"
            }}
          </p>
        </div>
      </template>
    </USelectMenu>
  </UFormField>
</template>
