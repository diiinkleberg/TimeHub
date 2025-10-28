// stores/preferences.ts
import { defineStore } from 'pinia'

/**
 * Available color palettes
 * Centralized to ensure consistency across the app
 */
export const THEME_COLORS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose'
] as const

export const NEUTRAL_COLORS = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone'
] as const

export type ThemeColor = (typeof THEME_COLORS)[number]
export type NeutralColor = (typeof NEUTRAL_COLORS)[number]

/**
 * Preferences Store
 *
 * Manages user theme preferences with automatic cookie persistence.
 *
 * Why Pinia Store?
 * ✅ Global singleton - One instance shared across entire app
 * ✅ DevTools - Debug state changes in Vue DevTools
 * ✅ Persistence - Built-in plugin for cookie storage
 * ✅ Reactivity - Changes trigger UI updates automatically
 * ✅ Type Safety - Full TypeScript support
 * ✅ SSR-Safe - Works on server and client
 *
 * Why NOT a composable?
 * ❌ Composables create new instances per call
 * ❌ No centralized state management
 * ❌ No DevTools integration
 * ❌ Manual persistence implementation needed
 *
 * Architecture:
 * 1. Store persists to cookies automatically (Nuxt module default)
 * 2. On app mount, store syncs to Nuxt UI appConfig
 * 3. Actions update both store (persistence) and appConfig (UI)
 * 4. Changes are reactive across all components
 *
 * Persistence (via pinia-plugin-persistedstate/nuxt):
 * ✅ cookies as storage (SSR-friendly)
 * ✅ store.$id as cookie name ("preferences")
 * ✅ JSON.stringify/destr for serialization
 * ✅ Whole state persisted automatically
 * ✅ Survives logout (separate from auth session)
 */
export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    /**
     * Primary theme color
     * Default: green (matches Nuxt UI default)
     */
    primaryColor: 'green' as ThemeColor,

    /**
     * Neutral theme color
     * Default: slate
     */
    neutralColor: 'slate' as NeutralColor
  }),

  getters: {
    /**
     * Check if using default theme colors
     */
    isDefaultTheme: state =>
      state.primaryColor === 'green' && state.neutralColor === 'slate'
  },

  actions: {
    /**
     * Update primary color
     * Updates both store (persisted) and appConfig (runtime UI)
     *
     * Why sync with appConfig?
     * - Nuxt UI reads colors from appConfig at runtime
     * - Direct appConfig update = immediate visual change
     * - Store update = persistence across sessions
     *
     * @param color - Color from THEME_COLORS palette
     */
    setPrimaryColor(color: ThemeColor) {
      this.primaryColor = color

      // ✅ Sync with Nuxt UI for immediate visual update
      const appConfig = useAppConfig()
      appConfig.ui.colors.primary = color
    },

    /**
     * Update neutral color
     * Same strategy as primary color
     *
     * @param color - Color from NEUTRAL_COLORS palette
     */
    setNeutralColor(color: NeutralColor) {
      this.neutralColor = color

      // ✅ Sync with Nuxt UI for immediate visual update
      const appConfig = useAppConfig()
      appConfig.ui.colors.neutral = color
    },

    /**
     * Reset all colors to defaults
     * Useful for "Reset Theme" button
     */
    resetColors() {
      this.setPrimaryColor('green')
      this.setNeutralColor('slate')
    },

    /**
     * Initialize Nuxt UI appConfig from persisted store values
     *
     * Call this ONCE on app mount in app.vue
     *
     * Why needed?
     * 1. Pinia persistence loads store from cookies
     * 2. But Nuxt UI appConfig doesn't know about store
     * 3. This syncs persisted colors → appConfig → UI
     * 4. Prevents flash of default colors (FOUC)
     *
     * Flow:
     * App loads → Pinia loads from cookie → this syncs → UI renders correctly
     */
    initializeAppConfig() {
      const appConfig = useAppConfig()
      appConfig.ui.colors.primary = this.primaryColor
      appConfig.ui.colors.neutral = this.neutralColor
    }
  },

  /**
   * Enable automatic cookie persistence
   *
   * With Nuxt module, persist: true is enough!
   * Defaults from pinia-plugin-persistedstate/nuxt:
   * - Storage: cookies (SSR-safe)
   * - Key: store.$id ("preferences")
   * - Serializer: JSON.stringify/destr
   * - Cookie options: Secure defaults
   */
  persist: true
})
