<script setup lang="ts">
import type { PlanioIssue } from '#shared/schemas/planio/issue'
import type { SimpleProject } from '#shared/types/planio'
import { CalendarDate } from '@internationalized/date'

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

const hoursToDecimal = (timeStr: string) => {
  const [hoursPart = 0, minutesPart = 0] = timeStr.split(':').map(Number)
  return hoursPart + minutesPart / 60
}

const hoursDecimal = computed(() => hoursToDecimal(hours.value))

const isValid = computed(() =>
  Boolean(
    selectedIssue.value
    && hoursDecimal.value > 0
    && hoursDecimal.value <= 12
    && comments.value.trim().length
    && spentOn.value
  )
)

const isSubmitDisabled = computed(
  () => !isValid.value || isEnhancing.value
)

const toast = useToast()
const spentOnDate = computed(
  () => new Date(spentOn.value.year, spentOn.value.month - 1, spentOn.value.day)
)

const formatCalendarDate = (date: CalendarDate) =>
  `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

const resetForm = () => {
  selectedProject.value = null
  selectedIssue.value = null
  hours.value = '1:00'
  comments.value = ''
  spentOn.value = today()
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
        hours: hoursDecimal.value,
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
        :spent-on="spentOnDate"
        @enhancing="isEnhancing = $event"
      />

      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <UButton
            type="button"
            label="Reset"
            icon="i-lucide-rotate-ccw"
            color="warning"
            variant="outline"
            :disabled="submitting || isEnhancing"
            size="md"
            class="w-full md:w-auto"
            @click="handleReset"
          />
          <UButton
            type="submit"
            label="Log Time Entry"
            icon="i-lucide-check"
            :loading="submitting"
            :disabled="isSubmitDisabled"
            size="md"
            class="w-full md:w-auto md:min-w-44"
          />
      </div>
    </form>
  </UCard>
</template>
