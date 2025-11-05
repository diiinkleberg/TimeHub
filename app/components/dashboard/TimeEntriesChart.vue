<script setup lang="ts">
import {
  VisXYContainer,
  VisStackedBar,
  VisAxis,
  VisTooltip,
} from "@unovis/vue";
import { StackedBar } from "@unovis/ts"; // ✅ Add this import
import type { PlanioTimeEntry } from "#shared/schemas/planio/time-entry";
import type { Range } from "~/types";

interface Props {
  dateRange: Range;
}

const props = defineProps<Props>();

// ✅ Format dates for API (YYYY-MM-DD)
const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// ✅ Fetch time entries for the selected range
const {
  data: timeEntries,
  pending,
  error,
} = useFetch<PlanioTimeEntry[]>("/api/planio/time-entries", {
  query: computed(() => ({
    from: formatDate(props.dateRange.start),
    to: formatDate(props.dateRange.end),
    limit: 100,
  })),
  watch: [() => props.dateRange],
  server: false,
  default: () => [],
});

// ✅ Group entries by date and project
interface ChartData {
  date: Date;
  dateLabel: string;
  [projectName: string]: number | Date | string;
}

const chartData = computed<ChartData[]>(() => {
  if (!timeEntries.value.length) return [];

  // Group by date
  const grouped = new Map<string, Map<string, number>>();

  timeEntries.value.forEach((entry) => {
    const date = entry.spent_on;
    const projectName = entry.project.name;
    const hours = entry.hours;

    if (!grouped.has(date)) {
      grouped.set(date, new Map());
    }

    const dateMap = grouped.get(date)!;
    dateMap.set(projectName, (dateMap.get(projectName) || 0) + hours);
  });

  // Convert to chart format
  return Array.from(grouped.entries())
    .map(([date, projects]) => {
      const record: ChartData = {
        date: new Date(date),
        dateLabel: new Date(date).toLocaleDateString("de-DE", {
          month: "short",
          day: "numeric",
        }),
      };

      projects.forEach((hours, projectName) => {
        record[projectName] = hours;
      });

      return record;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

// ✅ Get unique project names for stacking
const projectNames = computed(() => {
  const names = new Set<string>();
  chartData.value.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (key !== "date" && key !== "dateLabel") {
        names.add(key);
      }
    });
  });
  return Array.from(names);
});

// ✅ Accessors
const x = (d: ChartData) => d.date.getTime();
const y = computed(() =>
  projectNames.value.map((name) => (d: ChartData) => (d[name] as number) || 0),
);

// ✅ Color palette
const colors = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ef4444", // red
];

const color = (_: ChartData, i: number) => colors[i % colors.length];

// ✅ Tooltip template
const tooltipTemplate = (d: ChartData) => {
  const projectEntries = projectNames.value
    .filter((name) => (d[name] as number) > 0)
    .map(
      (name) => `
      <div class="flex justify-between gap-4">
        <span>${name}:</span>
        <strong>${(d[name] as number).toFixed(2)}h</strong>
      </div>
    `,
    )
    .join("");

  const total = projectNames.value.reduce(
    (sum, name) => sum + ((d[name] as number) || 0),
    0,
  );

  return `
    <div class="p-3 bg-elevated border border-default rounded-lg shadow-lg min-w-[200px]">
      <div class="font-bold mb-2 text-highlighted">${d.dateLabel}</div>
      ${projectEntries}
      <div class="border-t border-default mt-2 pt-2 flex justify-between gap-4">
        <span>Total:</span>
        <strong class="text-primary">${total.toFixed(2)}h</strong>
      </div>
    </div>
  `;
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
      <span class="ml-3 text-muted">Loading time entries...</span>
    </div>

    <div
      v-else-if="error"
      class="text-center py-12 text-red-400 bg-red-900/20 rounded-lg border border-red-800"
    >
      Failed to load time entries
    </div>

    <div v-else-if="!chartData.length" class="text-center py-12 text-muted">
      <UIcon
        name="i-lucide-calendar-x"
        class="size-12 mx-auto mb-3 opacity-50"
      />
      <p>No time entries found for this period</p>
    </div>

    <div v-else class="w-full h-96">
      <VisXYContainer
        :data="chartData"
        :height="384"
        :margin="{ top: 20, right: 20, bottom: 40, left: 60 }"
      >
        <VisStackedBar
          :x="x"
          :y="y"
          :color="color"
          :rounded-corners="4"
          :bar-padding="0.2"
        />

        <VisAxis
          type="x"
          :tick-format="
            (value: number) =>
              new Date(value).toLocaleDateString('de-DE', {
                month: 'short',
                day: 'numeric',
              })
          "
        />

        <VisAxis
          type="y"
          label="Hours"
          :tick-format="(value: number) => `${value}h`"
        />

        <VisTooltip
          :triggers="{
            [StackedBar.selectors.bar]: tooltipTemplate,
          }"
        />
      </VisXYContainer>
    </div>

    <!-- Legend -->
    <div v-if="projectNames.length" class="flex flex-wrap gap-3 justify-center">
      <div
        v-for="(name, i) in projectNames"
        :key="name"
        class="flex items-center gap-2 text-sm"
      >
        <div
          class="size-3 rounded-sm"
          :style="{ backgroundColor: colors[i % colors.length] }"
        />
        <span class="text-default">{{ name }}</span>
      </div>
    </div>
  </div>
</template>

<style>
.vis-xy-container {
  --vis-stacked-bar-cursor: pointer;
  --vis-axis-tick-color: rgb(var(--color-muted));
  --vis-axis-grid-color: rgb(var(--color-default) / 0.1);
  --vis-axis-tick-label-color: rgb(var(--color-muted));
  --vis-axis-label-color: rgb(var(--color-highlighted));
}

.vis-dark-theme .vis-xy-container {
  --vis-axis-tick-color: rgb(var(--color-muted));
  --vis-axis-grid-color: rgb(var(--color-default) / 0.1);
}
</style>
