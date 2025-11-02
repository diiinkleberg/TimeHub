<script setup lang="ts">
// components/auth/UserMenu.vue
import type { DropdownMenuItem } from '@nuxt/ui'
import { THEME_COLORS, NEUTRAL_COLORS } from '~/stores/preferences'

defineProps<{
  collapsed?: boolean
}>()

const { user, signOut } = await useAuth()
const preferencesStore = usePreferencesStore()
const colorMode = useColorMode()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: user.value?.name || 'User',
      avatar: user.value?.image ? { src: user.value.image } : undefined
    }
  ],
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user'
    }
  ],
  [
    {
      label: 'Theme',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Primary',
          content: {
            align: 'center',
            collisionPadding: 16
          },
          children: THEME_COLORS.map(color => ({
            label: color,
            checked: preferencesStore.primaryColor === color,
            type: 'checkbox',
            onSelect: (e) => {
              e.preventDefault()
              preferencesStore.setPrimaryColor(color)
            }
          }))
        },
        {
          label: 'Neutral',
          slot: 'chip',
          chip:
            preferencesStore.neutralColor === 'neutral'
              ? 'old-neutral'
              : preferencesStore.neutralColor,
          content: {
            align: 'end',
            collisionPadding: 16
          },
          children: NEUTRAL_COLORS.map(color => ({
            label: color,
            type: 'checkbox',
            checked: preferencesStore.neutralColor === color,
            onSelect: (e) => {
              e.preventDefault()
              preferencesStore.setNeutralColor(color)
            }
          }))
        }
      ]
    },
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'light'
          }
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        }
      ]
    }
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      onSelect: async () => {
        await signOut()
      }
    }
  ]
])
</script>

<template>
  <div
    v-if="!user"
    class="p-3"
  >
    <USkeleton class="h-8 w-full rounded" />
  </div>

  <UDropdownMenu
    v-else
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'
    }"
  >
    <UButton
      v-bind="{
        label: collapsed ? undefined : user?.firstName || user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    >
      <template #leading>
        <UAvatar
          v-if="user?.image"
          :src="user.image"
          :alt="user?.name || 'User Avatar'"
          size="sm"
          rounded="full"
        />
      </template>
    </UButton>
    <template #item-leading="{ item }">
      <span
        v-if="(item as any).slot === 'chip'"
        :style="{
          '--chip-light': `var(--color-${(item as any).chip}-500)`,
          '--chip-dark': `var(--color-${(item as any).chip}-400)`
        }"
        class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)"
      />
    </template>
  </UDropdownMenu>
</template>
