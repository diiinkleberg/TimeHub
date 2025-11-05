<script setup lang="ts">
interface Props {
  modelValue: string;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "enhancing", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const rawInput = ref(props.modelValue);
const enhancedDescription = ref("");
const isEnhancing = ref(false);
const showEnhanced = ref(false);
const tokensUsed = ref(0);
const toast = useToast();

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
    const response = await $fetch<{
      enhanced: string;
      original: string;
      usedToken: number;
    }>("/api/ai/enhance-description", {
      method: "POST",
      body: {
        description: rawInput.value,
      },
    });

    enhancedDescription.value = response.enhanced;
    tokensUsed.value = response.usedToken;
    showEnhanced.value = true;

    toast.add({
      title: "Description enhanced",
      description: `AI has improved your work description (${response.usedToken} tokens used)`,
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
</script>

<template>
  <div class="space-y-3">
    <UFormField label="Work Description" required>
      <UTextarea
        size="xl"
        autoresize
        color="neutral"
        :model-value="rawInput"
        :rows="4"
        :disabled="isEnhancing"
        class="w-full"
        placeholder="Describe what you worked on... (e.g., notes, bullet points, or paste any text)"
        @update:model-value="updateRawInput"
      />

      <template #hint>
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center gap-3 mr-4">
            <span
              class="text-sm font-medium"
              :class="rawInput.length > 0 ? 'text-primary' : 'text-muted'"
            >
              {{ rawInput.length }} characters
            </span>
            <span
              v-if="isEnhancing"
              class="text-sm text-primary flex items-center gap-1.5"
            >
              <UIcon name="i-lucide-loader-2" class="size-3.5 animate-spin" />
              AI is enhancing your description...
            </span>
          </div>

          <UButton
            icon="i-lucide-sparkles"
            label="Enhance with AI"
            color="primary"
            variant="solid"
            size="sm"
            :loading="isEnhancing"
            :disabled="!hasRawInput || isEnhancing"
            @click="enhanceDescription"
          />
        </div>
      </template>
    </UFormField>

    <!-- Enhanced Description Preview -->
    <UCard v-if="showEnhanced" class="border-2 border-primary/50">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="size-4 text-primary" />
            <h4 class="text-sm font-semibold text-highlighted">
              Enhanced Description
            </h4>
          </div>
          <UBadge
            v-if="tokensUsed > 0"
            variant="soft"
            color="neutral"
            size="xs"
          >
            {{ tokensUsed }} tokens
          </UBadge>
        </div>
      </template>

      <div class="prose prose-sm max-w-none text-default">
        <p class="whitespace-pre-wrap">{{ enhancedDescription }}</p>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-check"
            label="Use This"
            color="success"
            variant="soft"
            @click="useEnhanced"
          />
          <UButton
            icon="i-lucide-x"
            label="Discard"
            color="neutral"
            variant="ghost"
            @click="discardEnhanced"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
