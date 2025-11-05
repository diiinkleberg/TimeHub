<script setup lang="ts">
import type { PlanioProject } from "#shared/schemas/planio/project";
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

const selectedProject = ref<PlanioProject | null>(null);
const selectedIssue = ref<PlanioIssue | null>(null);
const hours = ref("1:00"); // Changed to string for HH:MM format
const comments = ref("");
const isEnhancing = ref(false);

// Flag to prevent project filter reload when setting from issue
const isSettingFromIssue = ref(false);

// Use shallowRef for CalendarDate (official Nuxt UI pattern)
const now = new Date();
const spentOn = shallowRef(
  new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate()),
);

// Watch for issue selection and automatically set the project
watch(selectedIssue, (newIssue) => {
  if (newIssue?.project) {
    isSettingFromIssue.value = true; // Set flag
    const issueProject = newIssue.project;
    selectedProject.value = {
      id: issueProject.id,
      name: issueProject.name,
      identifier: `project-${issueProject.id}`,
      description: "",
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
    } as PlanioProject;

    // Reset flag after a tick
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

    // Reset form
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
        @enhancing="isEnhancing = $event"
      />

      <!-- Submit Button -->
      <UButton
        type="submit"
        label="Log Time Entry"
        icon="i-lucide-check"
        :loading="submitting"
        :disabled="!isValid || submitting || isEnhancing"
        size="lg"
        block
      />
    </form>
  </UCard>
</template>
