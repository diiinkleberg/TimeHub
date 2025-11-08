<script setup lang="ts">
import type { PlanioTimeEntry } from "#shared/schemas/planio/time-entry";
import { format } from "date-fns";

interface Props {
  entries: PlanioTimeEntry[];
  pending?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pending: false,
});

const config = useRuntimeConfig();
const planioBaseUrl = config.public.planioBaseUrl;

// Generate edit URL for time entries
const getEditUrl = (entryId: number) =>
  `${planioBaseUrl}/time_entries/${entryId}/edit`;

// Format date for display
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Recent Entries</h3>
        <UBadge variant="soft">{{ entries.length }} entries</UBadge>
      </div>
    </template>

    <div class="divide-y divide-default">
      <NuxtLink
        v-for="entry in entries.slice(0, 10)"
        :key="entry.id"
        :to="getEditUrl(entry.id)"
        target="_blank"
        class="flex items-center justify-between py-4 px-2 -mx-2 rounded-md hover:bg-elevated/50 transition-colors group"
      >
        <!-- Entry Details -->
        <div class="flex-1 min-w-0 flex items-start gap-3">
          <!-- Entry ID Badge -->
          <UBadge
            variant="soft"
            color="primary"
            size="md"
            class="shrink-0 mt-0.5"
          >
            #{{ entry.id }}
          </UBadge>

          <div class="flex-1 min-w-0 space-y-1.5">
            <!-- Description/Comments as main title -->
            <div
              class="font-medium text-base text-default group-hover:text-primary transition-colors line-clamp-2"
            >
              {{ entry.comments || "No description" }}
            </div>

            <!-- Issue Name & Project Info -->
            <div class="flex flex-col gap-1 text-sm">
              <!-- Issue Name (if available) -->
              <div
                v-if="entry.issue"
                class="flex items-center gap-1.5 text-muted"
              >
                <UIcon name="i-lucide-circle-dot" class="size-3.5" />
                <span class="truncate font-medium">
                  Issue: {{ entry.issue.subject || `#${entry.issue.id}` }}
                </span>
              </div>

              <!-- Project & Date -->
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-folder" class="size-3.5" />
                <span class="truncate">{{ entry.project.name }}</span>
                <span class="text-muted/50">•</span>
                <UIcon name="i-lucide-calendar" class="size-3.5" />
                <span>{{ formatDate(entry.spent_on) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hours & Activity -->
        <div class="flex items-center gap-3 shrink-0 ml-4">
          <div class="text-right">
            <div class="font-bold text-xl text-primary font-mono">
              {{ entry.hours }}h
            </div>
            <div v-if="entry.activity" class="text-xs text-muted mt-0.5">
              {{ entry.activity.name }}
            </div>
          </div>
          <UIcon
            name="i-lucide-external-link"
            class="size-4 text-muted group-hover:text-primary transition-colors"
          />
        </div>
      </NuxtLink>
    </div>

    <template v-if="entries.length > 10" #footer>
      <div class="text-center text-sm text-muted">
        Showing 10 of {{ entries.length }} entries
      </div>
    </template>
  </UCard>
</template>
