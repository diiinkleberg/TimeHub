<!-- filepath: e:\Repos\TimeHub\app\pages\profile.vue -->
<script setup lang="ts">

const { user } = await useAuth()

// Stats (mock data for now - replace with real data later)
const stats = computed(() => [
  {
    label: 'Total Hours',
    value: '142.5',
    icon: 'i-lucide-clock',
    color: 'primary' as const
  },
  {
    label: 'This Week',
    value: '38.0',
    icon: 'i-lucide-calendar',
    color: 'success' as const
  },
  {
    label: 'Projects',
    value: '12',
    icon: 'i-lucide-briefcase',
    color: 'info' as const
  },
  {
    label: 'Commits',
    value: '247',
    icon: 'i-simple-icons-github',
    color: 'secondary' as const
  }
])
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <UPageBody>
          <div class="space-y-8">
            <!-- Profile Header -->
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

                <div class="flex-1 space-y-2">
                  <h1 class="text-3xl font-bold">
                    {{ user?.name }}
                  </h1>
                  
                  <div class="flex flex-wrap gap-4 text-sm text-muted">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-mail" />
                      <span>{{ user?.email }}</span>
                    </div>
                    
                    <div
                      v-if="user?.firstName && user?.lastName"
                      class="flex items-center gap-2"
                    >
                      <UIcon name="i-lucide-user" />
                      <span>{{ user.firstName }} {{ user.lastName }}</span>
                    </div>
                  </div>

                  <div class="flex gap-2 pt-2">
                    <UBadge
                      color="success"
                      variant="soft"
                    >
                      <template #leading>
                        <span class="size-2 rounded-full bg-success" />
                      </template>
                      Active
                    </UBadge>
                    
                    <UBadge
                      color="primary"
                      variant="outline"
                    >
                      Planio User
                    </UBadge>
                  </div>
                </div>

                <UButton
                  icon="i-lucide-settings"
                  color="neutral"
                  variant="outline"
                  to="/settings/general"
                >
                  Settings
                </UButton>
              </div>
            </UCard>

            <!-- Stats Grid -->
            <UPageGrid>
              <UPageCard
                v-for="stat in stats"
                :key="stat.label"
              >
                <template #icon>
                  <UIcon
                    :name="stat.icon"
                    class="size-6"
                  />
                </template>

                <template #title>
                  <div class="text-3xl font-bold">
                    {{ stat.value }}
                  </div>
                </template>

                <template #description>
                  <div class="text-sm text-muted">
                    {{ stat.label }}
                  </div>
                </template>
              </UPageCard>
            </UPageGrid>

            <!-- Account Information -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-info"
                    class="size-5"
                  />
                  <h3 class="text-lg font-semibold">
                    Account Information
                  </h3>
                </div>
              </template>

              <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <dt class="text-sm font-medium text-muted">
                    User ID
                  </dt>
                  <dd class="text-sm font-mono">
                    {{ user?.id }}
                  </dd>
                </div>

                <div class="space-y-1">
                  <dt class="text-sm font-medium text-muted">
                    Email Verified
                  </dt>
                  <dd>
                    <UBadge
                      :color="user?.emailVerified ? 'success' : 'warning'"
                      variant="soft"
                    >
                      {{ user?.emailVerified ? 'Verified' : 'Not Verified' }}
                    </UBadge>
                  </dd>
                </div>

                <div class="space-y-1">
                  <dt class="text-sm font-medium text-muted">
                    Account Created
                  </dt>
                  <dd class="text-sm">
                    {{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A' }}
                  </dd>
                </div>

                <div class="space-y-1">
                  <dt class="text-sm font-medium text-muted">
                    Last Updated
                  </dt>
                  <dd class="text-sm">
                    {{ user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A' }}
                  </dd>
                </div>
              </dl>
            </UCard>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>