<script setup lang="ts">
import { useVModel } from '@vueuse/core'

interface Props {
  modelValue: string
  spentOn?: Date
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'enhancing', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const description = useVModel(props, 'modelValue', emit)
const enhancedDescription = ref('')
const isEnhancing = ref(false)
const showEnhanced = ref(false)
const tokensUsed = ref(0)
const toast = useToast()

const charCount = computed(() => description.value.length)
const hasDescription = computed(() => description.value.trim().length > 0)

watch(isEnhancing, value => emit('enhancing', value))

const enhanceDescription = async () => {
  if (!hasDescription.value || isEnhancing.value) return

  isEnhancing.value = true
  showEnhanced.value = false

  try {
    const response = await $fetch<{
      enhanced: string
      original: string
      usedToken: number
    }>('/api/ai/enhance-description', {
      method: 'POST',
      body: {
        description: description.value
      }
    })

    enhancedDescription.value = response.enhanced
    tokensUsed.value = response.usedToken
    showEnhanced.value = true

    toast.add({
      title: 'Description enhanced',
      description: `${response.usedToken} tokens used`,
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Enhancement failed',
      description: error instanceof Error
        ? error.message
        : 'Could not enhance description. Please try again.',
      color: 'error'
    })
  } finally {
    isEnhancing.value = false
  }
}

const useEnhanced = () => {
  description.value = enhancedDescription.value
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
</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Work Description"
      required
      class="space-y-3"
    >
      <div class="relative">
        <UTextarea
          v-model="description"
          size="lg"
          autoresize
          color="neutral"
          :rows="5"
          :disabled="isEnhancing"
          class="w-full"
          placeholder="Describe what you worked on... (notes, bullet points, or paste any text)"
          :aria-busy="isEnhancing"
        />
        <div
          v-if="isEnhancing"
          class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="size-5 animate-spin text-primary"
          />
        </div>
      </div>

      <template #hint>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span
            class="text-sm font-medium"
            :class="charCount > 0 ? 'text-primary' : 'text-muted'"
          >
            {{ charCount }} characters
          </span>
          <div>
            <UButton
              :icon="isEnhancing ? 'i-lucide-loader-2 animate-spin' : 'i-lucide-sparkles'"
              :label="isEnhancing ? 'Enhancing…' : 'Enhance with AI'"
              color="primary"
              variant="solid"
              size="sm"
              :disabled="!hasDescription || isEnhancing"
              @click="enhanceDescription"
            />
          </div>
        </div>
      </template>
    </UFormField>

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
