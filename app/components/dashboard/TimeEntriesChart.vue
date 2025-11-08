<script setup lang="ts">
import {
  VisXYContainer,
  VisStackedBar,
  VisAxis,
  VisTooltip,
} from "@unovis/vue";
import { StackedBar } from "@unovis/ts";
import type { PlanioTimeEntry } from "#shared/schemas/planio/time-entry";
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import type { Range } from "~/types";

interface Props {
  dateRange: Range;
}

const props = defineProps<Props>();

const formatDate = (date: Date) => date.toISOString().split("T")[0];

// 📥 Step 1: Fetch time entries
const {
  data: timeEntries,
  pending: entriesPending,
  error: entriesError,
  refresh: refreshEntries,
} = useFetch<PlanioTimeEntry[]>("/api/planio/time-entries", {
  query: computed(() => ({
    from: formatDate(props.dateRange.start),
    to: formatDate(props.dateRange.end),
    limit: 100,
  })),
  watch: [() => props.dateRange],
  server: false,
  lazy: true,
  default: () => [],
});

// 🔍 Step 2: Extract unique issue IDs from time entries
const issueIds = computed(() => {
  const ids = new Set<number>();
  timeEntries.value?.forEach((entry) => {
    if (entry.issue?.id) {
      ids.add(entry.issue.id);
    }
  });
  const result = Array.from(ids);
  console.log("🔍 Extracted Issue IDs:", result);
  return result;
});

// 📥 Step 3: Fetch full issue details for those IDs
const {
  data: issues,
  pending: issuesPending,
  error: issuesError,
} = useFetch<PlanioIssue[]>("/api/planio/issues", {
  query: computed(() => ({
    issue_id: issueIds.value.join(","), // Pass comma-separated IDs
    limit: 100,
  })),
  watch: [issueIds],
  server: false,
  lazy: true,
  default: () => [],
  // Only fetch when we have issue IDs
  immediate: false,
});

// 🗂️ Step 4: Create a lookup map for quick issue access
const issueMap = computed(() => {
  const map = new Map<number, PlanioIssue>();
  issues.value?.forEach((issue) => {
    map.set(issue.id, issue);
  });
  console.log("🗂️ Issue Map Created:", map.size, "issues");
  issues.value?.forEach((issue) => {
    console.log(`  Issue #${issue.id}: ${issue.subject}`);
  });
  return map;
});

// 🔄 Combined loading and error states
const pending = computed(() => entriesPending.value || issuesPending.value);
const error = computed(() => entriesError.value || issuesError.value);

// Auto-refresh when window regains focus
const focused = useWindowFocus();
watch(focused, (isFocused) => {
  if (isFocused) refreshEntries();
});

// 📦 Simplified data structure for the chart
interface DayData {
  date: string; // "2025-11-07"
  dateLabel: string; // "Thu, 07. Nov"
  [issueKey: string]: string | number; // Dynamic issue keys
}

// 📊 Step 5: Transform data into chart format
const chartData = computed<DayData[]>(() => {
  if (!timeEntries.value?.length) {
    console.log("⚠️ No time entries");
    return [];
  }

  console.log(`📊 Processing ${timeEntries.value.length} entries`);

  // Group entries by date, then by issue
  const dayGroups = new Map<string, Map<string, number>>();

  timeEntries.value.forEach((entry) => {
    const date = entry.spent_on;

    // Get full issue details from our lookup map
    const fullIssue = entry.issue?.id
      ? issueMap.value.get(entry.issue.id)
      : null;

    // Create issue key with subject from full issue data
    const issueKey = fullIssue
      ? `#${fullIssue.id}: ${fullIssue.subject}`
      : "No Issue";

    const hours = entry.hours;

    // Create date group if it doesn't exist
    if (!dayGroups.has(date)) {
      dayGroups.set(date, new Map());
    }

    // Add/sum hours for this issue on this date
    const issueGroupMap = dayGroups.get(date)!;
    issueGroupMap.set(issueKey, (issueGroupMap.get(issueKey) || 0) + hours);
  });

  // Convert Map to array of objects
  const chartArray = Array.from(dayGroups.entries()).map(
    ([dateStr, issueGroupMap]) => {
      const dateObj = new Date(dateStr);

      // Start with base properties
      const dayData: DayData = {
        date: dateStr,
        dateLabel: dateObj.toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }),
      };

      // Add each issue as a property
      issueGroupMap.forEach((hours, issueKey) => {
        dayData[issueKey] = hours;
      });

      return dayData;
    },
  );

  // Sort by date
  const sorted = chartArray.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  console.log("✅ Chart data created:", sorted.length, "dates");
  return sorted;
});

// 🏷️ Get all unique issues across all days
const allIssues = computed(() => {
  const issueSet = new Set<string>();

  timeEntries.value?.forEach((entry) => {
    // Get full issue from lookup map
    const fullIssue = entry.issue?.id
      ? issueMap.value.get(entry.issue.id)
      : null;

    if (fullIssue) {
      issueSet.add(`#${fullIssue.id}: ${fullIssue.subject}`);
    }
  });

  const issues = Array.from(issueSet).sort();
  console.log("🏷️ All Issues:", issues);
  return issues;
});

// 📍 Chart accessors (tell Unovis how to read the data)
const x = (_d: DayData, i: number) => i; // Use index as x position

const y = computed(() => {
  // Create an accessor function for each issue
  return allIssues.value.map((issueKey) => {
    return (d: DayData) => (d[issueKey] as number) || 0;
  });
});

// 🎨 Color palette
const colors = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
];

const color = (_: DayData, i: number) => colors[i % colors.length];

// 💬 Tooltip template
const tooltipTemplate = (d: DayData) => {
  const issueRows = allIssues.value
    .map((issueKey, i) => {
      const hours = (d[issueKey] as number) || 0;
      if (hours === 0) return null;

      const shortKey =
        issueKey.length > 45 ? issueKey.substring(0, 42) + "..." : issueKey;
      const color = colors[i % colors.length];

      return `
        <div class="flex items-center justify-between gap-4 py-1.5">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm" style="background-color: ${color}"></div>
            <span class="text-sm">${shortKey}</span>
          </div>
          <strong class="text-sm font-bold" style="color: ${color}">
            ${hours.toFixed(2)}h
          </strong>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  const total = allIssues.value.reduce(
    (sum, key) => sum + ((d[key] as number) || 0),
    0,
  );

  return `
    <div class="p-4 bg-gray-900 border border-blue-500/30 rounded-lg shadow-2xl min-w-[300px] max-w-[450px]">
      <div class="font-bold mb-3 text-gray-100 text-base border-b border-gray-700 pb-2">
        ${d.dateLabel}
      </div>
      <div class="space-y-1">${issueRows}</div>
      <div class="border-t border-gray-700 mt-3 pt-3 flex justify-between items-center">
        <span class="font-semibold text-gray-300">Total:</span>
        <strong class="text-blue-400 text-xl font-bold">${total.toFixed(2)}h</strong>
      </div>
    </div>
  `;
};

// 📅 Format x-axis labels
const xTickFormat = (value: number) => {
  const d = chartData.value[Math.round(value)];
  return d?.dateLabel || "";
};
</script>

<template>
  <div class="space-y-6">
    <!-- 🔄 Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
      <span class="ml-3 text-muted">Loading time entries...</span>
    </div>

    <!-- ❌ Error State -->
    <div
      v-else-if="error"
      class="text-center py-12 text-red-400 bg-red-900/20 rounded-lg border border-red-800"
    >
      <UIcon name="i-lucide-alert-circle" class="size-8 mx-auto mb-2" />
      <p>Failed to load time entries</p>
      <p class="text-sm mt-2">{{ error.message }}</p>
    </div>

    <!-- 📭 Empty State -->
    <div v-else-if="!chartData.length" class="text-center py-12 text-muted">
      <UIcon
        name="i-lucide-calendar-x"
        class="size-12 mx-auto mb-3 opacity-50"
      />
      <p class="text-lg font-medium">No time entries found for this period</p>
      <p class="text-sm mt-2">
        {{
          timeEntries?.length
            ? `Found ${timeEntries.length} entries but none have issue data`
            : "Start logging time to see your activity chart"
        }}
      </p>
    </div>

    <!-- 📊 Chart -->
    <div v-else class="space-y-6">
      <div class="bg-elevated/50 rounded-lg border border-default p-4">
        <VisXYContainer
          :data="chartData"
          :height="350"
          :margin="{ top: 10, right: 20, bottom: 60, left: 60 }"
        >
          <VisStackedBar
            :x="x"
            :y="y"
            :color="color"
            :rounded-corners="4"
            :bar-padding="0.3"
            :bar-max-width="90"
          />

          <VisAxis
            type="x"
            :num-ticks="chartData.length"
            :tick-format="xTickFormat"
            :grid-line="false"
            :tick-text-angle="-45"
          />

          <VisAxis
            type="y"
            label="Hours"
            :tick-format="(v: number) => `${v}h`"
            :grid-line="true"
          />

          <VisTooltip
            :triggers="{ [StackedBar.selectors.bar]: tooltipTemplate }"
          />
        </VisXYContainer>
      </div>

      <!-- 🏷️ Legend -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-layers" class="size-4 text-primary" />
            <h3 class="font-semibold text-highlighted">
              Issues ({{ allIssues.length }})
            </h3>
          </div>
        </template>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="(issue, i) in allIssues"
            :key="issue"
            class="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-elevated border border-default hover:border-primary/50 transition-colors"
          >
            <div
              class="size-3 rounded-sm"
              :style="{ backgroundColor: colors[i % colors.length] }"
            />
            <span class="text-default truncate max-w-[280px]" :title="issue">
              {{ issue }}
            </span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.vis-xy-container {
  --vis-stacked-bar-cursor: pointer;
  --vis-axis-tick-color: rgb(var(--color-muted));
  --vis-axis-grid-color: rgb(var(--color-default) / 0.1);
  --vis-axis-tick-label-color: rgb(var(--color-muted));
  --vis-axis-label-color: rgb(var(--color-highlighted));
  --vis-font-family: inherit;
}
</style>
