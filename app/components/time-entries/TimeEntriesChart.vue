<script setup lang="ts">
import { VisXYContainer, VisStackedBar, VisAxis, VisTooltip, VisCrosshair } from "@unovis/vue";
import { Position } from "@unovis/ts";
import type { PlanioTimeEntry } from "#shared/schemas/planio/time-entry";
import { format, parseISO } from "date-fns";

interface Props {
  timeEntries: PlanioTimeEntry[];
}

const props = defineProps<Props>();

// ✅ Group time entries by date and project
const chartData = computed(() => {
  const grouped = new Map<string, Map<string, number>>();

  props.timeEntries.forEach((entry) => {
    const date = entry.spent_on;
    const projectName = entry.project.name;
    const hours = entry.hours;

    if (!grouped.has(date)) {
      grouped.set(date, new Map());
    }

    const dateMap = grouped.get(date)!;
    dateMap.set(projectName, (dateMap.get(projectName) || 0) + hours);
  });

  // Convert to array format for Unovis
  return Array.from(grouped.entries()).map(([date, projects]) => ({
    date: parseISO(date),
    dateLabel: format(parseISO(date), "MMM dd"),
    ...Object.fromEntries(projects),
  }));
});

// ✅ Get unique project names for stacking
const projectNames = computed(() => {
  const names = new Set<string>();
  props.timeEntries.forEach((entry) => names.add(entry.project.name));
  return Array.from(names);
});

// ✅ Chart configuration
const height = 400;
const x = (d: any) => d.dateLabel;
const y = computed(() => projectNames.value.map((name) => (d: any) => d[name] || 0));

// ✅ Tooltip template
const tooltipTemplate = (d: any) => {
  const projectsHtml = projectNames.value
    .filter((name) => d[name] > 0)
    .map((name) => `<div><strong>${name}:</strong> ${d[name].toFixed(2)}h</div>`)
    .join("");

  const total = projectNames.value.reduce((sum, name) => sum + (d[name] || 0), 0);

  return `
    <div class="p-2">
      <div class="font-bold mb-2">${format(d.date, "MMMM dd, yyyy")}</div>
      ${projectsHtml}
      <div class="border-t mt-2 pt-2"><strong>Total:</strong> ${total.toFixed(2)}h</div>
    </div>
  `;
};
</script>

<template>
  <UCard v-if="timeEntries.length > 0">
    <template #header>
      <h3 class="text-lg font-semibold">Time Tracking Overview</h3>
    </template>

    <VisXYContainer :data="chartData" :height="height">
      <VisStackedBar :x="x" :y="y" />
      <VisCrosshair :template="tooltipTemplate" />
      <VisTooltip :verticalShift="height" :horizontalPlacement="Position.Center" />
      <VisAxis type="x" :tickFormat="(d: any) => d" />
      <VisAxis type="y" label="Hours" />
    </VisXYContainer>
  </UCard>

  <UCard v-else>
    <UEmpty
      icon="i-lucide-bar-chart-3"
      title="No data to display"
      description="Log some time entries to see your tracking overview"
    />
  </UCard>
</template>