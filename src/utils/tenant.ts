import { appConfig } from "@/settings";
import { PLATFORM_TENANT_ID, STORAGE_KEYS } from "@/constants";
import type { TenantInfo } from "@/types/api";

/**
 * 是否启用多租户
 */
export const isTenantEnabled = () => appConfig.tenantEnabled;

/**
 * 判断是否平台租户
 *
 * @description
 * 平台租户不参与套餐与菜单配置
 */
export const isPlatformTenantId = (tenantId?: string | number) =>
  Number(tenantId) === PLATFORM_TENANT_ID;

export function getStoredTenantCode(): string {
  const storedTenantCode = localStorage.getItem(STORAGE_KEYS.TENANT_CODE);
  if (storedTenantCode) {
    return storedTenantCode;
  }

  const storedTenantInfo = localStorage.getItem(STORAGE_KEYS.TENANT_INFO);
  if (!storedTenantInfo) {
    return "";
  }

  try {
    const parsed = JSON.parse(storedTenantInfo) as Partial<TenantInfo>;
    return parsed.tenantCode ?? "";
  } catch {
    return "";
  }
}
