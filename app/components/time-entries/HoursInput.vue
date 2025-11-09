<script setup lang="ts">
import type { PlanioIssue } from '#shared/schemas/planio/issue'

interface Props {
  modelValue: string
  issue?: PlanioIssue | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const MINUTES_STEP = 15
const MIN_TOTAL_MINUTES = 15
const MAX_TOTAL_MINUTES = 12 * 60

const clamp = (minutes: number) =>
  Math.max(MIN_TOTAL_MINUTES, Math.min(MAX_TOTAL_MINUTES, minutes))

const toMinutes = (value: string) => {
  const [rawHours = '0', rawMinutes = '0'] = value.split(':')
  const hours = Number.parseInt(rawHours, 10) || 0
  const minutes = Number.parseInt(rawMinutes, 10) || 0
  return clamp(hours * 60 + minutes)
}

const toTime = (totalMinutes: number) => {
  const minutes = clamp(totalMinutes)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours}:${String(remainder).padStart(2, '0')}`
}

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const currentMinutes = computed(() => toMinutes(localValue.value))

const adjustTime = (delta: number) => {
  localValue.value = toTime(currentMinutes.value + delta)
}

const handleQuickSelect = (value: string) => {
  localValue.value = toTime(toMinutes(value))
}

const handleBlur = () => {
  localValue.value = toTime(currentMinutes.value)
}

const canDecrease = computed(() => currentMinutes.value > MIN_TOTAL_MINUTES)
const canIncrease = computed(() => currentMinutes.value < MAX_TOTAL_MINUTES)

const quickHours = [
  { label: '15m', value: '0:15' },
  { label: '30m', value: '0:30' },
  { label: '1h', value: '1:00' },
  { label: '2h', value: '2:00' },
  { label: '4h', value: '4:00' },
  { label: '8h', value: '8:00' }
]

const minutesToDecimal = (minutes: number) => minutes / 60

const formatDecimalHours = (decimal: number) => {
  const hours = Math.floor(decimal)
  const minutes = Math.round((decimal - hours) * 60)
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

const timeInfo = computed(() => {
  const issue = props.issue
  const estimated = issue?.total_estimated_hours
  if (!issue || !estimated) return null

  const spent = issue.total_spent_hours ?? 0
  const current = minutesToDecimal(currentMinutes.value)
  const projected = spent + current
  const remaining = Math.max(0, estimated - projected)
  const rawPercentage = estimated > 0 ? (projected / estimated) * 100 : 0
  const percentage = Number.isFinite(rawPercentage)
    ? Math.min(100, rawPercentage)
    : 0

  return {
    spent,
    estimated,
    currentInput: current,
    projectedSpent: projected,
    remaining,
    percentage,
    actualPercentage: Number.isFinite(rawPercentage) ? rawPercentage : 0,
    isOvertime: projected > estimated
  }
})
</script>

<template>
  <UFormField
    label="Hours"
    required
  >
    <div class="space-y-3">
      <div class="flex items-center gap-2 max-w-xs">
        <UButton
          icon="i-lucide-minus"
          size="sm"
          variant="outline"
          color="neutral"
          :disabled="!canDecrease"
          @click="adjustTime(-MINUTES_STEP)"
        />

        <UInput
          v-model="localValue"
          type="text"
          pattern="[0-9]{1,2}:[0-5][0-9]"
          placeholder="1:00"
          icon="i-lucide-clock"
          class="flex-1 text-center font-mono text-lg w-28"
          @blur="handleBlur"
        />

        <UButton
          icon="i-lucide-plus"
          size="sm"
          variant="outline"
          color="neutral"
          :disabled="!canIncrease"
          @click="adjustTime(MINUTES_STEP)"
        />
      </div>

      <div class="flex gap-1 flex-wrap">
        <UButton
          v-for="quick in quickHours"
          :key="quick.value"
          :label="quick.label"
          size="xs"
          variant="soft"
          color="neutral"
          @click="handleQuickSelect(quick.value)"
        />
      </div>

      <div
        v-if="timeInfo"
        class="p-4 bg-elevated border border-default rounded-lg space-y-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-highlighted">Time Budget</span>
          <UBadge
            :label="timeInfo.isOvertime ? 'Over Budget' : 'On Track'"
            :color="timeInfo.isOvertime ? 'error' : 'success'"
            size="sm"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="grid grid-cols-2 gap-3 text-center">
            <div>
              <div class="text-xs text-muted mb-1">
                Already Spent
              </div>
              <div class="text-base font-semibold text-default font-mono">
                {{ formatDecimalHours(timeInfo.spent) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">
                Estimated
              </div>
              <div class="text-base font-semibold text-default font-mono">
                {{ formatDecimalHours(timeInfo.estimated) }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-center md:border-l md:border-default md:pl-4">
            <div>
              <div class="text-xs text-primary mb-1">
                + This Entry
              </div>
              <div class="text-base font-semibold text-primary font-mono">
                {{ formatDecimalHours(timeInfo.currentInput) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">
                Will Remain
              </div>
              <div
                class="text-base font-semibold font-mono"
                :class="timeInfo.isOvertime ? 'text-red-400' : 'text-success'"
              >
                {{ formatDecimalHours(timeInfo.remaining) }}
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-1">
          <UProgress
            :model-value="timeInfo.percentage"
            :max="100"
            size="md"
            :color="timeInfo.isOvertime ? 'error' : 'primary'"
          />

          <div class="flex items-center justify-between text-xs">
            <span class="text-muted">
              {{ formatDecimalHours(timeInfo.projectedSpent) }} / {{ formatDecimalHours(timeInfo.estimated) }}h
            </span>
            <span
              :class="timeInfo.isOvertime ? 'text-red-400 font-semibold' : 'text-muted'"
            >
              {{ Math.round(timeInfo.actualPercentage) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </UFormField>
</template>
