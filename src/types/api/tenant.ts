/**
 * Tenant related API models.
 */

import type { BaseQueryParams } from "./common";

export interface TenantInfo {
  id: number;
  tenantId: number;
  tenantCode: string;
  name: string;
  memberId?: number;
  roleCodes?: string[];
  status?: string;
  domain?: string;
}

export interface TenantContextTenant {
  tenantId: number;
  tenantCode: string;
  name: string;
  status?: string;
  plan?: unknown;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantContextMember {
  memberId: number;
  userId: number;
  displayName?: string;
  status?: string;
  roleCodes: string[];
}

export interface TenantContext {
  tenant: TenantContextTenant;
  member: TenantContextMember;
}

export interface TenantQueryParams extends BaseQueryParams {
  keywords?: string;
  status?: number;
}

export interface TenantItem {
  id?: string;
  name?: string;
  code?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  domain?: string;
  logo?: string;
  planId?: number;
  status?: number;
  remark?: string;
  expireTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface TenantForm {
  id?: string;
  name?: string;
  code?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  domain?: string;
  logo?: string;
  planId?: number;
  status?: number;
  remark?: string;
  expireTime?: string;
}

export interface TenantCreateForm {
  name?: string;
  code?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  domain?: string;
  logo?: string;
  planId?: number;
  remark?: string;
  expireTime?: string;
  adminUsername?: string;
}

export interface TenantCreateResult {
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
  adminUsername?: string;
  adminInitialPassword?: string;
  adminRoleCode?: string;
}
