<script setup lang="ts">
import type { PlanioIssue } from "#shared/schemas/planio/issue";

interface Props {
  modelValue: string; // HH:MM format
  issue?: PlanioIssue | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// Parse HH:MM to get hours and minutes
const parseTime = (timeStr: string) => {
  const [hours = 1, minutes = 0] = timeStr.split(":").map(Number);
  return { hours, minutes };
};

// Format to HH:MM
const formatTime = (hours: number, minutes: number) => {
  return `${hours}:${String(minutes).padStart(2, "0")}`;
};

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});

// Increment/decrement by 15 minutes
const adjustTime = (minutes: number) => {
  const { hours, minutes: currentMinutes } = parseTime(localValue.value);
  let totalMinutes = hours * 60 + currentMinutes + minutes;

  // Clamp between 15 minutes and 12 hours
  totalMinutes = Math.max(15, Math.min(720, totalMinutes));

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  localValue.value = formatTime(newHours, newMinutes);
};

// Quick hour buttons
const quickHours = [
  { label: "15m", value: "0:15" },
  { label: "30m", value: "0:30" },
  { label: "1h", value: "1:00" },
  { label: "2h", value: "2:00" },
  { label: "4h", value: "4:00" },
  { label: "8h", value: "8:00" },
];

// Time tracking info
const timeInfo = computed(() => {
  if (!props.issue) return null;

  const spent = props.issue.total_spent_hours || 0;
  const estimated = props.issue.total_estimated_hours;

  if (!estimated) return null;

  const remaining = Math.max(0, estimated - spent);
  const percentage = Math.min(100, (spent / estimated) * 100);
  const isOvertime = spent > estimated;

  return {
    spent,
    estimated,
    remaining,
    percentage,
    isOvertime,
  };
});

// Convert decimal to HH:MM
const formatDecimalHours = (decimal: number) => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
};
</script>

<template>
  <UFormField label="Hours" required>
    <div class="space-y-3">
      <!-- Time Input with Ticker -->
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-minus"
          size="sm"
          variant="outline"
          color="neutral"
          @click="adjustTime(-15)"
        />

        <UInput
          v-model="localValue"
          type="text"
          pattern="[0-9]{1,2}:[0-5][0-9]"
          placeholder="1:00"
          icon="i-lucide-clock"
          class="flex-1 text-center font-mono text-lg"
        />

        <UButton
          icon="i-lucide-plus"
          size="sm"
          variant="outline"
          color="neutral"
          @click="adjustTime(15)"
        />
      </div>

      <!-- Quick Hour Buttons -->
      <div class="flex gap-1 flex-wrap">
        <UButton
          v-for="quick in quickHours"
          :key="quick.value"
          :label="quick.label"
          size="xs"
          variant="soft"
          color="neutral"
          @click="localValue = quick.value"
        />
      </div>

      <!-- Time Tracking Progress (if issue selected with estimates) -->
      <div
        v-if="timeInfo"
        class="p-3 bg-elevated border border-default rounded-lg space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-highlighted">Time Budget</span>
          <UBadge
            :label="timeInfo.isOvertime ? 'Over Budget' : 'On Track'"
            :color="timeInfo.isOvertime ? 'error' : 'success'"
            size="xs"
          />
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <div class="text-xs text-muted mb-0.5">Spent</div>
            <div class="text-sm font-semibold text-default font-mono">
              {{ formatDecimalHours(timeInfo.spent) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted mb-0.5">Estimated</div>
            <div class="text-sm font-semibold text-default font-mono">
              {{ formatDecimalHours(timeInfo.estimated) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted mb-0.5">Remaining</div>
            <div
              class="text-sm font-semibold font-mono"
              :class="timeInfo.isOvertime ? 'text-red-400' : 'text-default'"
            >
              {{ formatDecimalHours(timeInfo.remaining) }}
            </div>
          </div>
        </div>

        <UProgress
          :value="timeInfo.percentage"
          :max="100"
          size="sm"
          :color="timeInfo.isOvertime ? 'error' : 'primary'"
        />
      </div>
    </div>
  </UFormField>
</template>
