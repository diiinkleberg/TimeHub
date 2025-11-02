import { defineStore } from "pinia";
import { whenever } from "@vueuse/core";

/**
 * Available color palettes
 * Centralized to ensure consistency across the app
 */
export const THEME_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export const NEUTRAL_COLORS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];
export type NeutralColor = (typeof NEUTRAL_COLORS)[number];

/**
 * Preferences Store
 *
 * Manages user theme preferences and cookie consent with automatic persistence.
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
 * Cookies Used (All First-Party):
 * 1. preferences - Theme colors & consent (this store)
 * 2. th.session - Auth session token (Better Auth)
 * 3. th.session.token - Session JWT (Better Auth)
 *
 * No Third-Party Cookies:
 * ❌ DiceBear avatars are URL-based (no cookies)
 * ❌ No analytics/tracking cookies
 * ❌ No advertising cookies
 *
 * Persistence (via pinia-plugin-persistedstate/nuxt):
 * ✅ cookies as storage (SSR-friendly)
 * ✅ store.$id as cookie name ("preferences")
 * ✅ JSON.stringify/destr for serialization
 * ✅ Whole state persisted automatically
 * ✅ Survives logout (separate from auth session)
 */
export const usePreferencesStore = defineStore(
  "preferences",
  () => {
    // ===== State =====

    /**
     * Primary theme color
     * Default: green (matches Nuxt UI default)
     */
    const primaryColor = ref<ThemeColor>("green");

    /**
     * Neutral theme color
     * Default: slate
     */
    const neutralColor = ref<NeutralColor>("slate");

    /**
     * Cookie consent status
     * null = not asked yet (show banner)
     * true = accepted
     * false = declined (but we still need essential cookies for auth)
     */
    const cookieConsent = ref<boolean | null>(null);

    /**
     * Timestamp when consent was given/declined
     */
    const cookieConsentDate = ref<string | null>(null);

    // ===== Getters =====

    /**
     * Check if using default theme colors
     */
    const isDefaultTheme = computed(
      () => primaryColor.value === "green" && neutralColor.value === "slate",
    );

    /**
     * Check if we should show the cookie banner
     */
    const shouldShowCookieBanner = computed(() => cookieConsent.value === null);

    /**
     * Check if cookies are accepted
     */
    const areCookiesAccepted = computed(() => cookieConsent.value === true);

    // ===== Actions =====

    const appConfig = useAppConfig();

    /**
     * Update primary color
     * Updates both store (persisted) and appConfig (runtime UI)
     *
     * @param color - Color from THEME_COLORS palette
     */
    function setPrimaryColor(color: ThemeColor) {
      primaryColor.value = color;
    }

    /**
     * Update neutral color
     * @param color - Color from NEUTRAL_COLORS palette
     */
    function setNeutralColor(color: NeutralColor) {
      neutralColor.value = color;
    }

    /**
     * Reset all colors to defaults
     * Useful for "Reset Theme" button
     */
    function resetColors() {
      setPrimaryColor("green");
      setNeutralColor("slate");
    }

    /**
     * Accept cookie usage
     */
    function acceptCookies() {
      cookieConsent.value = true;
      cookieConsentDate.value = new Date().toISOString();
    }

    /**
     * Reset cookie consent (for testing or user request)
     */
    function resetCookieConsent() {
      cookieConsent.value = null;
      cookieConsentDate.value = null;
    }

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
     */
    function initializeAppConfig() {
      appConfig.ui.colors.primary = primaryColor.value;
      appConfig.ui.colors.neutral = neutralColor.value;
    }

    // ===== Watchers (VueUse) =====

    /**
     * Auto-sync primary color to appConfig
     * Triggers whenever primaryColor changes
     */
    whenever(
      () => primaryColor.value,
      (color) => {
        appConfig.ui.colors.primary = color;
      },
    );

    /**
     * Auto-sync neutral color to appConfig
     * Triggers whenever neutralColor changes
     */
    whenever(
      () => neutralColor.value,
      (color) => {
        appConfig.ui.colors.neutral = color;
      },
    );

    // ===== Return =====

    return {
      // State
      primaryColor,
      neutralColor,
      cookieConsent,
      cookieConsentDate,

      // Getters
      isDefaultTheme,
      shouldShowCookieBanner,
      areCookiesAccepted,

      // Actions
      setPrimaryColor,
      setNeutralColor,
      resetColors,
      acceptCookies,
      resetCookieConsent,
      initializeAppConfig,
    };
  },
  {
    /**
     * Enable automatic cookie persistence
     */
    persist: true,
  },
);
