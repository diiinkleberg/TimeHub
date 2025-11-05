import { defineStore } from "pinia";
import { whenever } from "@vueuse/core";

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

export const usePreferencesStore = defineStore(
  "preferences",
  () => {
    const primaryColor = ref<ThemeColor>("green");
    const neutralColor = ref<NeutralColor>("zinc");
    const cookieConsent = ref<boolean | null>(null);
    const cookieConsentDate = ref<string | null>(null);

    // ===== Getters =====
    const isDefaultTheme = computed(
      () => primaryColor.value === "green" && neutralColor.value === "zinc",
    );

    const shouldShowCookieBanner = computed(() => cookieConsent.value === null);
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

    function resetColors() {
      setPrimaryColor("green");
      setNeutralColor("zinc");
    }

    function acceptCookies() {
      cookieConsent.value = true;
      cookieConsentDate.value = new Date().toISOString();
    }

    function resetCookieConsent() {
      cookieConsent.value = null;
      cookieConsentDate.value = null;
    }

    function initializeAppConfig() {
      appConfig.ui.colors.primary = primaryColor.value;
      appConfig.ui.colors.neutral = neutralColor.value;
    }

    whenever(
      () => primaryColor.value,
      (color) => {
        appConfig.ui.colors.primary = color;
      },
    );

    whenever(
      () => neutralColor.value,
      (color) => {
        appConfig.ui.colors.neutral = color;
      },
    );

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
