<script setup lang="ts">
import type { PlanioProject } from "#shared/schemas/planio/project";
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import { format } from "date-fns";

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

// ✅ Form state
const selectedProject = ref<PlanioProject | null>(null);
const selectedIssue = ref<PlanioIssue | null>(null);
const hours = ref<number>(1);
const comments = ref("");
const spentOn = ref(format(new Date(), "yyyy-MM-dd"));

// ✅ Form validation
const isValid = computed(() => {
  return (
    selectedProject.value &&
    selectedIssue.value &&
    hours.value > 0 &&
    hours.value <= 24 &&
    comments.value.trim().length > 0 &&
    spentOn.value
  );
});

// ✅ Submit handler (will implement POST route next)
const submitting = ref(false);
const toast = useToast();

const handleSubmit = async () => {
  if (!isValid.value) return;

  submitting.value = true;

  try {
    await $fetch("/api/planio/time-entries", {
      method: "POST",
      body: {
        issue_id: selectedIssue.value!.id,
        hours: hours.value,
        comments: comments.value,
        spent_on: spentOn.value,
      },
    });

    toast.add({
      title: "Time entry created",
      description: `Logged ${hours.value}h on ${selectedIssue.value!.subject}`,
      color: "success",
    });

    // Reset form
    selectedProject.value = null;
    selectedIssue.value = null;
    hours.value = 1;
    comments.value = "";
    spentOn.value = format(new Date(), "yyyy-MM-dd");

    emit("success");
  } catch (error) {
    toast.add({
      title: "Failed to create time entry",
      description: "Please try again",
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
      <h3 class="text-lg font-semibold">Log Time</h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Project Selector -->
      <PlanioProjectSelector v-model="selectedProject" />

      <!-- Issue Selector -->
      <PlanioIssueSelector
        v-model="selectedIssue"
        :project-id="selectedProject?.id"
      />

      <!-- Date -->
      <UFormField label="Date" required>
        <UInput
          v-model="spentOn"
          type="date"
          icon="i-lucide-calendar"
          :max="format(new Date(), 'yyyy-MM-dd')"
        />
      </UFormField>

      <!-- Hours -->
      <UFormField label="Hours" required>
        <UInput
          v-model.number="hours"
          type="number"
          step="0.25"
          min="0.25"
          max="24"
          icon="i-lucide-clock"
          placeholder="1.5"
        />
      </UFormField>

      <!-- Comments -->
      <UFormField label="Description" required>
        <UTextarea
          v-model="comments"
          rows="4"
          placeholder="What did you work on?"
        />
      </UFormField>

      <!-- Submit -->
      <UButton
        type="submit"
        label="Log Time"
        icon="i-lucide-check"
        :loading="submitting"
        :disabled="!isValid || submitting"
        block
      />
    </form>
  </UCard>
</template>