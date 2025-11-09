<script setup lang="ts">
import type { SimpleProject } from '#shared/types/planio'

interface Props {
  modelValue?: SimpleProject | null
}

interface Emits {
  'update:modelValue': [value: SimpleProject | null]
}

const props = withDefaults(defineProps<Props>(), { modelValue: null })
const emit = defineEmits<Emits>()

const {
  data: projects,
  pending,
  error,
  refresh
} = useFetch<SimpleProject[]>('/api/planio/projects', {
  server: false,
  default: () => [],
  immediate: false
})

const projectItems = computed(() =>
  projects.value.map(project => ({
    label: project.name,
    value: project.id,
    project
  }))
)

const selectedItem = computed(() =>
  props.modelValue
    ? projectItems.value.find(item => item.value === props.modelValue!.id)
    : undefined
)

const isProjectOption = (option: unknown): option is (typeof projectItems.value)[number] =>
  typeof option === 'object' && option !== null && 'project' in option

const handleSelection = (value: unknown) => {
  const item = isProjectOption(value) ? value : undefined
  emit('update:modelValue', item?.project ?? null)
}

onMounted(() => {
  refresh()
})
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-highlighted">
      Select Project
    </label>

    <ClientOnly>
      <div
        v-if="pending"
        class="flex items-center gap-3 px-4 py-3 w-full h-12 bg-elevated border border-default rounded-lg"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-4 h-4 animate-spin text-accent"
        />
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
        :model-value="selectedItem"
        :items="projectItems"
        placeholder="Select project..."
        leading-icon="i-lucide-folder"
        searchable
        :filter-fields="['label', 'value']"
        class="w-full h-10"
        :ui="{
          base: selectedItem
            ? 'bg-elevated border-primary text-primary font-bold'
            : 'bg-elevated border-default text-default',
          leadingIcon: selectedItem ? 'text-primary' : 'text-muted',
          placeholder: 'text-muted'
        }"
        @update:model-value="handleSelection"
      >
        <template #item-label="{ item }">
          <div
            v-if="item && typeof item === 'object' && 'project' in item"
            class="flex min-w-0 items-center justify-between gap-3"
          >
            <span class="truncate text-sm font-medium text-default">
              {{ (item as any).project.name }}
            </span>
            <span class="text-xs font-mono text-muted">#{{ (item as any).project.id }}</span>
          </div>
          <span
            v-else
            class="text-sm text-muted"
          >{{ item }}</span>
        </template>

        <template #empty>
          <div class="text-center py-6 text-muted">
            <UIcon
              name="i-lucide-folder-x"
              class="size-8 mx-auto mb-2 opacity-50"
            />
            <p class="text-sm">
              No projects available
            </p>
          </div>
        </template>
      </USelectMenu>

      <template #fallback>
        <!-- ✅ Server-rendered placeholder -->
        <div
          class="flex items-center gap-3 px-4 py-3 w-full h-10 bg-elevated border border-default rounded-lg"
        >
          <UIcon
            name="i-lucide-folder"
            class="w-4 h-4 text-muted"
          />
          <span class="text-sm text-muted">Loading projects...</span>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
