<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  CalendarDate,
  today,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "@internationalized/date";
import type { Range } from "~/types";

const df = new DateFormatter("de-DE", {
  dateStyle: "long",
});

const selected = defineModel<Range>({ required: true });

// ✅ Simple mode: "week" or "month"
const mode = ref<"week" | "month">("week");

const toCalendarDate = (date: Date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
};

// ✅ Get current range based on mode
const getCurrentRange = () => {
  const currentDate = today(getLocalTimeZone());

  if (mode.value === "week") {
    return {
      start: startOfWeek(currentDate, "en-US").toDate(getLocalTimeZone()),
      end: endOfWeek(currentDate, "en-US").toDate(getLocalTimeZone()),
    };
  } else {
    return {
      start: startOfMonth(currentDate).toDate(getLocalTimeZone()),
      end: endOfMonth(currentDate).toDate(getLocalTimeZone()),
    };
  }
};

// ✅ Navigate backward
const goPrevious = () => {
  const start = toCalendarDate(selected.value.start!);

  if (mode.value === "week") {
    const newStart = startOfWeek(start.subtract({ weeks: 1 }), "en-US");
    const newEnd = endOfWeek(newStart, "en-US");
    selected.value = {
      start: newStart.toDate(getLocalTimeZone()),
      end: newEnd.toDate(getLocalTimeZone()),
    };
  } else {
    const newStart = startOfMonth(start.subtract({ months: 1 }));
    const newEnd = endOfMonth(newStart);
    selected.value = {
      start: newStart.toDate(getLocalTimeZone()),
      end: newEnd.toDate(getLocalTimeZone()),
    };
  }
};

// ✅ Navigate forward (only if not in future)
const goNext = () => {
  if (isInFuture.value) return;

  const start = toCalendarDate(selected.value.start!);

  if (mode.value === "week") {
    const newStart = startOfWeek(start.add({ weeks: 1 }), "en-US");
    const newEnd = endOfWeek(newStart, "en-US");
    selected.value = {
      start: newStart.toDate(getLocalTimeZone()),
      end: newEnd.toDate(getLocalTimeZone()),
    };
  } else {
    const newStart = startOfMonth(start.add({ months: 1 }));
    const newEnd = endOfMonth(newStart);
    selected.value = {
      start: newStart.toDate(getLocalTimeZone()),
      end: newEnd.toDate(getLocalTimeZone()),
    };
  }
};

// ✅ Jump to current week/month
const goToCurrent = () => {
  selected.value = getCurrentRange();
};

// ✅ Switch mode
const switchMode = (newMode: "week" | "month") => {
  mode.value = newMode;
  selected.value = getCurrentRange();
};

// ✅ Check if we're viewing current period
const isCurrentPeriod = computed(() => {
  const current = getCurrentRange();
  return (
    selected.value.start?.getTime() === current.start.getTime() &&
    selected.value.end?.getTime() === current.end.getTime()
  );
});

// ✅ Check if selected range would be in the future
const isInFuture = computed(() => {
  if (!selected.value.end) return false;

  const currentDate = today(getLocalTimeZone());
  const currentEnd =
    mode.value === "week"
      ? endOfWeek(currentDate, "en-US")
      : endOfMonth(currentDate);

  const selectedEnd = toCalendarDate(selected.value.end);

  return selectedEnd.compare(currentEnd) >= 0;
});

// ✅ Format display
const formatRange = computed(() => {
  if (!selected.value.start || !selected.value.end) return "Select range";

  const start = df.format(selected.value.start);
  const end = df.format(selected.value.end);

  return `${start} - ${end}`;
});
</script>

<template>
  <UFormField required>
    <div class="flex gap-2 max-w-150">
      <!-- Previous Button -->
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="outline"
        size="md"
        @click="goPrevious"
      />

      <!-- Date Range Display -->
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-calendar-range"
        class="flex-1"
      >
        {{ formatRange }}
      </UButton>

      <!-- Next Button -->
      <UButton
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="outline"
        size="md"
        :disabled="isInFuture"
        @click="goNext"
      />

      <!-- Today Button -->
      <UButton
        label="Today"
        color="primary"
        variant="soft"
        :active="!isCurrentPeriod"
        active-variant="solid"
        active-color="primary"
        size="md"
        :class="{ 'color-neutral': isCurrentPeriod, ' cursor-pointer ring-primary/50': !isCurrentPeriod }"
        :disabled="isCurrentPeriod"
        @click="goToCurrent"
      />

      <!-- Week/Month Toggle -->
      <div class="flex rounded-lg border border-default overflow-hidden">
        <UButton
          label="Week"
          size="md"
          :variant="mode === 'week' ? 'solid' : 'soft'"
          :color="mode === 'week' ? 'primary' : 'neutral'"
          class="rounded-none border-r border-default"
          @click="switchMode('week')"
        />
        <UButton
          label="Month"
          size="md"
          :variant="mode === 'month' ? 'solid' : 'soft'"
          :color="mode === 'month' ? 'primary' : 'neutral'"
          class="rounded-none"
          @click="switchMode('month')"
        />
      </div>
    </div>
  </UFormField>
</template>
