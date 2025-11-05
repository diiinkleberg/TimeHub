import { authClient } from "~/lib/auth-client";
import type { User } from "#shared/types/auth";

export const useAuth = async () => {
  const { data: session } = await authClient.useSession(useFetch);

  const user = computed(() => session?.value?.user as User | undefined);
  const isAuthenticated = computed(() => !!user.value);

  return {
    authClient,
    session: session.value,
    user,
    isAuthenticated,

    signInWithPlanio: async () =>
      await authClient.signIn.social({
        provider: "planio",
        callbackURL: "/dashboard",
        errorCallbackURL: "/error",
      }),
    linkGithubAccount: async () =>
      await authClient.linkSocial({
        provider: "github",
        callbackURL: "/settings",
        errorCallbackURL: "/error",
      }),

    listAccounts: async () => await authClient.listAccounts(),

    signOut: () => {
      authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            session.value = null;
            navigateTo("/", { replace: true });
          },
        },
      });
    },

    unlinkGithubAccount: async () => {
      await authClient.unlinkAccount({
        providerId: "github",
      });
    },
  };
};
