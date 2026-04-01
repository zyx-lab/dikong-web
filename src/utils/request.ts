import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import qs from "qs";
import { ApiCodeEnum } from "@/enums/api";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import { AuthStorage, redirectToLogin } from "@/utils/auth";
import { getStoredTenantCode } from "@/utils/tenant";

type ResponsePayload = ApiResponse | string | null | undefined;
type ExtendedRequestConfig = InternalAxiosRequestConfig & {
  _tenantHeaderFromStorage?: boolean;
};
type RequestError = Error & {
  code?: string;
  status?: number;
  response?: AxiosResponse<ResponsePayload>;
};
type UnauthorizedRequestKind = "login" | "refresh" | "business";

const retriedConfigs = new WeakSet<InternalAxiosRequestConfig>();
let tenantRecoveryPromise: Promise<boolean> | null = null;
const TENANT_HEADER_NAME = "X-TENANT-CODE";
const IAM_SESSION_LOGIN_PATH = "/api/v1/iam/session/login";
const IAM_SESSION_REFRESH_PATH = "/api/v1/iam/session/refresh";
const TENANT_HEADER_EXCLUDE_PATHS = [
  IAM_SESSION_LOGIN_PATH,
  "/api/v1/iam/session/logout",
  IAM_SESSION_REFRESH_PATH,
  "/api/v1/iam/me/profile",
  "/api/v1/iam/me/tenants",
];

const http = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

function getHeader(config: InternalAxiosRequestConfig, key: string): string | undefined {
  const headers = config.headers as
    | { get?: (name: string) => string | undefined; [key: string]: unknown }
    | undefined;
  if (!headers) {
    return undefined;
  }

  if (typeof headers.get === "function") {
    return headers.get(key);
  }

  const value = headers[key];
  return typeof value === "string" ? value : undefined;
}

function setHeader(config: InternalAxiosRequestConfig, key: string, value: string): void {
  const headers = config.headers as
    | { set?: (name: string, value: string) => void; [key: string]: unknown }
    | undefined;

  if (!headers) {
    config.headers = { [key]: value } as InternalAxiosRequestConfig["headers"];
    return;
  }

  if (typeof headers.set === "function") {
    headers.set(key, value);
    return;
  }

  headers[key] = value;
}

function deleteHeader(config: InternalAxiosRequestConfig, key: string): void {
  const headers = config.headers as
    | { delete?: (name: string) => void; [key: string]: unknown }
    | undefined;

  if (!headers) {
    return;
  }

  if (typeof headers.delete === "function") {
    headers.delete(key);
    return;
  }

  delete headers[key];
}

function shouldAttachTenantHeader(url?: string): boolean {
  if (!url) {
    return false;
  }

  return !TENANT_HEADER_EXCLUDE_PATHS.some((path) => url.includes(path));
}

function getUnauthorizedRequestKind(url?: string): UnauthorizedRequestKind {
  if (!url) {
    return "business";
  }

  if (url.includes(IAM_SESSION_LOGIN_PATH)) {
    return "login";
  }

  if (url.includes(IAM_SESSION_REFRESH_PATH)) {
    return "refresh";
  }

  return "business";
}

function createRequestError(
  response: AxiosResponse<ResponsePayload>,
  fallbackMessage: string
): RequestError {
  const payload =
    typeof response.data === "object" && response.data !== null
      ? (response.data as ApiResponse)
      : null;

  const error = new Error(payload?.msg || fallbackMessage) as RequestError;
  error.code = payload?.code;
  error.status = response.status;
  error.response = response;
  return error;
}

function shouldRecoverTenantContext(config?: ExtendedRequestConfig): boolean {
  if (!config || tenantRecoveryPromise) {
    return false;
  }

  return (
    config._tenantHeaderFromStorage === true &&
    shouldAttachTenantHeader(config.url) &&
    !!getHeader(config, TENANT_HEADER_NAME)
  );
}

async function recoverTenantContextOnce(): Promise<boolean> {
  if (tenantRecoveryPromise) {
    return tenantRecoveryPromise;
  }

  tenantRecoveryPromise = (async () => {
    const tenantStore = useTenantStoreHook();
    const userStore = useUserStoreHook();
    const recovery = await tenantStore.recoverTenantContext();

    if (recovery.status === "recovered" && recovery.context) {
      const canSwitchTenant = tenantStore.tenantList.length > 1;
      userStore.setCanSwitchTenant(canSwitchTenant);
      userStore.applyTenantContext(recovery.context.member, canSwitchTenant);
      ElMessage.warning("当前租户已失效，系统已切换到最新可用租户，请重试当前操作。");
      return true;
    }

    await redirectToLogin("当前租户上下文已失效，请重新登录。");
    return false;
  })().finally(() => {
    tenantRecoveryPromise = null;
  });

  return tenantRecoveryPromise;
}

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requestConfig = config as ExtendedRequestConfig;
    const token = AuthStorage.getAccessToken();
    requestConfig._tenantHeaderFromStorage = false;

    if (getHeader(requestConfig, "Authorization") === "no-auth") {
      deleteHeader(requestConfig, "Authorization");
    } else if (token) {
      setHeader(requestConfig, "Authorization", `Bearer ${token}`);
    }

    if (
      !getHeader(requestConfig, TENANT_HEADER_NAME) &&
      shouldAttachTenantHeader(requestConfig.url)
    ) {
      const tenantCode = getStoredTenantCode();
      if (tenantCode) {
        setHeader(requestConfig, TENANT_HEADER_NAME, tenantCode);
        requestConfig._tenantHeaderFromStorage = true;
      }
    }

    return requestConfig;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { responseType } = response.config;

    if (responseType === "blob" || responseType === "arraybuffer") {
      return response;
    }

    const payload = response.data as ResponsePayload;
    if (typeof payload !== "object" || payload === null) {
      return payload;
    }

    const { code, data, msg } = payload;
    if (code === ApiCodeEnum.SUCCESS) {
      return data;
    }

    const requestError = createRequestError(
      response as AxiosResponse<ResponsePayload>,
      msg || "Request failed"
    );
    ElMessage.error(requestError.message);
    return Promise.reject(requestError);
  },

  async (error) => {
    const { config, response } = error as {
      config: ExtendedRequestConfig;
      response?: AxiosResponse<ResponsePayload>;
    };

    if (!response) {
      ElMessage.error("网络连接失败");
      return Promise.reject(error);
    }

    const payload =
      typeof response.data === "object" && response.data !== null
        ? (response.data as ApiResponse)
        : null;
    const code = payload?.code;
    const msg = payload?.msg;
    const requestKind = getUnauthorizedRequestKind(config?.url);

    if (code === ApiCodeEnum.ACCESS_TOKEN_INVALID || response.status === 401) {
      if (requestKind === "login") {
        const requestError = createRequestError(response, msg || "Login failed");
        ElMessage.error(requestError.message);
        return Promise.reject(requestError);
      }

      if (requestKind === "refresh") {
        await redirectToLogin(msg || "登录状态已失效，请重新登录");
        return Promise.reject(createRequestError(response, "Refresh token invalid"));
      }

      if (retriedConfigs.has(config)) {
        await redirectToLogin("登录状态已失效，请重新登录");
        return Promise.reject(createRequestError(response, "Token invalid"));
      }

      retriedConfigs.add(config);

      try {
        const userStore = useUserStoreHook();
        await userStore.refreshTokenOnce();

        const token = AuthStorage.getAccessToken();
        if (token) {
          setHeader(config, "Authorization", `Bearer ${token}`);
        }

        return http(config);
      } catch {
        await redirectToLogin("登录状态已失效，请重新登录");
        return Promise.reject(createRequestError(response, "Token refresh failed"));
      }
    }

    if (code === ApiCodeEnum.PERMISSION_DENIED || response.status === 403) {
      if (shouldRecoverTenantContext(config)) {
        const recovered = await recoverTenantContextOnce();
        return Promise.reject(
          createRequestError(
            response,
            recovered
              ? "当前租户已自动恢复，请重试当前操作。"
              : "当前租户上下文已失效，请重新登录。"
          )
        );
      }

      if (tenantRecoveryPromise && config?._tenantHeaderFromStorage) {
        const recovered = await tenantRecoveryPromise;
        return Promise.reject(
          createRequestError(
            response,
            recovered
              ? "当前租户已自动恢复，请重试当前操作。"
              : "当前租户上下文已失效，请重新登录。"
          )
        );
      }

      const requestError = createRequestError(response, msg || "权限或租户上下文不足");
      ElMessage.error(requestError.message);
      return Promise.reject(requestError);
    }

    const requestError = createRequestError(response, msg || `请求失败 (${response.status})`);
    ElMessage.error(requestError.message);
    return Promise.reject(requestError);
  }
);

export default http;
