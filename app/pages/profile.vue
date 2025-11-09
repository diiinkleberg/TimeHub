<script setup lang="ts">
import { useLinkedAccounts } from "~/composables/useLinkedAccounts";

const { user } = await useAuth();
const { isGithubLinked } = await useLinkedAccounts();
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile" icon="i-lucide-user">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <UAvatar
            v-if="user?.image"
            :src="user.image"
            :alt="user.name || 'User'"
            size="2xl"
            class="ring-4 ring-primary/20"
          />
          <UAvatar
            v-else
            :alt="user?.name || 'User'"
            size="2xl"
            class="ring-4 ring-primary/20"
          />

          <div class="flex-1 space-y-6">
            <div class="space-y-2">
              <h1 class="text-3xl font-bold text-highlighted">
                {{ user?.name || "Your Profile" }}
              </h1>
              <div class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-mail" />
                <span>{{ user?.email || "No email available" }}</span>
              </div>
            </div>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">
                  Account Created
                </dt>
                <dd class="text-sm">
                  {{
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("de-DE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"
                  }}
                </dd>
              </div>

              <div class="space-y-1">
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">
                  GitHub
                </dt>
                <dd>
                  <UBadge :color="isGithubLinked ? 'success' : 'warning'" variant="soft">
                    {{ isGithubLinked ? "Linked" : "Not linked" }}
                  </UBadge>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
