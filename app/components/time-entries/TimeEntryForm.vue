<script setup lang="ts">
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import type { SimpleProject } from "#shared/types/planio";
import { CalendarDate } from "@internationalized/date";

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

// Use form store for persistence
const formStore = useTimeEntryFormStore();

const selectedProject = ref<SimpleProject | null>(formStore.selectedProject);
const selectedIssue = ref<PlanioIssue | null>(formStore.selectedIssue);
const hours = ref(formStore.hours);
const comments = ref(formStore.comments);
const isEnhancing = ref(false);
const isSettingFromIssue = ref(false);

// Initialize date from store or default to today
formStore.initializeDefaults();
const spentOn = shallowRef(
  formStore.spentOn
    ? new CalendarDate(
        formStore.spentOn.year,
        formStore.spentOn.month,
        formStore.spentOn.day,
      )
    : new CalendarDate(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate(),
      ),
);

// Sync form values to store
watch(selectedProject, (value) => formStore.setProject(value));
watch(selectedIssue, (value) => formStore.setIssue(value));
watch(hours, (value) => formStore.setHours(value));
watch(comments, (value) => formStore.setComments(value));
watch(spentOn, (value) =>
  formStore.setSpentOn({
    year: value.year,
    month: value.month,
    day: value.day,
  }),
);

watch(selectedIssue, (newIssue) => {
  if (newIssue?.project) {
    isSettingFromIssue.value = true;
    selectedProject.value = {
      id: newIssue.project.id,
      name: newIssue.project.name,
    } satisfies SimpleProject;

    nextTick(() => {
      isSettingFromIssue.value = false;
    });
  }
});

// Convert HH:MM to decimal hours
const hoursToDecimal = (timeStr: string): number => {
  const [hours = 0, minutes = 0] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

// Validation
const isValid = computed(() => {
  return (
    selectedIssue.value &&
    hoursToDecimal(hours.value) > 0 &&
    hoursToDecimal(hours.value) <= 12 &&
    comments.value.trim().length > 0 &&
    spentOn.value
  );
});

const submitting = ref(false);
const toast = useToast();

const handleSubmit = async () => {
  if (!isValid.value) return;

  submitting.value = true;

  try {
    const formattedDate = `${spentOn.value.year}-${String(spentOn.value.month).padStart(2, "0")}-${String(spentOn.value.day).padStart(2, "0")}`;

    await $fetch("/api/planio/time-entries", {
      method: "POST",
      body: {
        issue_id: selectedIssue.value!.id,
        hours: hoursToDecimal(hours.value),
        comments: comments.value,
        spent_on: formattedDate,
      },
    });

    toast.add({
      title: "Time entry created",
      description: `Logged ${hours.value}h on #${selectedIssue.value!.id}`,
      color: "success",
    });

    // Reset form using store
    formStore.resetForm();
    selectedProject.value = null;
    selectedIssue.value = null;
    hours.value = "1:00";
    comments.value = "";
    const resetDate = new Date();
    spentOn.value = new CalendarDate(
      resetDate.getFullYear(),
      resetDate.getMonth() + 1,
      resetDate.getDate(),
    );

    emit("success");
  } catch (error: any) {
    console.error("Failed to create time entry:", error);
    toast.add({
      title: "Failed to create time entry",
      description: error?.data?.message || error?.message || "Please try again",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
};

const handleReset = () => {
  formStore.resetForm();
  selectedProject.value = null;
  selectedIssue.value = null;
  hours.value = "1:00";
  comments.value = "";
  const resetDate = new Date();
  spentOn.value = new CalendarDate(
    resetDate.getFullYear(),
    resetDate.getMonth() + 1,
    resetDate.getDate(),
  );

  toast.add({
    title: "Form reset",
    description: "All fields have been cleared",
    color: "neutral",
  });
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-clock" class="size-5 text-primary" />
        <h3 class="text-lg font-semibold">Log Time</h3>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlanioProjectSelector v-model="selectedProject" />
        <PlanioIssueSelector
          v-model="selectedIssue"
          :project-id="selectedProject?.id"
          :skip-reload="isSettingFromIssue"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeEntriesDatePicker v-model="spentOn" />

        <!-- Hours Input Component -->
        <TimeEntriesHoursInput v-model="hours" :issue="selectedIssue" />
      </div>

      <!-- Description Editor with AI Enhancement -->
      <TimeEntriesDescriptionEditor
        v-model="comments"
        :spent-on="new Date(spentOn.year, spentOn.month - 1, spentOn.day)"
        @enhancing="isEnhancing = $event"
      />

      <!-- Action Buttons -->
      <div class="flex flex-col gap-2">
        <UButton
          type="submit"
          label="Log Time Entry"
          icon="i-lucide-check"
          :loading="submitting"
          :disabled="!isValid || submitting || isEnhancing"
          size="lg"
          block
        />

        <!-- Reset Button -->
        <UButton
          type="button"
          label="Reset Form"
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="outline"
          :disabled="submitting || isEnhancing || !formStore.isDirty"
          size="md"
          block
          @click="handleReset"
        />

        <!-- Last Saved Indicator -->
        <div
          v-if="formStore.lastSaved"
          class="text-xs text-center text-muted mt-1"
        >
          Last saved {{ useTimeAgo(formStore.lastSaved).value }}
        </div>
      </div>
    </form>
  </UCard>
</template>
