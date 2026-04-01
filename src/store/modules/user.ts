import { store } from "@/store";
import AuthAPI from "@/api/auth";
import UserAPI from "@/api/system/user";
import type { IamProfileResponse, LoginRequest, TenantContextMember, UserInfo } from "@/types/api";
import { useDictStoreHook } from "@/store/modules/dict";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useTagsViewStore } from "@/store";
import { cleanupWebSocket } from "@/composables";
import { AuthStorage } from "@/utils/auth";

function createEmptyUserInfo(): UserInfo {
  return {
    roles: [],
    perms: [],
    canSwitchTenant: false,
  };
}

function normalizeProfile(profile: IamProfileResponse, current: UserInfo): UserInfo {
  return {
    ...createEmptyUserInfo(),
    ...current,
    userId: profile.userId,
    username: profile.username,
    nickname: profile.staffProfile?.name || current.nickname || profile.username,
    status: profile.status,
    hasPlatformAccess: profile.hasPlatformAccess,
    staffProfile: profile.staffProfile,
    roles: current.roles ?? [],
    perms: current.perms ?? [],
    canSwitchTenant: current.canSwitchTenant ?? false,
  };
}

export const useUserStore = defineStore("user", () => {
  const userInfo = ref<UserInfo>(createEmptyUserInfo());
  const userInfoLoaded = ref(false);
  const rememberMe = ref(AuthStorage.getRememberMe());

  async function login(loginRequest: LoginRequest): Promise<void> {
    const { accessToken, refreshToken } = await AuthAPI.login(loginRequest);

    rememberMe.value = loginRequest.rememberMe ?? false;
    AuthStorage.setTokens(accessToken, refreshToken, rememberMe.value);
    userInfoLoaded.value = false;
    userInfo.value = createEmptyUserInfo();
  }

  let refreshPromise: Promise<void> | null = null;

  function refreshTokenOnce(): Promise<void> {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = doRefreshToken().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  async function getUserInfo(): Promise<UserInfo> {
    const profile = await UserAPI.getInfo();
    if (!profile) {
      throw new Error("Failed to load current IAM profile.");
    }

    const normalized = normalizeProfile(profile, userInfo.value);
    userInfo.value = normalized;
    userInfoLoaded.value = true;

    return normalized;
  }

  function setCanSwitchTenant(canSwitchTenant: boolean): void {
    userInfo.value = {
      ...createEmptyUserInfo(),
      ...userInfo.value,
      canSwitchTenant,
      roles: userInfo.value.roles ?? [],
      perms: userInfo.value.perms ?? [],
    };
  }

  function applyTenantContext(
    member?: TenantContextMember | null,
    canSwitchTenant?: boolean
  ): void {
    userInfo.value = {
      ...createEmptyUserInfo(),
      ...userInfo.value,
      nickname:
        member?.displayName ||
        userInfo.value.nickname ||
        userInfo.value.staffProfile?.name ||
        userInfo.value.username,
      canSwitchTenant: canSwitchTenant ?? userInfo.value.canSwitchTenant ?? false,
      roles: member?.roleCodes ?? [],
      perms: [],
    };
  }

  async function logout(): Promise<void> {
    try {
      await AuthAPI.logout();
    } finally {
      resetAllState();
    }
  }

  function resetAllState(): void {
    resetUserState();
    useTenantStoreHook().resetTenantState();
    usePermissionStoreHook().resetRouter();
    useDictStoreHook().clearDictCache();
    useTagsViewStore().delAllViews();
    cleanupWebSocket();
  }

  function resetUserState(): void {
    AuthStorage.clearAuth();
    userInfo.value = createEmptyUserInfo();
    userInfoLoaded.value = false;
  }

  async function doRefreshToken(): Promise<void> {
    const currentRefreshToken = AuthStorage.getRefreshToken();

    if (!currentRefreshToken) {
      throw new Error("No refresh token is available.");
    }

    const { accessToken, refreshToken } = await AuthAPI.refreshToken(currentRefreshToken);
    AuthStorage.setTokens(accessToken, refreshToken, AuthStorage.getRememberMe());
  }

  return {
    userInfo,
    userInfoLoaded,
    rememberMe,
    isLoggedIn: () => !!AuthStorage.getAccessToken(),
    login,
    logout,
    getUserInfo,
    setCanSwitchTenant,
    applyTenantContext,
    resetAllState,
    resetUserState,
    refreshToken: doRefreshToken,
    refreshTokenOnce,
  };
});

export function useUserStoreHook() {
  return useUserStore(store);
}
