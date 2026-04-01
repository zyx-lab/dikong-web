import request from "@/utils/request";
import type {
  PageResult,
  TenantContext,
  TenantCreateForm,
  TenantCreateResult,
  TenantForm,
  TenantInfo,
  TenantItem,
  TenantQueryParams,
} from "@/types/api";

const TENANT_BASE_URL = "/api/v1/tenants";
const IAM_TENANT_BASE_URL = "/api/v1/iam";

interface TenantDirectoryItem {
  id?: number;
  tenantId?: number;
  tenantCode?: string;
  name?: string;
  memberId?: number;
  roleCodes?: string[];
  status?: string;
  domain?: string;
}

function normalizeTenantInfo(item?: TenantDirectoryItem | TenantInfo | null): TenantInfo {
  const tenantId = Number(item?.tenantId ?? item?.id ?? 0);

  return {
    id: tenantId,
    tenantId,
    tenantCode: item?.tenantCode ?? "",
    name: item?.name ?? "",
    memberId: item?.memberId,
    roleCodes: item?.roleCodes ?? [],
    status: item?.status,
    domain: item?.domain,
  };
}

const TenantAPI = {
  getTenantList() {
    return request<any, PageResult<TenantDirectoryItem>>({
      url: `${IAM_TENANT_BASE_URL}/me/tenants`,
      method: "get",
      params: {
        pageNum: 1,
        pageSize: 100,
      },
    }).then((data) => (data?.list || []).map((item) => normalizeTenantInfo(item)));
  },

  getTenantContext(tenantCode: string) {
    return request<any, TenantContext>({
      url: `${IAM_TENANT_BASE_URL}/tenant/me`,
      method: "get",
      headers: {
        "X-TENANT-CODE": tenantCode,
      },
    });
  },

  async getCurrentTenant(tenantCode: string) {
    const context = await this.getTenantContext(tenantCode);

    return normalizeTenantInfo({
      tenantId: context.tenant.tenantId,
      tenantCode: context.tenant.tenantCode,
      name: context.tenant.name,
      status: context.tenant.status,
      memberId: context.member.memberId,
      roleCodes: context.member.roleCodes,
    });
  },

  getPage(queryParams?: TenantQueryParams) {
    return request<any, PageResult<TenantItem>>({
      url: `${TENANT_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  getFormData(tenantId: string) {
    return request<any, TenantForm>({
      url: `${TENANT_BASE_URL}/${tenantId}/form`,
      method: "get",
    });
  },

  create(data: TenantCreateForm) {
    return request<any, TenantCreateResult>({
      url: `${TENANT_BASE_URL}`,
      method: "post",
      data,
    });
  },

  update(tenantId: string, data: TenantForm) {
    return request({
      url: `${TENANT_BASE_URL}/${tenantId}`,
      method: "put",
      data,
    });
  },

  deleteByIds(ids: string) {
    return request({
      url: `${TENANT_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  updateStatus(tenantId: string, status: number) {
    return request({
      url: `${TENANT_BASE_URL}/${tenantId}/status`,
      method: "put",
      params: { status },
    });
  },

  getTenantMenuIds(tenantId: number) {
    return request<any, number[]>({
      url: `${TENANT_BASE_URL}/${tenantId}/menuIds`,
      method: "get",
    });
  },

  updateTenantMenus(tenantId: number, menuIds: number[]) {
    return request({
      url: `${TENANT_BASE_URL}/${tenantId}/menus`,
      method: "put",
      data: menuIds,
    });
  },
};

export default TenantAPI;
