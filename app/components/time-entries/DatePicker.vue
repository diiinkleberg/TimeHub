<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import {
  DateFormatter,
  getLocalTimeZone,
  today
} from '@internationalized/date'

interface Props {
  modelValue: CalendarDate
}

interface Emits {
  (e: 'update:modelValue', value: CalendarDate): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const df = new DateFormatter('de-DE', { dateStyle: 'long' })
const todayDate = today(getLocalTimeZone())

const isToday = computed(() => props.modelValue.compare(todayDate) === 0)

const goToPreviousDay = () => {
  emit('update:modelValue', props.modelValue.subtract({ days: 1 }))
}

const goToNextDay = () => {
  if (!isToday.value) {
    emit('update:modelValue', props.modelValue.add({ days: 1 }))
  }
}

const goToToday = () => {
  emit('update:modelValue', todayDate)
}

const handleCalendarUpdate = (value: any) => {
  if (value && 'year' in value && 'month' in value && 'day' in value) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <UFormField
    label="Date"
    required
  >
    <div class="flex max-w-xs gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="outline"
        size="md"
        @click="goToPreviousDay"
      />

      <UPopover>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-calendar"
          class="flex-1"
        >
          {{ df.format(modelValue.toDate(getLocalTimeZone())) }}
        </UButton>

        <template #content>
          <UCalendar
            :model-value="modelValue"
            :max-value="todayDate"
            @update:model-value="handleCalendarUpdate"
          />
        </template>
      </UPopover>

      <UButton
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="outline"
        size="md"
        :disabled="isToday"
        @click="goToNextDay"
      />

      <UButton
        label="Today"
        color="neutral"
        variant="soft"
        size="md"
        :disabled="isToday"
        @click="goToToday"
      />
    </div>
  </UFormField>
</template>
