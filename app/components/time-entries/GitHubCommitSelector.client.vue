<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import type {
  GitHubCommitSummary,
  GitHubCommitsResponse
} from '#shared/schemas/github/commits'

interface Props {
  modelValue?: GitHubCommitSummary[]
  spentOn?: Date | null
  maxCommits?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  spentOn: null,
  maxCommits: 5
})

const emit = defineEmits<{ 'update:modelValue': [value: GitHubCommitSummary[]] }>()

interface GitHubRepoOption {
  id: number
  name: string
  fullName: string
  owner?: string | null
  description?: string | null
  htmlUrl?: string | null
  private?: boolean
}

const selectedCommits = useVModel(props, 'modelValue', emit)
const selectedRepo = ref<GitHubRepoOption | null>(null)
const repos = ref<GitHubRepoOption[]>([])
const repoLoading = ref(false)
const repoError = ref<string | null>(null)

const commits = ref<GitHubCommitSummary[]>([])
const commitsLoading = ref(false)
const commitsError = ref<string | null>(null)

const toast = useToast()
const isClient = import.meta.client

const { isGithubLinked } = await useLinkedAccounts()

const formattedSpentOn = computed(() => {
  if (!props.spentOn) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full'
  }).format(props.spentOn)
})

const spentOnDateKey = computed(() => props.spentOn?.toISOString().slice(0, 10) ?? null)

const setRepo = (repo: GitHubRepoOption | null) => {
  selectedRepo.value = repo
}

const repoMenuItems = computed(() =>
  repos.value.map(repo => ({
    label: repo.fullName,
    value: repo.fullName,
    repo
  }))
)

const selectedRepoItem = computed(() =>
  repoMenuItems.value.find(item => item.value === selectedRepo.value?.fullName)
)

const hasRepoSelection = computed(() => Boolean(selectedRepo.value))

const repoMenuUi = computed(() => ({
  base: hasRepoSelection.value
    ? 'bg-elevated border-primary text-primary font-semibold'
    : 'bg-elevated border-default text-default',
  placeholder: 'text-muted'
}))

const handleRepoSelection = (value: unknown) => {
  if (value && typeof value === 'object' && 'repo' in value) {
    setRepo((value as { repo: GitHubRepoOption }).repo)
  } else {
    setRepo(null)
  }
}

const fetchRepos = async () => {
  if (!isClient || !isGithubLinked.value) {
    return
  }

  repoLoading.value = true
  repoError.value = null

  try {
    const response = await $fetch<GitHubRepoOption[]>('/api/github/repos')

    repos.value = response

    if (selectedRepo.value) {
      const updated = repos.value.find(repo => repo.fullName === selectedRepo.value?.fullName)
      if (updated) {
        setRepo(updated)
      } else if (repos.value.length) {
        setRepo(repos.value[0] ?? null)
      } else {
        setRepo(null)
      }
    } else if (repos.value.length) {
      setRepo(repos.value[0] ?? null)
    }
  } catch (error) {
    console.error('Failed to load GitHub repos', error)
    repoError.value = error instanceof Error ? error.message : 'Failed to load repositories'
  } finally {
    repoLoading.value = false
  }
}

const toDayRange = (date: Date) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

const fetchCommits = async () => {
  if (!isClient || !isGithubLinked.value) {
    return
  }

  if (!selectedRepo.value) {
    commits.value = []
    return
  }

  if (!props.spentOn) {
    commits.value = []
    return
  }

  commitsLoading.value = true
  commitsError.value = null

  try {
    const { start, end } = toDayRange(props.spentOn)

    const response = await $fetch<GitHubCommitsResponse>('/api/github/commits', {
      query: {
        repo: selectedRepo.value.fullName,
        since: start.toISOString(),
        until: end.toISOString(),
        date: spentOnDateKey.value ?? undefined,
        limit: 100
      }
    })

    commits.value = response.data
  } catch (error) {
    console.error('Failed to load commits', error)
    commitsError.value = error instanceof Error ? error.message : 'Failed to load commits'
    commits.value = []
  } finally {
    commitsLoading.value = false
  }
}

const isSelected = (sha: string) => selectedCommits.value.some(commit => commit.sha === sha)

const removeCommit = (sha: string) => {
  selectedCommits.value = selectedCommits.value.filter(commit => commit.sha !== sha)
}

const toggleCommit = (commit: GitHubCommitSummary) => {
  if (isSelected(commit.sha)) {
    removeCommit(commit.sha)
    return
  }

  if (selectedCommits.value.length >= props.maxCommits) {
    toast.add({
      title: 'Selection limit',
      description: `You can attach up to ${props.maxCommits} commits`,
      color: 'warning'
    })
    return
  }

  selectedCommits.value = [...selectedCommits.value, commit]
}

const clearSelectionIfOutsideRange = () => {
  if (!spentOnDateKey.value) {
    selectedCommits.value = []
    return
  }

  const dayKey = spentOnDateKey.value
  selectedCommits.value = dayKey
    ? selectedCommits.value.filter(commit => commit.date.startsWith(dayKey))
    : []
}

watch(spentOnDateKey, () => {
  clearSelectionIfOutsideRange()
  fetchCommits()
})

watch(
  () => selectedRepo.value?.fullName,
  () => {
    fetchCommits()
  }
)

watch(
  () => isGithubLinked.value,
  linked => {
    if (linked) {
      fetchRepos()
    } else {
      selectedCommits.value = []
      setRepo(null)
      repos.value = []
    }
  }
)

onMounted(() => {
  if (isClient && isGithubLinked.value) {
    fetchRepos()
  }
})

const formatCommitDate = (value: string) => {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

</script>

<template>
  <UFormField label="GitHub commits" hint="Attach commits from the selected day to give the AI more context">
    <template v-if="!isGithubLinked">
      <div class="rounded-lg border border-dashed border-default bg-muted/20 px-4 py-3 text-sm text-muted">
        Connect your GitHub account from the
        <NuxtLink
          to="/settings"
          class="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Settings
        </NuxtLink>
        page to attach commits.
      </div>
    </template>

    <template v-else>
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-xs font-semibold text-muted">Repository</label>
          <USelectMenu
            :model-value="selectedRepoItem"
            :items="repoMenuItems"
            placeholder="Select repository"
            searchable
            :loading="repoLoading"
            class="w-full"
            :ui="repoMenuUi"
            @update:model-value="handleRepoSelection"
          >
            <template #item-label="{ item }">
              <div
                v-if="item && 'repo' in item"
                class="flex min-w-0 flex-col"
              >
                <span class="truncate text-sm font-medium text-default">{{ (item as any).repo.fullName }}</span>
                <span class="text-xs text-muted">
                  {{ (item as any).repo.description || 'No description provided' }}
                </span>
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
                  No repositories found
                </p>
              </div>
            </template>
          </USelectMenu>

          <UAlert
            v-if="repoError"
            icon="i-lucide-alert-circle"
            color="error"
            variant="soft"
            :title="repoError"
          />

          <p class="text-xs text-muted">
            {{ formattedSpentOn ? `Showing commits for ${formattedSpentOn}` : 'Select a date to load commits' }}
          </p>
        </div>

        <div v-if="!props.spentOn" class="rounded-lg border border-dashed border-default p-4 text-sm text-muted">
          Pick a date above to load commits.
        </div>

        <template v-else>
          <div v-if="commitsLoading" class="flex items-center gap-2 text-muted">
            <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
            <span class="text-sm">Loading commits…</span>
          </div>

          <UAlert
            v-else-if="commitsError"
            icon="i-lucide-alert-triangle"
            color="error"
            variant="soft"
            :title="commitsError"
          />

          <div
            v-else-if="!commits.length"
            class="rounded-lg border border-dashed border-default p-4 text-sm text-muted"
          >
            No commits found for this day.
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-center justify-between text-xs text-muted">
              <span>{{ commits.length }} commits available</span>
              <span>{{ selectedCommits.length }}/{{ maxCommits }} selected</span>
            </div>

            <div class="space-y-2 max-h-80 overflow-auto pr-1">
              <button
                v-for="commit in commits"
                :key="commit.sha"
                type="button"
                class="w-full rounded-lg border bg-elevated p-3 text-left transition-colors"
                :class="isSelected(commit.sha)
                  ? 'border-primary/70 bg-primary/5 shadow-sm'
                  : 'border-default hover:border-primary/40'
                "
                @click="toggleCommit(commit)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-1">
                    <p class="text-xs font-mono text-muted">{{ commit.shortSha }} · {{ commit.repo }}</p>
                    <p class="text-sm font-semibold text-highlighted">
                      {{ commit.summary }}
                    </p>
                    <p class="text-xs text-subtle">
                      {{ formatCommitDate(commit.date) }}
                    </p>
                  </div>

                  <UIcon
                    :name="isSelected(commit.sha) ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                    :class="isSelected(commit.sha)
                      ? 'text-primary'
                      : 'text-muted'
                    "
                    class="size-5 shrink-0"
                  />
                </div>

                <p class="mt-2 text-xs text-muted line-clamp-2">
                  {{ commit.message }}
                </p>
              </button>
            </div>
          </div>
        </template>

        <div
          v-if="selectedCommits.length"
          class="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2"
        >
          <div class="flex items-center justify-between text-xs text-primary">
            <span>Selected commits</span>
            <span>{{ selectedCommits.length }}/{{ maxCommits }}</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <div
              v-for="commit in selectedCommits"
              :key="commit.sha"
              class="flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              <span class="font-mono">{{ commit.shortSha }}</span>
              <span class="max-w-48 truncate">{{ commit.summary }}</span>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="primary"
                variant="ghost"
                class="h-5 w-5 p-0"
                aria-label="Remove commit"
                @click.stop="removeCommit(commit.sha)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UFormField>
</template>
