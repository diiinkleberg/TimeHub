<script setup lang="ts">
import type { PlanioIssue } from '#shared/schemas/planio/issue'
import type { SimpleProject } from '#shared/types/planio'
import { CalendarDate } from '@internationalized/date'
import { useTimeAgo } from '@vueuse/core'

interface Emits {
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const selectedProject = ref<SimpleProject | null>(null)
const selectedIssue = ref<PlanioIssue | null>(null)
const hours = ref('1:00')
const comments = ref('')
const isEnhancing = ref(false)
const isSettingFromIssue = ref(false)
const isSyncing = ref(false)
const submitting = ref(false)

const toCalendarDate = (date: Date) =>
  new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())

const today = () => toCalendarDate(new Date())
const spentOn = shallowRef(today())

const lastSavedAt = ref<number | null>(null)
const lastSavedSource = computed(() => lastSavedAt.value ?? Date.now())
const lastSavedAgo = useTimeAgo(lastSavedSource)

const markLastSaved = () => {
  if (isSyncing.value) return
  lastSavedAt.value = Date.now()
}

watch(selectedProject, markLastSaved)
watch(selectedIssue, markLastSaved)
watch(hours, markLastSaved)
watch(comments, markLastSaved)
watch(spentOn, markLastSaved)

watch(selectedIssue, (newIssue) => {
  if (!newIssue?.project) return

  isSettingFromIssue.value = true
  selectedProject.value = {
    id: newIssue.project.id,
    name: newIssue.project.name
  } satisfies SimpleProject

  nextTick(() => {
    isSettingFromIssue.value = false
  })
})

const hoursToDecimal = (timeStr: string): number => {
  const [hoursPart = 0, minutesPart = 0] = timeStr.split(':').map(Number)
  return hoursPart + minutesPart / 60
}

const isValid = computed(() =>
  Boolean(
    selectedIssue.value
    && hoursToDecimal(hours.value) > 0
    && hoursToDecimal(hours.value) <= 12
    && comments.value.trim().length
    && spentOn.value
  )
)

const isDirty = computed(() =>
  Boolean(
    selectedProject.value
    || selectedIssue.value
    || hours.value !== '1:00'
    || comments.value.trim().length
    || spentOn.value.compare(today()) !== 0
  )
)

const isSubmitDisabled = computed(
  () => !isValid.value || submitting.value || isEnhancing.value
)

const toast = useToast()

const formatCalendarDate = (date: CalendarDate) =>
  `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

const resetForm = () => {
  isSyncing.value = true
  selectedProject.value = null
  selectedIssue.value = null
  hours.value = '1:00'
  comments.value = ''
  spentOn.value = today()
  lastSavedAt.value = null
  nextTick(() => {
    isSyncing.value = false
  })
}

const handleSubmit = async () => {
  if (!isValid.value) return

  submitting.value = true

  try {
    const formattedDate = formatCalendarDate(spentOn.value)

    await $fetch('/api/planio/time-entries', {
      method: 'POST',
      body: {
        issue_id: selectedIssue.value!.id,
        hours: hoursToDecimal(hours.value),
        comments: comments.value,
        spent_on: formattedDate
      }
    })

    toast.add({
      title: 'Time entry created',
      description: `Logged ${hours.value}h on #${selectedIssue.value!.id}`,
      color: 'success'
    })

    resetForm()
    emit('success')
  } catch (error: any) {
    console.error('Failed to create time entry:', error)
    toast.add({
      title: 'Failed to create time entry',
      description: error?.data?.message || error?.message || 'Please try again',
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  resetForm()

  toast.add({
    title: 'Form reset',
    description: 'All fields have been cleared',
    color: 'neutral'
  })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-clock"
          class="size-5 text-primary"
        />
        <h3 class="text-lg font-semibold">
          Log Time
        </h3>
      </div>
    </template>

    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlanioProjectSelector v-model="selectedProject" />
        <PlanioIssueSelector
          v-model="selectedIssue"
          :project-id="selectedProject?.id"
          :skip-reload="isSettingFromIssue"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeEntriesDatePicker v-model="spentOn" />
        <TimeEntriesHoursInput
          v-model="hours"
          :issue="selectedIssue"
        />
      </div>

      <TimeEntriesDescriptionEditor
        v-model="comments"
        :spent-on="new Date(spentOn.year, spentOn.month - 1, spentOn.day)"
        @enhancing="isEnhancing = $event"
      />

      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex w-full flex-col gap-2 md:flex-row md:items-center">
          <UButton
            type="submit"
            label="Log Time Entry"
            icon="i-lucide-check"
            :loading="submitting"
            :disabled="isSubmitDisabled"
            size="md"
            class="w-full md:w-auto md:min-w-44"
          />

          <UButton
            type="button"
            label="Reset"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="outline"
            :disabled="submitting || isEnhancing || !isDirty"
            size="sm"
            class="w-full md:w-auto"
            @click="handleReset"
          />
        </div>

        <div
          v-if="lastSavedAt"
          class="text-xs text-center text-muted md:text-right"
        >
          Last saved {{ lastSavedAgo }}
        </div>
      </div>
    </form>
  </UCard>
</template>
