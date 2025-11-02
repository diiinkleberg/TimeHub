<script setup lang="ts">
import type { PlanioProject } from "#shared/schemas/planio/project";
import type { PlanioIssue } from "#shared/schemas/planio/issue";

const { user } = await useAuth();

// State
const selectedProject = ref<PlanioProject | null>(null);
const selectedIssue = ref<PlanioIssue | null>(null);

// Event handlers
const handleProjectSelected = (project: PlanioProject) => {
  console.log("✅ Project selected:", project);
};

const handleIssueSelected = (issue: PlanioIssue) => {
  console.log("✅ Issue selected:", issue);
};

// Watch for changes
watch(selectedProject, (newProject) => {
  console.log("📦 Selected project changed:", newProject);
});

watch(selectedIssue, (newIssue) => {
  console.log("🎯 Selected issue changed:", newIssue);
});
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <UPageHeader
          title="Planio Components Test"
          description="Test the ProjectSelector and IssueSelector components"
        />

        <UPageBody>
          <div class="space-y-8">
            <!-- Component Testing Section -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Component Test</h3>
              </template>

              <div class="space-y-6">
                <!-- Project Selector -->
                <PlanioProjectSelector
                  v-model="selectedProject"
                  @project-selected="handleProjectSelected"
                />

                <!-- Issue Selector -->
                <PlanioIssueSelector
                  v-model="selectedIssue"
                  :project-id="selectedProject?.id"
                  @issue-selected="handleIssueSelected"
                />
              </div>
            </UCard>

            <!-- Selected Values Display -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Selected Values</h3>
              </template>

              <div class="space-y-4">
                <!-- Selected Project -->
                <div>
                  <h4 class="text-sm font-medium mb-2">Selected Project:</h4>
                  <div
                    v-if="selectedProject"
                    class="p-4 bg-primary/5 rounded-lg"
                  >
                    <dl class="grid grid-cols-2 gap-2 text-sm">
                      <dt class="font-medium">ID:</dt>
                      <dd>{{ selectedProject.id }}</dd>

                      <dt class="font-medium">Name:</dt>
                      <dd>{{ selectedProject.name }}</dd>

                      <dt class="font-medium">Identifier:</dt>
                      <dd>{{ selectedProject.identifier }}</dd>

                      <dt class="font-medium">Description:</dt>
                      <dd class="col-span-2">
                        {{ selectedProject.description || "N/A" }}
                      </dd>
                    </dl>
                  </div>
                  <div
                    v-else
                    class="p-4 bg-muted/10 rounded-lg text-sm text-muted"
                  >
                    No project selected
                  </div>
                </div>

                <!-- Selected Issue -->
                <div>
                  <h4 class="text-sm font-medium mb-2">Selected Issue:</h4>
                  <div v-if="selectedIssue" class="p-4 bg-success/5 rounded-lg">
                    <dl class="grid grid-cols-2 gap-2 text-sm">
                      <dt class="font-medium">ID:</dt>
                      <dd>{{ selectedIssue.id }}</dd>

                      <dt class="font-medium">Subject:</dt>
                      <dd class="col-span-2">{{ selectedIssue.subject }}</dd>

                      <dt class="font-medium">Project:</dt>
                      <dd>{{ selectedIssue.project.name }}</dd>

                      <dt class="font-medium">Status:</dt>
                      <dd>{{ selectedIssue.status.name }}</dd>

                      <dt class="font-medium">Description:</dt>
                      <dd class="col-span-2">
                        {{ selectedIssue.description || "N/A" }}
                      </dd>
                    </dl>
                  </div>
                  <div
                    v-else
                    class="p-4 bg-muted/10 rounded-lg text-sm text-muted"
                  >
                    No issue selected
                  </div>
                </div>
              </div>
            </UCard>

            <!-- JSON Display (for debugging) -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Raw Data (Debug)</h3>
              </template>

              <div class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium mb-2">Project Object:</h4>
                  <pre
                    class="p-4 bg-black/5 dark:bg-white/5 rounded-lg text-xs overflow-auto"
                    >{{ JSON.stringify(selectedProject, null, 2) }}</pre
                  >
                </div>

                <div>
                  <h4 class="text-sm font-medium mb-2">Issue Object:</h4>
                  <pre
                    class="p-4 bg-black/5 dark:bg-white/5 rounded-lg text-xs overflow-auto"
                    >{{ JSON.stringify(selectedIssue, null, 2) }}</pre
                  >
                </div>
              </div>
            </UCard>

            <!-- Action Buttons -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Actions</h3>
              </template>

              <div class="flex gap-2">
                <UButton
                  label="Clear Project"
                  icon="i-lucide-x"
                  variant="outline"
                  :disabled="!selectedProject"
                  @click="selectedProject = null"
                />

                <UButton
                  label="Clear Issue"
                  icon="i-lucide-x"
                  variant="outline"
                  :disabled="!selectedIssue"
                  @click="selectedIssue = null"
                />

                <UButton
                  label="Clear Both"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="outline"
                  :disabled="!selectedProject && !selectedIssue"
                  @click="
                    () => {
                      selectedProject = null;
                      selectedIssue = null;
                    }
                  "
                />
              </div>
            </UCard>

            <!-- Console Log Instructions -->
            <UCard color="blue">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-info" class="size-5" />
                  <h3 class="text-lg font-semibold">Testing Instructions</h3>
                </div>
              </template>

              <div class="space-y-2 text-sm">
                <p>
                  ✅ Open your browser's developer console (F12) to see event
                  logs
                </p>
                <p>✅ Select a project and watch the console logs</p>
                <p>✅ Select an issue and watch the console logs</p>
                <p>✅ Clear selections using the buttons below</p>
                <p>✅ Try searching in the dropdowns</p>
                <p>
                  ✅ Test the clearable feature by clicking the X in the
                  dropdown
                </p>
              </div>
            </UCard>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>
