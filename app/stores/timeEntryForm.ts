import { defineStore } from "pinia";
import type { PlanioIssue } from "#shared/schemas/planio/issue";
import type { SimpleProject } from "#shared/types/planio";
import { CalendarDate } from "@internationalized/date";

export const useTimeEntryFormStore = defineStore(
  "timeEntryForm",
  () => {
    // Form state
    const selectedProject = ref<SimpleProject | null>(null);
    const selectedIssue = ref<PlanioIssue | null>(null);
    const hours = ref("1:00");
    const comments = ref("");
    const spentOn = ref<{
      year: number;
      month: number;
      day: number;
    } | null>(null);

    // Metadata
    const lastSaved = ref<string | null>(null);
    const isDirty = computed(() => {
      return !!(
        selectedProject.value ||
        selectedIssue.value ||
        hours.value !== "1:00" ||
        comments.value ||
        spentOn.value
      );
    });

    // Actions
    function setProject(project: SimpleProject | null) {
      selectedProject.value = project;
      updateLastSaved();
    }

    function setIssue(issue: PlanioIssue | null) {
      selectedIssue.value = issue;
      updateLastSaved();
    }

    function setHours(value: string) {
      hours.value = value;
      updateLastSaved();
    }

    function setComments(value: string) {
      comments.value = value;
      updateLastSaved();
    }

    function setSpentOn(date: { year: number; month: number; day: number }) {
      spentOn.value = date;
      updateLastSaved();
    }

    function updateLastSaved() {
      lastSaved.value = new Date().toISOString();
    }

    function resetForm() {
      selectedProject.value = null;
      selectedIssue.value = null;
      hours.value = "1:00";
      comments.value = "";

      // Reset to today
      const now = new Date();
      spentOn.value = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };

      lastSaved.value = null;
    }

    function initializeDefaults() {
      if (!spentOn.value) {
        const now = new Date();
        spentOn.value = {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        };
      }
    }

    return {
      // State
      selectedProject,
      selectedIssue,
      hours,
      comments,
      spentOn,
      lastSaved,

      // Getters
      isDirty,

      // Actions
      setProject,
      setIssue,
      setHours,
      setComments,
      setSpentOn,
      resetForm,
      initializeDefaults,
    };
  },
  {
    persist: true,
  },
);
