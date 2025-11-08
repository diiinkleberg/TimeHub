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

// Convert HH:MM to decimal hours
const hoursToDecimal = (timeStr: string): number => {
  const [hours = 0, minutes = 0] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

// Time tracking info - now reactive to current input
const timeInfo = computed(() => {
  if (!props.issue) return null;

  const spent = props.issue.total_spent_hours || 0;
  const estimated = props.issue.total_estimated_hours;

  if (!estimated) return null;

  // Add current input to spent time for preview
  const currentInputHours = hoursToDecimal(props.modelValue);
  const projectedSpent = spent + currentInputHours;
  
  const remaining = Math.max(0, estimated - projectedSpent);
  const isOvertime = projectedSpent > estimated;
  
  // Calculate percentage - ensure it's always a valid number
  const actualPercentage = (projectedSpent / estimated) * 100;
  const percentage = Math.min(100, actualPercentage);

  return {
    spent,
    estimated,
    currentInput: currentInputHours,
    projectedSpent,
    remaining,
    percentage: isNaN(percentage) ? 0 : percentage, // Prevent NaN
    actualPercentage: isNaN(actualPercentage) ? 0 : actualPercentage,
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
      <div class="flex items-center gap-2 max-w-xs">
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
          class="flex-1 text-center font-mono text-lg w-28"
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

        <!-- Two-column layout: Stats on left, Preview on right -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Left: Current Stats -->
          <div class="grid grid-cols-2 gap-3 text-center">
            <div>
              <div class="text-xs text-muted mb-1">Already Spent</div>
              <div class="text-base font-semibold text-default font-mono">
                {{ formatDecimalHours(timeInfo.spent) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Estimated</div>
              <div class="text-base font-semibold text-default font-mono">
                {{ formatDecimalHours(timeInfo.estimated) }}
              </div>
            </div>
          </div>

          <!-- Right: After Logging Preview -->
          <div class="grid grid-cols-2 gap-3 text-center md:border-l md:border-default md:pl-4">
            <div>
              <div class="text-xs text-primary mb-1">+ This Entry</div>
              <div class="text-base font-semibold text-primary font-mono">
                {{ formatDecimalHours(timeInfo.currentInput) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Will Remain</div>
              <div
                class="text-base font-semibold font-mono"
                :class="timeInfo.isOvertime ? 'text-red-400' : 'text-success'"
              >
                {{ formatDecimalHours(timeInfo.remaining) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-1">
          <UProgress
            :model-value="timeInfo.percentage"
            :max="100"
            size="md"
            :color="timeInfo.isOvertime ? 'error' : 'primary'"
          />
          
          <!-- Percentage indicator -->
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
