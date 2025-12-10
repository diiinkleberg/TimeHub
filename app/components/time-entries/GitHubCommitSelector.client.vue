<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import type { GitHubCommitSummary } from '#shared/schemas/github/commits'

const props = withDefaults(defineProps<{
  modelValue?: GitHubCommitSummary[]
  spentOn?: Date | null
  maxCommits?: number
}>(), {
  modelValue: () => [],
  spentOn: null,
  maxCommits: 5
})

const emit = defineEmits<{ 'update:modelValue': [value: GitHubCommitSummary[]] }>()
const selectedCommits = useVModel(props, 'modelValue', emit)
const toast = useToast()
const { isGithubLinked } = await useLinkedAccounts()
const { repos, repoLoading, repoError, commits, commitsLoading, commitsError, fetchRepos, fetchCommits } = useGitHub()

const selectedRepo = ref<typeof repoOptions.value[number] | undefined>(undefined)

const repoOptions = computed(() => repos.value.map(r => ({
  label: r.fullName,
  value: r.fullName,
  ...r,
  description: r.description || undefined
})))

const loadData = async () => {
  if (!isGithubLinked.value) return
  if (!repos.value.length) await fetchRepos()
  if (!selectedRepo.value && repoOptions.value.length > 0) selectedRepo.value = repoOptions.value[0]
}

watch(() => props.spentOn, async (date) => {
  if (date && selectedRepo.value) await fetchCommits(selectedRepo.value.value, date)
}, { immediate: true })

watch(selectedRepo, async (repo) => {
  if (repo && props.spentOn) await fetchCommits(repo.value, props.spentOn)
})

onMounted(loadData)

const toggleCommit = (commit: GitHubCommitSummary) => {
  const exists = selectedCommits.value.some(c => c.sha === commit.sha)
  if (exists) {
    selectedCommits.value = selectedCommits.value.filter(c => c.sha !== commit.sha)
  } else if (selectedCommits.value.length < props.maxCommits) {
    selectedCommits.value.push(commit)
  } else {
    toast.add({ title: 'Limit reached', description: `Max ${props.maxCommits} commits`, color: 'warning' })
  }
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <UFormField label="GitHub Commits" hint="Select commits to add context">
    <div v-if="!isGithubLinked" class="text-sm text-muted">
      <NuxtLink to="/settings" class="text-primary hover:underline">Connect GitHub</NuxtLink> to attach commits.
    </div>

    <div v-else class="space-y-3">
      <USelectMenu
        v-model="selectedRepo"
        :items="repoOptions"
        placeholder="Select repository"
        searchable
        :loading="repoLoading"
        class="w-full"
      >
      </USelectMenu>

      <div v-if="repoError || commitsError" class="text-xs text-red-500">
        {{ repoError || commitsError }}
      </div>

      <div v-if="commitsLoading" class="py-4 text-center text-sm text-muted">
        <UIcon name="i-lucide-loader-2" class="animate-spin mr-2" /> Loading...
      </div>

      <div v-else-if="commits.length" class="max-h-60 overflow-y-auto space-y-1 pr-1">
        <button
          v-for="commit in commits"
          :key="commit.sha"
          type="button"
          class="w-full flex items-center gap-3 p-2 rounded-md text-left text-sm border transition-colors"
          :class="selectedCommits.some(c => c.sha === commit.sha) ? 'bg-primary/10 border-primary/50' : 'bg-elevated border-transparent hover:border-default'"
          @click="toggleCommit(commit)"
        >
          <UIcon
            :name="selectedCommits.some(c => c.sha === commit.sha) ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
            class="shrink-0 size-4"
            :class="selectedCommits.some(c => c.sha === commit.sha) ? 'text-primary' : 'text-muted'"
          />
          <div class="min-w-0 flex-1">
            <div class="font-medium truncate">{{ commit.summary }}</div>
            <div class="text-xs text-muted flex gap-2">
              <span class="font-mono">{{ commit.shortSha }}</span>
              <span>{{ formatTime(commit.date) }}</span>
            </div>
          </div>
        </button>
      </div>

      <div v-else-if="props.spentOn" class="text-sm text-muted text-center py-2">
        No commits found for this date.
      </div>
    </div>
  </UFormField>
</template>
