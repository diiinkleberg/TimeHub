import { defineStore } from 'pinia'
import { watch } from 'vue'

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

const DEFAULT_PRIMARY_COLOR: ThemeColor = 'green'
const DEFAULT_NEUTRAL_COLOR: NeutralColor = 'zinc'

export const usePreferencesStore = defineStore(
  'preferences',
  () => {
    const primaryColor = ref<ThemeColor>(DEFAULT_PRIMARY_COLOR)
    const neutralColor = ref<NeutralColor>(DEFAULT_NEUTRAL_COLOR)
    const cookieConsent = ref<boolean | null>(null)
    const cookieConsentDate = ref<string | null>(null)
    const startingPage = ref<string>('dashboard')

    const isDefaultTheme = computed(
      () =>
        primaryColor.value === DEFAULT_PRIMARY_COLOR
        && neutralColor.value === DEFAULT_NEUTRAL_COLOR
    )

    const shouldShowCookieBanner = computed(() => cookieConsent.value === null)
    const areCookiesAccepted = computed(() => cookieConsent.value === true)

    const appConfig = useAppConfig()

    function setPrimaryColor(color: ThemeColor) {
      if (primaryColor.value === color) {
        return
      }

      primaryColor.value = color
    }

    function setNeutralColor(color: NeutralColor) {
      if (neutralColor.value === color) {
        return
      }

      neutralColor.value = color
    }

    function acceptCookies() {
      cookieConsent.value = true
      cookieConsentDate.value = new Date().toISOString()
    }

    const syncThemeColors = () => {
      appConfig.ui.colors.primary = primaryColor.value
      appConfig.ui.colors.neutral = neutralColor.value
    }

    function initializeAppConfig() {
      syncThemeColors()
    }

    watch([primaryColor, neutralColor], syncThemeColors, {
      immediate: true
    })



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
      acceptCookies,
      initializeAppConfig
    }
  },
  {
    persist: true
  }
)
