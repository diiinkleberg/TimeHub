import { computed, watch, type Ref } from 'vue'
import type { PlanioIssue } from '#shared/schemas/planio/issue'
import type { SimpleProject } from '#shared/types/planio'

interface UsePlanioIssueOptionsParams {
  projectId?: Ref<number | null | undefined>
  enabled?: Ref<boolean>
}

export function usePlanioProjectOptions() {
  const state = useAsyncData(
    'planio-project-options',
    () =>
      $fetch<SimpleProject[]>('/api/planio/projects'),
    {
      default: () => [],
      server: false
    }
  )

  const items = computed(() =>
    (state.data.value ?? []).map(project => ({
      label: project.name,
      value: project.id,
      project
    }))
  )

  return {
    ...state,
    items
  }
}

export function usePlanioIssueOptions(params: UsePlanioIssueOptionsParams = {}) {
  const enabled = params.enabled ?? computed(() => true)

  const query = computed(() => {
    const projectId = params.projectId?.value
    return projectId ? { project_id: projectId } : undefined
  })

  const state = useAsyncData(
    () => `planio-issues-${query.value?.project_id ?? 'assigned'}`,
    async () => {
      if (!enabled.value) {
        return [] as PlanioIssue[]
      }

      return await $fetch<PlanioIssue[]>('/api/planio/issues', {
        query: query.value
      })
    },
    {
      default: () => [],
      server: false,
      immediate: enabled.value
    }
  )

  watch([query, enabled], () => {
    if (enabled.value) {
      state.refresh()
    }
  })

  const items = computed(() =>
    (state.data.value ?? []).map(issue => ({
      label: issue.subject,
      value: issue.id,
      issue
    }))
  )

  return {
    ...state,
    items
  }
}
