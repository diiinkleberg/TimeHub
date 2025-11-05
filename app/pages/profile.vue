<script setup lang="ts">
const { user, listAccounts } = await useAuth();

const accounts = await listAccounts();
const isGIthubLinked = computed(() =>
  accounts.data?.some((acc) => acc.providerId === "github"),
);
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
      <div class="space-y-8">
        <UCard>
          <div
            class="flex flex-col md:flex-row gap-6 items-start md:items-center"
          >
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

            <div class="flex-1 space-y-2">
              <h1 class="text-3xl font-bold">
                {{ user?.name }}
              </h1>

              <div class="flex flex-wrap gap-4 text-sm text-muted">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-mail" />
                  <span>{{ user?.email }}</span>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <UBadge color="success" variant="soft">
                  <template #leading>
                    <span class="size-2 rounded-full bg-success" />
                  </template>
                  Active
                </UBadge>

                <UBadge color="primary" variant="outline"> Planio User </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Account Information -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-info" class="size-5" />
              <h3 class="text-lg font-semibold">Account Information</h3>
            </div>
          </template>

          <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted">User ID</dt>
              <dd class="text-sm font-mono">
                {{ user?.id }}
              </dd>
            </div>

            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted">Email Verified</dt>
              <dd>
                <UBadge
                  :color="user?.emailVerified ? 'success' : 'warning'"
                  variant="soft"
                >
                  {{ user?.emailVerified ? "Verified" : "Not Verified" }}
                </UBadge>
              </dd>
            </div>

            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted">Account Created</dt>
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
              <dt class="text-sm font-medium text-muted">Github Linked</dt>
              <dd class="text-sm">
                {{
                  isGIthubLinked ? "Yes" : "No"
                }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
