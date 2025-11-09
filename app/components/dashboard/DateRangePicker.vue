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

type RangeMode = "week" | "month";

const selected = defineModel<Range>({ required: true });

const timeZone = getLocalTimeZone();
const formatter = new DateFormatter("de-DE", { dateStyle: "long" });
const mode = ref<RangeMode>("week");

const toCalendarDate = (date: Date) =>
  new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

const buildRange = (start: CalendarDate, end: CalendarDate): Range => ({
  start: start.toDate(timeZone),
  end: end.toDate(timeZone),
});

const currentRange = computed(() => {
  const reference = today(timeZone);

  return mode.value === "week"
    ? buildRange(
        startOfWeek(reference, "en-US"),
        endOfWeek(reference, "en-US"),
      )
    : buildRange(startOfMonth(reference), endOfMonth(reference));
});

const applyRange = (range: Range) => {
  selected.value = range;
};

const shiftRange = (direction: 1 | -1) => {
  const start = toCalendarDate(selected.value.start);

  const nextStart =
    mode.value === "week"
      ? startOfWeek(start.add({ weeks: direction }), "en-US")
      : startOfMonth(start.add({ months: direction }));

  const nextEnd =
    mode.value === "week"
      ? endOfWeek(nextStart, "en-US")
      : endOfMonth(nextStart);

  applyRange(buildRange(nextStart, nextEnd));
};

const goPrevious = () => shiftRange(-1);

const goNext = () => {
  if (isNextDisabled.value) return;
  shiftRange(1);
};

const goToCurrent = () => applyRange(currentRange.value);

const switchMode = (next: RangeMode) => {
  if (mode.value === next) return;
  mode.value = next;
  applyRange(currentRange.value);
};

const isCurrentPeriod = computed(
  () =>
    selected.value.start.getTime() === currentRange.value.start.getTime() &&
    selected.value.end.getTime() === currentRange.value.end.getTime(),
);

const isNextDisabled = computed(() => {
  const referenceEnd =
    mode.value === "week"
      ? endOfWeek(today(timeZone), "en-US")
      : endOfMonth(today(timeZone));

  return toCalendarDate(selected.value.end).compare(referenceEnd) >= 0;
});

const formattedRange = computed(
  () =>
    `${formatter.format(selected.value.start)} - ${formatter.format(selected.value.end)}`,
);
</script>

<template>
  <UFormField required>
    <div class="flex gap-2 max-w-150">
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="outline"
        size="md"
        @click="goPrevious"
      />

      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-calendar-range"
        class="flex-1"
      >
        {{ formattedRange }}
      </UButton>

      <UButton
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="outline"
        size="md"
        :disabled="isNextDisabled"
        @click="goNext"
      />

      <UButton
        label="Today"
        color="primary"
        variant="soft"
        :active="!isCurrentPeriod"
        active-variant="solid"
        active-color="primary"
        size="md"
        class="transition-colors"
        :disabled="isCurrentPeriod"
        @click="goToCurrent"
      />

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
