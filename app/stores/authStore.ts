import { defineStore } from "pinia";
import { createAuthClient } from "better-auth/vue";
import { genericOAuthClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
});

export const useAuthStore = defineStore("authStore", () => {
  const session = ref<Awaited<ReturnType<typeof authClient.useSession>> | null>(
    null,
  );
  const isInitialized = ref(false);

  async function init() {
    try {
      const data = await authClient.useSession(useFetch);
      session.value = data;
      return data;
    } catch (error) {
      console.error("Auth initialization failed:", error);
      throw error;
    } finally {
      // Return true to avoid blocking
      isInitialized.value = true;
    }
  }

  const user = computed(() => session.value?.data?.user);
  const loading = computed(() => !isInitialized.value);
  const isAuthenticated = computed(() => !!user.value);

  // OAuth Sign-In Methods
  async function signInWithGithub() {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/home",
        errorCallbackURL: "/error",
        newUserCallbackURL: "/home",
      });
    } catch (error) {
      console.error("Error during GitHub sign-in:", error);
      throw error; // Re-throw for handling in the UI if needed
    }
  }

  async function signInWithPlanio() {
    try {
      await authClient.signIn.social({
        provider: "planio",
        callbackURL: "/home",
        errorCallbackURL: "/error",
        newUserCallbackURL: "/home",
      });
    } catch (error) {
      console.error("Error during Planio sign-in:", error);
      throw error;
    }
  }

  // Sign-Out Method
  async function signOut() {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirect to home page after sign-out
            navigateTo("/");
          },
        },
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  }

  // Expose state and actions
  return {
    init,
    loading: readonly(loading),
    isInitialized: readonly(isInitialized),
    isAuthenticated: readonly(isAuthenticated),
    signInWithGithub,
    signInWithPlanio,
    signOut,
    user: readonly(user),
  };
});
