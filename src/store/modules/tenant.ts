import { store } from "@/store";
import TenantAPI from "@/api/system/tenant";
import { STORAGE_KEYS } from "@/constants";
import type { TenantContext, TenantInfo } from "@/types/api";

type TenantRecoveryStatus = "recovered" | "login-required";

interface TenantRecoveryResult {
  status: TenantRecoveryStatus;
  context: TenantContext | null;
}

function buildTenantInfoFromContext(
  context: TenantContext,
  fallback?: TenantInfo | null
): TenantInfo {
  return {
    id: context.tenant.tenantId,
    tenantId: context.tenant.tenantId,
    tenantCode: context.tenant.tenantCode,
    name: context.tenant.name || fallback?.name || "",
    memberId: context.member.memberId,
    roleCodes: context.member.roleCodes ?? fallback?.roleCodes ?? [],
    status: context.tenant.status ?? fallback?.status,
    domain: fallback?.domain,
  };
}

export const useTenantStore = defineStore("tenant", () => {
  const currentTenantId = ref<number | null>(null);
  const currentTenantCode = ref("");
  const currentTenant = ref<TenantInfo | null>(null);
  const tenantList = ref<TenantInfo[]>([]);

  function restoreTenant(): void {
    const savedTenantId = localStorage.getItem(STORAGE_KEYS.TENANT_ID);
    const savedTenantCode = localStorage.getItem(STORAGE_KEYS.TENANT_CODE);
    const savedTenantInfo = localStorage.getItem(STORAGE_KEYS.TENANT_INFO);

    if (savedTenantId) {
      currentTenantId.value = Number(savedTenantId);
    }

    if (savedTenantCode) {
      currentTenantCode.value = savedTenantCode;
    }

    if (!savedTenantInfo) {
      return;
    }

    try {
      const parsed = JSON.parse(savedTenantInfo) as TenantInfo;
      currentTenant.value = parsed;
      currentTenantId.value = parsed.tenantId ?? parsed.id ?? currentTenantId.value;
      currentTenantCode.value = parsed.tenantCode ?? currentTenantCode.value;
    } catch (error) {
      console.error("Failed to restore tenant info.", error);
    }
  }

  async function fetchTenantList(): Promise<TenantInfo[]> {
    const list = await TenantAPI.getTenantList();
    tenantList.value = list || [];
    return tenantList.value;
  }

  function findMatchedTenant(list: TenantInfo[]): TenantInfo | null {
    if (currentTenantCode.value) {
      return list.find((item) => item.tenantCode === currentTenantCode.value) ?? null;
    }

    if (currentTenantId.value != null) {
      return list.find((item) => (item.tenantId ?? item.id) === currentTenantId.value) ?? null;
    }

    return null;
  }

  function resolveTenantSelection(list: TenantInfo[]): TenantInfo | null {
    const matchedTenant = findMatchedTenant(list);
    if (matchedTenant) {
      return matchedTenant;
    }

    // When the stored selection is stale or missing, fall back to the first
    // accessible tenant so the UI can continue working without a full reload.
    return list[0] ?? null;
  }

  async function loadTenant(): Promise<TenantContext | null> {
    restoreTenant();

    const list = await fetchTenantList();
    if (list.length === 0) {
      clearTenant();
      return null;
    }

    const hasStoredSelection =
      !!currentTenantCode.value || currentTenantId.value !== null || currentTenant.value !== null;
    const matchedTenant = findMatchedTenant(list);

    // The persisted selection is no longer valid. Clear only the selection state
    // and keep the freshly fetched tenant list available to the UI.
    if (hasStoredSelection && !matchedTenant) {
      clearTenant();
    }

    const nextTenant = matchedTenant ?? resolveTenantSelection(list);
    if (!nextTenant) {
      clearTenant();
      return null;
    }

    const context = await safeGetTenantContext(nextTenant.tenantCode);
    if (context) {
      setCurrentTenant(buildTenantInfoFromContext(context, nextTenant));
      return context;
    }

    clearTenant();
    return null;
  }

  function setCurrentTenant(tenant: TenantInfo): void {
    currentTenantId.value = tenant.tenantId ?? tenant.id;
    currentTenantCode.value = tenant.tenantCode;
    currentTenant.value = tenant;

    localStorage.setItem(STORAGE_KEYS.TENANT_ID, String(currentTenantId.value));
    localStorage.setItem(STORAGE_KEYS.TENANT_CODE, tenant.tenantCode);
    localStorage.setItem(STORAGE_KEYS.TENANT_INFO, JSON.stringify(tenant));
  }

  async function switchTenant(tenantId: number): Promise<TenantContext | null> {
    const matchedTenant = tenantList.value.find(
      (item) => item.id === tenantId || item.tenantId === tenantId
    );

    if (!matchedTenant) {
      throw new Error("Target tenant was not found in the accessible tenant list.");
    }

    const context = await TenantAPI.getTenantContext(matchedTenant.tenantCode);
    setCurrentTenant(buildTenantInfoFromContext(context, matchedTenant));
    return context;
  }

  async function recoverTenantContext(): Promise<TenantRecoveryResult> {
    resetTenantState();

    try {
      const list = await fetchTenantList();
      if (list.length !== 1) {
        return {
          status: "login-required",
          context: null,
        };
      }

      const nextTenant = list[0];
      const context = await safeGetTenantContext(nextTenant.tenantCode);
      if (!context) {
        resetTenantState();
        return {
          status: "login-required",
          context: null,
        };
      }

      setCurrentTenant(buildTenantInfoFromContext(context, nextTenant));
      return {
        status: "recovered",
        context,
      };
    } catch (error) {
      console.debug("[Tenant] Failed to recover tenant context.", error);
      resetTenantState();
      return {
        status: "login-required",
        context: null,
      };
    }
  }

  // Clear only the current selection. Keep tenantList intact because it is the
  // source-of-truth data returned by the backend and may still be needed by the UI.
  function clearTenant(): void {
    currentTenantId.value = null;
    currentTenantCode.value = "";
    currentTenant.value = null;
    clearLocalTenant();
  }

  function resetTenantState(): void {
    clearTenant();
    tenantList.value = [];
  }

  function clearLocalTenant(): void {
    localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
    localStorage.removeItem(STORAGE_KEYS.TENANT_CODE);
    localStorage.removeItem(STORAGE_KEYS.TENANT_INFO);
  }

  async function safeGetTenantContext(tenantCode: string): Promise<TenantContext | null> {
    try {
      return await TenantAPI.getTenantContext(tenantCode);
    } catch (error) {
      console.debug("[Tenant] Failed to load tenant context.", error);
      return null;
    }
  }

  function setTenantList(list: TenantInfo[]): void {
    tenantList.value = list || [];
  }

  restoreTenant();

  return {
    currentTenantId,
    currentTenantCode,
    currentTenant,
    tenantList,
    loadTenant,
    fetchTenantList,
    setTenantList,
    setCurrentTenant,
    switchTenant,
    recoverTenantContext,
    clearTenant,
    resetTenantState,
  };
});

export function useTenantStoreHook() {
  return useTenantStore(store);
}
