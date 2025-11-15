<script setup lang="ts">
import type { PlanioIssue } from '#shared/schemas/planio/issue'
import { whenever } from '@vueuse/core'

interface Props {
  modelValue?: PlanioIssue | null
  projectId?: number | null
  skipReload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  projectId: null,
  skipReload: false
})
const emit = defineEmits<{
  'update:modelValue': [value: PlanioIssue | null]
  'issueSelected': [issue: PlanioIssue]
}>()

const enabled = computed(() => !props.skipReload)

const {
  data: issues,
  pending,
  error,
  refresh
} = useFetch<PlanioIssue[]>('/api/planio/issues', {
  server: false,
  default: () => [],
  query: computed(() => ({
    ...(props.projectId && { project_id: props.projectId })
  })),
  immediate: false
})

watch(
  () => props.projectId,
  async () => {
    if (enabled.value) {
      await refresh()
    }
  }
)

onMounted(() => {
  if (enabled.value) {
    refresh()
  }
})

const issueItems = computed(() =>
  issues.value.map(issue => ({
    label: issue.subject,
    value: issue.id,
    id: issue.id.toString(),
    subject: issue.subject,
    description: issue.description || '',
    priority: issue.priority?.name || '',
    status: issue.status.name,
    project: issue.project.name,
    spent_hours: issue.spent_hours || 0,
    estimated_hours: issue.estimated_hours || 0,
    issue
  }))
)

const selectedItem = computed(() =>
  props.modelValue
    ? issueItems.value.find(item => item.value === props.modelValue!.id)
    : undefined
)

const hasSelection = computed(() => Boolean(selectedItem.value))

const selectMenuUi = computed(() => ({
  base: hasSelection.value
    ? 'bg-elevated border-primary text-primary font-semibold'
    : 'bg-elevated border-default text-default',
  leadingIcon: hasSelection.value ? 'text-primary' : 'text-muted',
  placeholder: 'text-muted'
}))

const handleSelection = (value: unknown) => {
  const item
    = value && typeof value === 'object' && 'issue' in value
      ? (value as (typeof issueItems.value)[number])
      : undefined

  if (item?.issue) {
    emit('update:modelValue', item.issue)
    emit('issueSelected', item.issue)
  } else {
    emit('update:modelValue', null)
  }
}

// Clear selection when project changes
whenever(
  () => props.projectId,
  () => {
    if (props.modelValue && props.projectId !== props.modelValue.project.id) {
      emit('update:modelValue', null)
    }
  }
)

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    Low: 'text-blue-400',
    Normal: 'text-default',
    High: 'text-orange-400',
    Urgent: 'text-red-400',
    Immediate: 'text-red-600'
  }
  return colors[priority] || 'text-default'
}

const config = useRuntimeConfig()
const planioBaseUrl = config.public.planioBaseUrl

const getIssueUrl = (issueId: number) => `${planioBaseUrl}/issues/${issueId}`
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-highlighted">
        Select Issue
      </label>

      <!-- Link to issue in Planio -->
      <NuxtLink
        v-if="props.modelValue"
        :to="getIssueUrl(props.modelValue.id)"
        target="_blank"
        class="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <UIcon
          name="i-lucide-external-link"
          class="size-3.5"
        />
        <span>Open in Planio</span>
      </NuxtLink>
    </div>

    <ClientOnly>
      <!-- All your v-if/v-else-if/v-else logic here -->
      <div
        v-if="pending"
        class="flex items-center gap-3 px-4 py-3 w-full h-12 bg-elevated border border-default rounded-lg"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-4 h-4 animate-spin text-accent"
        />
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
        :placeholder="
          props.projectId
            ? 'Search issues in project...'
            : 'Search all your issues...'
        "
        leading-icon="i-lucide-circle-dot"
        searchable
        :filter-fields="['id', 'subject', 'description', 'priority', 'project']"
        class="w-full h-10"
        :ui="selectMenuUi"
        @update:model-value="handleSelection"
      >
        <!-- Dropdown item display -->
        <template #item-label="{ item }">
          <div
            v-if="item && typeof item === 'object' && 'subject' in item"
            class="flex min-w-0 flex-col gap-1"
          >
            <!-- Header: ID + Title -->
            <div class="flex items-center gap-2">
              <span class="shrink-0 text-xs font-mono text-muted">#{{ (item as any).id }}</span>
              <span class="flex-1 truncate text-sm font-medium text-default">
                {{ (item as any).subject }}
              </span>
            </div>

            <!-- Footer: Project + Status + Priority -->
            <div class="flex items-center gap-2 text-xs">
              <span class="text-muted">{{ (item as any).project }}</span>
              <span class="text-muted">•</span>
              <span class="text-muted">{{ (item as any).status }}</span>
              <span
                v-if="(item as any).priority"
                class="text-muted"
              >•</span>
              <span
                v-if="(item as any).priority"
                :class="getPriorityColor((item as any).priority)"
                class="font-medium"
              >
                {{ (item as any).priority }}
              </span>
            </div>
          </div>
          <span
            v-else
            class="text-sm text-muted"
          >{{ item }}</span>
        </template>

        <template #empty>
          <div class="py-6 text-center text-muted">
            <UIcon
              name="i-lucide-search-x"
              class="mx-auto mb-2 size-8 opacity-50"
            />
            <p class="text-sm">
              No issues match your search
            </p>
          </div>
        </template>
      </USelectMenu>

      <template #fallback>
        <!-- Server-rendered placeholder -->
        <div
          class="flex items-center gap-3 px-4 py-3 w-full h-10 bg-elevated border border-default rounded-lg"
        >
          <UIcon
            name="i-lucide-circle-dot"
            class="w-4 h-4 text-muted"
          />
          <span class="text-sm text-muted">Loading issues...</span>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
