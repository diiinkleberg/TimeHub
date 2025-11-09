<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { useLinkedAccounts } from '~/composables/useLinkedAccounts'

interface Props {
  modelValue: string
  spentOn?: Date // The date for which we're logging time
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'enhancing', value: boolean): void
}

interface GitHubRepo {
  id: number
  name: string
  fullName: string
  owner?: string
  htmlUrl: string
  description?: string | null
  defaultBranch?: string | null
  private: boolean
}

interface GitHubCommit {
  sha: string
  message: string
  date: string
  url: string
  repo: string
}

interface GitHubCommitOption extends GitHubCommit {
  label: string
  value: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { isGithubLinked } = await useLinkedAccounts()

const githubRepos = ref<GitHubRepo[]>([])
const isLoadingRepos = ref(false)
const selectedRepo = ref<string | null>(null)

const rawInput = ref(props.modelValue)
const enhancedDescription = ref('')
const isEnhancing = ref(false)
const showEnhanced = ref(false)
const tokensUsed = ref(0)
const toast = useToast()

const { isSupported: isClipboardSupported } = useClipboard()
const isReadingClipboard = ref(false)

const isLoadingGitHub = ref(false)

// Fetch GitHub commits for the selected date
const githubCommits = ref<GitHubCommit[]>([])

const selectedCommits = ref<GitHubCommitOption[]>([])

// Transform commits into SelectMenu items
const commitItems = computed(() =>
  githubCommits.value.map(commit => ({
    label: `${commit.message} (${commit.repo})`,
    value: commit.sha,
    sha: commit.sha,
    message: commit.message,
    date: commit.date,
    url: commit.url,
    repo: commit.repo
  }))
)

const repoOptions = computed(() =>
  githubRepos.value.map(repo => ({
    label: repo.fullName,
    value: repo.fullName,
    description: repo.description ?? ''
  }))
)

const hasSelectedDate = computed(() => Boolean(props.spentOn))

async function fetchGitHubRepos(search?: string) {
  if (!isGithubLinked.value) return

  isLoadingRepos.value = true
  try {
    const repos = await $fetch<GitHubRepo[]>('/api/github/repos', {
      query: {
        limit: 50,
        ...(search ? { search } : {})
      }
    })

    githubRepos.value = repos

    if (!repos.length) {
      selectedRepo.value = null
      return
    }

    const [firstRepo] = repos
    if (!firstRepo) {
      selectedRepo.value = null
      return
    }

    if (!selectedRepo.value) {
      selectedRepo.value = firstRepo.fullName
      return
    }

    const hasSelection = repos.some(repo => repo.fullName === selectedRepo.value)
    if (!hasSelection) {
      selectedRepo.value = firstRepo.fullName
    }
  } catch (error) {
    console.error('Failed to fetch GitHub repositories:', error)
    githubRepos.value = []
    selectedRepo.value = null
  } finally {
    isLoadingRepos.value = false
  }
}

async function fetchGitHubCommits() {
  if (!props.spentOn || !isGithubLinked.value || !selectedRepo.value) {
    githubCommits.value = []
    selectedCommits.value = []
    return
  }

  isLoadingGitHub.value = true
  try {
    const selectedDate = new Date(props.spentOn)
    const since = new Date(selectedDate)
    since.setDate(since.getDate() - 1)
    since.setHours(0, 0, 0, 0)

    const until = new Date(selectedDate)
    until.setDate(until.getDate() + 1)
    until.setHours(23, 59, 59, 999)

    const commits = await $fetch<GitHubCommit[]>('/api/github/commits', {
      query: {
        repo: selectedRepo.value,
        since: since.toISOString(),
        until: until.toISOString(),
        limit: 20
      }
    })

    githubCommits.value = commits
    selectedCommits.value = []
  } catch (error) {
    console.error('Failed to fetch GitHub commits:', error)
    githubCommits.value = []
    selectedCommits.value = []
  } finally {
    isLoadingGitHub.value = false
  }
}

watch(
  isGithubLinked,
  (linked) => {
    if (linked) {
      fetchGitHubRepos()
      if (hasSelectedDate.value && selectedRepo.value) {
        fetchGitHubCommits()
      }
    } else {
      githubRepos.value = []
      selectedRepo.value = null
      githubCommits.value = []
      selectedCommits.value = []
    }
  },
  { immediate: true }
)

watch(selectedRepo, () => {
  if (!selectedRepo.value) {
    githubCommits.value = []
    selectedCommits.value = []
    return
  }

  if (isGithubLinked.value && hasSelectedDate.value) {
    fetchGitHubCommits()
  }
})

watch(
  () => props.spentOn,
  () => {
    if (isGithubLinked.value && selectedRepo.value && props.spentOn) {
      fetchGitHubCommits()
    } else {
      githubCommits.value = []
      selectedCommits.value = []
    }
  }
)

// Sync with parent
watch(
  () => props.modelValue,
  (newValue) => {
    rawInput.value = newValue
  }
)

// Emit enhancing state to parent
watch(isEnhancing, (newValue) => {
  emit('enhancing', newValue)
})

const hasRawInput = computed(() => rawInput.value.trim().length > 0)

const pasteFromClipboard = async () => {
  if (!isClipboardSupported.value) {
    toast.add({
      title: 'Clipboard unavailable',
      description: 'Your browser does not allow clipboard access here.',
      color: 'warning'
    })
    return
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
    toast.add({
      title: 'Clipboard unavailable',
      description: 'Clipboard access is unavailable in this environment.',
      color: 'warning'
    })
    return
  }

  isReadingClipboard.value = true
  try {
    const clipboardText = await navigator.clipboard.readText()
    if (!clipboardText) {
      toast.add({
        title: 'Clipboard empty',
        description: 'There was no text to paste from your clipboard.',
        color: 'neutral'
      })
      return
    }

    updateRawInput(clipboardText)
    toast.add({
      title: 'Pasted from clipboard',
      description: 'Clipboard contents were added to your description.',
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to read from clipboard:', error)
    toast.add({
      title: 'Clipboard error',
      description: 'Could not access your clipboard. Please paste manually.',
      color: 'error'
    })
  } finally {
    isReadingClipboard.value = false
  }
}

const enhanceDescription = async () => {
  isEnhancing.value = true
  showEnhanced.value = false

  try {
    // Prepare context with selected GitHub commits
    let contextDescription = rawInput.value

    if (selectedCommits.value.length > 0) {
      const commitsContext = selectedCommits.value
        .map(c => `- [${c.repo}] ${c.message} (${c.sha}) - ${c.url}`)
        .join('\n')
      contextDescription = `${rawInput.value}\n\nRelated GitHub Commits:\n${commitsContext}`
    }

    const response = await $fetch<{
      enhanced: string
      original: string
      usedToken: number
    }>('/api/ai/enhance-description', {
      method: 'POST',
      body: {
        description: contextDescription
      }
    })

    enhancedDescription.value = response.enhanced
    tokensUsed.value = response.usedToken
    showEnhanced.value = true

    toast.add({
      title: 'Description enhanced',
      description: `AI has improved your work description${selectedCommits.value.length > 0 ? ` with ${selectedCommits.value.length} commit${selectedCommits.value.length !== 1 ? 's' : ''}` : ''} (${response.usedToken} tokens used)`,
      color: 'success'
    })
  } catch (error) {
    console.error('Enhancement error:', error)
    toast.add({
      title: 'Enhancement failed',
      description: 'Could not enhance description. Please try again.',
      color: 'error'
    })
  } finally {
    isEnhancing.value = false
  }
}

const useEnhanced = () => {
  emit('update:modelValue', enhancedDescription.value)
  rawInput.value = enhancedDescription.value
  showEnhanced.value = false

  toast.add({
    title: 'Description updated',
    description: 'Enhanced description applied',
    color: 'success'
  })
}

const discardEnhanced = () => {
  showEnhanced.value = false
}

const updateRawInput = (value: string) => {
  rawInput.value = value
  emit('update:modelValue', value)
}

// No-op hook retained for potential future expansions
</script>

<template>
  <div class="space-y-5">
    <div
      v-if="isGithubLinked"
      class="max-w-2xl space-y-4"
    >
      <UFormField
        label="GitHub Repository"
        size="sm"
      >
        <template #hint>
          <span class="text-xs text-muted">
            {{
              isLoadingRepos
                ? 'Loading repositories...'
                : githubRepos.length > 0
                  ? 'Choose where the commits should come from'
                  : 'No repositories were found for your account'
            }}
          </span>
        </template>

        <USelectMenu
          v-model="selectedRepo"
          :options="repoOptions"
          searchable
          option-attribute="label"
          value-attribute="value"
          size="sm"
          :placeholder="
            isLoadingRepos
              ? 'Loading repositories...'
              : githubRepos.length === 0
                ? 'No repositories available'
                : 'Select a repository'
          "
          :disabled="isEnhancing || isLoadingRepos || githubRepos.length === 0"
          :loading="isLoadingRepos"
          class="w-full text-sm"
        />
      </UFormField>

      <UFormField
        label="GitHub Commits"
        size="sm"
      >
        <template #hint>
          <span class="text-xs text-muted">
            {{
              !hasSelectedDate
                ? 'Pick a date to filter commits'
                : !selectedRepo
                  ? 'Select a repository to view commits'
                  : isLoadingGitHub
                    ? 'Fetching recent commits...'
                    : githubCommits.length > 0
                      ? `${githubCommits.length} commit${githubCommits.length === 1 ? '' : 's'} found for this date`
                      : 'No commits were found for this date'
            }}
          </span>
        </template>

        <USelectMenu
          v-model="selectedCommits"
          :options="commitItems"
          multiple
          searchable
          option-attribute="label"
          size="sm"
          return-object
          :placeholder="
            !selectedRepo
              ? 'Select a repository first'
              : !hasSelectedDate
                ? 'Pick a date to load commits'
                : isLoadingGitHub
                  ? 'Loading commits...'
                  : githubCommits.length === 0
                    ? 'No commits available'
                    : selectedCommits.length === 0
                      ? 'Select commits to include...'
                      : `${selectedCommits.length} commit${selectedCommits.length !== 1 ? 's' : ''} selected`
          "
          :disabled="
            isEnhancing
              || isLoadingGitHub
              || !selectedRepo
              || !hasSelectedDate
          "
          :loading="isLoadingGitHub"
          class="w-full text-sm"
        />
      </UFormField>
    </div>

    <!-- GitHub Not Linked Alert - Compact version -->
    <UAlert
      v-else
      icon="i-simple-icons-github"
      color="neutral"
      variant="soft"
      title="Link GitHub to include commits"
      class="max-w-2xl"
      :actions="[
        {
          label: 'Go to Settings',
          icon: 'i-lucide-settings',
          to: '/settings'
        }
      ]"
    />

    <!-- Work Description Input -->
    <UFormField
      label="Work Description"
      required
      class="space-y-3"
    >
      <div class="relative">
        <UTextarea
          size="lg"
          autoresize
          color="neutral"
          :model-value="rawInput"
          :rows="5"
          :disabled="isEnhancing"
          class="w-full"
          placeholder="Describe what you worked on... (notes, bullet points, or paste any text)"
          :aria-busy="isEnhancing"
          @update:model-value="updateRawInput"
        />

        <Transition
          enter-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isEnhancing"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-5 animate-spin text-primary"
            />
            <span class="text-sm font-medium text-highlighted">Enhancing description…</span>
          </div>
        </Transition>
      </div>

      <template #hint>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Character count -->
          <span
            class="text-sm font-medium"
            :class="rawInput.length > 0 ? 'text-primary' : 'text-muted'"
          >
            {{ rawInput.length }} characters
          </span>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="!isClipboardSupported"
              class="text-xs text-muted"
            >
              Clipboard access not supported in this browser
            </span>

            <UButton
              v-else
              icon="i-lucide-clipboard-paste"
              label="Paste"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="isReadingClipboard"
              :disabled="isEnhancing || isReadingClipboard"
              @click="pasteFromClipboard"
            />

            <!-- AI Enhancement Button -->
            <UButton
              :icon="isEnhancing ? 'i-lucide-loader-2' : 'i-lucide-sparkles'"
              :label="isEnhancing ? 'Enhancing…' : 'Enhance with AI'"
              color="primary"
              variant="solid"
              size="sm"
              :disabled="!hasRawInput || isEnhancing"
              @click="enhanceDescription"
            >
              <template
                v-if="isEnhancing"
                #leading
              >
                <UIcon
                  name="i-lucide-loader-2"
                  class="animate-spin"
                />
              </template>
            </UButton>
          </div>
        </div>
      </template>
    </UFormField>

    <!-- Enhanced Description Preview -->
    <UCard
      v-if="showEnhanced"
      class="border-2 border-primary/20 bg-primary/5"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-sparkles"
              class="size-4 text-primary"
            />
            <h4 class="text-sm font-semibold text-highlighted">
              AI Enhanced Result
            </h4>
          </div>
          <UBadge
            v-if="tokensUsed > 0"
            variant="soft"
            color="primary"
            size="sm"
          >
            {{ tokensUsed }} tokens
          </UBadge>
        </div>
      </template>

      <div class="prose prose-sm max-w-none">
        <p class="whitespace-pre-wrap text-sm leading-relaxed">
          {{ enhancedDescription }}
        </p>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-check"
            label="Use This"
            color="success"
            variant="soft"
            size="sm"
            @click="useEnhanced"
          />
          <UButton
            icon="i-lucide-x"
            label="Discard"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="discardEnhanced"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
