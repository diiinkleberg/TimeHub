<script setup lang="ts">
interface Props {
  modelValue: string;
  spentOn?: Date; // The date for which we're logging time
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "enhancing", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { linkGithubAccount, listAccounts } = await useAuth();

const rawInput = ref(props.modelValue);
const enhancedDescription = ref("");
const isEnhancing = ref(false);
const showEnhanced = ref(false);
const tokensUsed = ref(0);
const toast = useToast();

// Check if GitHub is linked
const accounts = ref<Array<any>>([]);
const isLoadingGitHub = ref(false);

async function fetchAccounts() {
  try {
    const result = await listAccounts();
    if (result.data) {
      accounts.value = result.data;
    }
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
  }
}

const isGithubLinked = computed(() =>
  accounts.value.some((acc) => acc.providerId === "github"),
);

// Fetch GitHub commits for the selected date
const githubCommits = ref<
  Array<{ sha: string; message: string; date: string; url: string; repo: string }>
>([]);

const selectedCommits = ref<
  Array<{ label: string; value: string; sha: string; message: string; date: string; url: string; repo: string }>
>([]);

// Transform commits into SelectMenu items
const commitItems = computed(() =>
  githubCommits.value.map((commit) => ({
    label: `${commit.message} (${commit.repo})`,
    value: commit.sha,
    sha: commit.sha,
    message: commit.message,
    date: commit.date,
    url: commit.url,
    repo: commit.repo,
  })),
);

async function fetchGitHubCommits() {
  if (!props.spentOn || !isGithubLinked.value) return;

  isLoadingGitHub.value = true;
  console.log("🔍 Fetching GitHub commits for date:", props.spentOn);
  try {
    // Get commits from the selected date and the day before
    // (to catch commits made near midnight)
    const selectedDate = new Date(props.spentOn);
    const since = new Date(selectedDate);
    since.setDate(since.getDate() - 1); // Start from day before
    since.setHours(0, 0, 0, 0);

    const until = new Date(selectedDate);
    until.setDate(until.getDate() + 1); // End day after
    until.setHours(23, 59, 59, 999);

    const commits = await $fetch<
      Array<{ sha: string; message: string; date: string; url: string; repo: string }>
    >("/api/github/commits", {
      query: {
        since: since.toISOString(),
        until: until.toISOString(),
        limit: 20, // Get more to filter
      },
    });

    console.log("✅ Received commits from API:", commits.length, commits);
    githubCommits.value = commits;
    // Clear selection when commits change
    selectedCommits.value = [];
  } catch (error) {
    console.error("Failed to fetch GitHub commits:", error);
    githubCommits.value = [];
    selectedCommits.value = [];
  } finally {
    isLoadingGitHub.value = false;
  }
}

// Fetch commits when GitHub is linked and date changes
watch([isGithubLinked, () => props.spentOn], () => {
  if (isGithubLinked.value && props.spentOn) {
    fetchGitHubCommits();
  }
});

// Sync with parent
watch(
  () => props.modelValue,
  (newValue) => {
    rawInput.value = newValue;
  },
);

// Emit enhancing state to parent
watch(isEnhancing, (newValue) => {
  emit("enhancing", newValue);
});

const hasRawInput = computed(() => rawInput.value.trim().length > 0);

const enhanceDescription = async () => {
  isEnhancing.value = true;
  showEnhanced.value = false;

  try {
    // Prepare context with selected GitHub commits
    let contextDescription = rawInput.value;

    if (selectedCommits.value.length > 0) {
      const commitsContext = selectedCommits.value
        .map((c) => `- [${c.repo}] ${c.message} (${c.sha}) - ${c.url}`)
        .join("\n");
      contextDescription = `${rawInput.value}\n\nRelated GitHub Commits:\n${commitsContext}`;
    }

    console.log("🤖 Sending to AI:", { contextDescription, commits: selectedCommits.value.length });

    const response = await $fetch<{
      enhanced: string;
      original: string;
      usedToken: number;
    }>("/api/ai/enhance-description", {
      method: "POST",
      body: {
        description: contextDescription,
      },
    });

    enhancedDescription.value = response.enhanced;
    tokensUsed.value = response.usedToken;
    showEnhanced.value = true;

    toast.add({
      title: "Description enhanced",
      description: `AI has improved your work description${selectedCommits.value.length > 0 ? ` with ${selectedCommits.value.length} commit${selectedCommits.value.length !== 1 ? 's' : ''}` : ''} (${response.usedToken} tokens used)`,
      color: "success",
    });
  } catch (error) {
    console.error("Enhancement error:", error);
    toast.add({
      title: "Enhancement failed",
      description: "Could not enhance description. Please try again.",
      color: "error",
    });
  } finally {
    isEnhancing.value = false;
  }
};

const useEnhanced = () => {
  emit("update:modelValue", enhancedDescription.value);
  rawInput.value = enhancedDescription.value;
  showEnhanced.value = false;

  toast.add({
    title: "Description updated",
    description: "Enhanced description applied",
    color: "success",
  });
};

const discardEnhanced = () => {
  showEnhanced.value = false;
};

const updateRawInput = (value: string) => {
  rawInput.value = value;
  emit("update:modelValue", value);
};

// Initial fetch
onMounted(async () => {
  await fetchAccounts();
});
</script>

<template>
  <div class="space-y-4">
    <!-- GitHub Commit Selection - Always Visible -->
    <div v-if="isGithubLinked" class="space-y-2">
      <label class="block text-sm font-medium text-highlighted">
        GitHub Commits
        <span v-if="githubCommits.length > 0" class="text-muted font-normal">
          ({{ githubCommits.length }} found for this date)
        </span>
      </label>
      <USelectMenu
        v-model="selectedCommits"
        :options="commitItems"
        multiple
        searchable
        option-attribute="label"
        :placeholder="
          isLoadingGitHub
            ? 'Loading commits...'
            : githubCommits.length === 0
              ? 'No commits found for this date'
              : selectedCommits.length === 0
                ? 'Select commits to include...'
                : `${selectedCommits.length} commit${selectedCommits.length !== 1 ? 's' : ''} selected`
        "
        :disabled="isEnhancing || isLoadingGitHub || githubCommits.length === 0"
        :loading="isLoadingGitHub"
        class="w-full"
      />
    </div>

    <!-- GitHub Not Linked Alert - Compact version -->
    <UAlert
      v-else
      icon="i-simple-icons-github"
      color="neutral"
      variant="soft"
      title="Link GitHub to include commits"
      :actions="[
        {
          label: 'Go to Settings',
          icon: 'i-lucide-settings',
          to: '/settings',
        },
      ]"
    />

    <!-- Work Description Input -->
    <UFormField label="Work Description" required class="space-y-3">
      <UTextarea
        size="xl"
        autoresize
        color="neutral"
        :model-value="rawInput"
        :rows="5"
        :disabled="isEnhancing"
        class="w-full"
        placeholder="Describe what you worked on... (notes, bullet points, or paste any text)"
        @update:model-value="updateRawInput"
      />

      <template #hint>
        <div class="flex items-center justify-between gap-3">
          <!-- Character count -->
          <span
            class="text-sm font-medium"
            :class="rawInput.length > 0 ? 'text-primary' : 'text-muted'"
          >
            {{ rawInput.length }} characters
          </span>

          <!-- AI Enhancement Button -->
          <UButton
            :icon="isEnhancing ? 'i-lucide-loader-2' : 'i-lucide-sparkles'"
            :label="isEnhancing ? 'Enhancing...' : 'Enhance with AI'"
            color="primary"
            variant="solid"
            size="sm"
            :disabled="!hasRawInput || isEnhancing"
            @click="enhanceDescription"
          >
            <template v-if="isEnhancing" #leading>
              <UIcon name="i-lucide-loader-2" class="animate-spin" />
            </template>
          </UButton>
        </div>
      </template>
    </UFormField>

    <!-- Enhanced Description Preview -->
    <UCard v-if="showEnhanced" class="border-2 border-primary/20 bg-primary/5">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="size-4 text-primary" />
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
