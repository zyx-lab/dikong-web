import request from "@/utils/request";
import type { PageResult } from "@/types/api";
import type { DroneWire, DroneInfo, DroneQuery, DroneForm } from "./types";

const DRONE_BASE_URL = "/api/v1/drones";

function normalizeDrone(drone: DroneWire): DroneInfo {
  return {
    id: drone.id,
    code: drone.code,
    name: drone.name,
    model: drone.model,
    deviceSn: drone.device_sn,
    status: drone.status,
    orgId: drone.org_id,
    createdByTenantMemberId: drone.created_by_tenant_member_id,
    lastSeenAt: drone.last_seen_at,
    djiOnline: drone.dji_online,
    firmwareVersion: drone.firmware_version,
    firmwareStatus: drone.firmware_status,
    lastPayload: drone.last_payload,
    createdAt: drone.created_at,
    updatedAt: drone.updated_at,
  } as DroneInfo;
}

function mapFormToWire(form: DroneForm): Record<string, any> {
  return {
    code: form.code,
    name: form.name,
    model: form.model,
    org_id: form.orgId,
  };
}

const DroneAPI = {
  // List claimed drones (tenant-scoped)
  async getPage(queryParams: DroneQuery) {
    // camelCase → snake_case 映射
    const params: Record<string, unknown> = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
    };
    if (queryParams.code) params.code = queryParams.code;
    if (queryParams.deviceSn) params.device_sn = queryParams.deviceSn;
    if (queryParams.model) params.model = queryParams.model;
    if (queryParams.name) params.name = queryParams.name;

    const raw = await request<any, any>({
      url: `${DRONE_BASE_URL}`,
      method: "get",
      params,
    });

    // support multiple shapes: { results, count } | { list, total } | direct array
    let list: DroneWire[] = [];
    let total = 0;

    if (Array.isArray(raw?.results)) {
      list = raw.results;
      total = raw.count ?? raw.total ?? raw.results.length;
    } else if (Array.isArray(raw?.list)) {
      list = raw.list;
      total = raw.total ?? raw.count ?? raw.list.length;
    } else if (Array.isArray(raw)) {
      list = raw;
      total = raw.length;
    } else if (Array.isArray(raw?.data?.results)) {
      list = raw.data.results;
      total = raw.data.count ?? raw.data.total ?? raw.data.results.length;
    } else if (Array.isArray(raw?.data?.list)) {
      list = raw.data.list;
      total = raw.data.total ?? raw.data.count ?? raw.data.list.length;
    }

    return {
      list: (list ?? []).map(normalizeDrone),
      total: total ?? 0,
    } as PageResult<DroneInfo> & { list: DroneInfo[] };
  },

  // Query available (unclaimed) drones
  async getAvailable(queryParams: DroneQuery) {
    const raw = await request<any, any>({
      url: `${DRONE_BASE_URL}/available`,
      method: "get",
      params: queryParams,
    });

    let list: DroneWire[] = [];
    let total = 0;

    if (Array.isArray(raw?.list)) {
      list = raw.list;
      total = raw.total ?? 0;
    } else if (Array.isArray(raw?.results) && raw.results.length > 0) {
      const first = raw.results[0];
      if (first && first.data) {
        if (Array.isArray(first.data.list)) {
          list = first.data.list;
          total = first.data.total ?? 0;
        } else if (Array.isArray(raw.results)) {
          list = raw.results;
          total = raw.results.length;
        }
      }
    } else if (Array.isArray(raw)) {
      list = raw;
      total = raw.length;
    } else if (Array.isArray(raw?.data?.list)) {
      list = raw.data.list;
      total = raw.data.total ?? 0;
    }

    return {
      list: (list ?? []).map(normalizeDrone),
      total: total ?? 0,
    } as PageResult<DroneInfo> & { list: DroneInfo[] };
  },

  async getDetail(id: number) {
    const raw = await request<any, any>({
      url: `${DRONE_BASE_URL}/${id}`,
      method: "get",
    });
    const wire = (raw?.data ?? raw) as DroneWire;
    return normalizeDrone(wire);
  },

  add(data: DroneForm) {
    const body = mapFormToWire(data);
    return request({
      url: `${DRONE_BASE_URL}`,
      method: "post",
      data: body,
    });
  },

  // Claim a single device (DroneClaim schema)
  claimOne(claim: { device_sn: string; code: string; name?: string; model?: string }) {
    return request<any, DroneWire>({
      url: `${DRONE_BASE_URL}`,
      method: "post",
      data: claim,
    }).then((w) => normalizeDrone(w as DroneWire));
  },

  // Claim multiple devices by device_sn (per-device POST)
  async claimBulk(deviceSns: string[]) {
    const tasks = deviceSns.map((sn) =>
      request<any, DroneWire>({
        url: `${DRONE_BASE_URL}`,
        method: "post",
        data: { device_sn: sn, code: sn },
      }).then((w) => normalizeDrone(w as DroneWire))
    );
    return Promise.all(tasks);
  },

  update(id: number, data: DroneForm) {
    const body = mapFormToWire(data);
    return request({
      url: `${DRONE_BASE_URL}/${id}`,
      method: "put",
      data: body,
    });
  },

  delete(id: string) {
    return request({
      url: `${DRONE_BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 开启无人机直播 */
  liveStart(id: number, body: { url_type: number; video_id: string; video_quality: number }) {
    return request<any, any>({
      url: `${DRONE_BASE_URL}/${id}/live/start`,
      method: "post",
      data: body,
    });
  },

  /** 停止无人机直播 */
  liveStop(id: number, body: { url_type: number; video_id: string; video_quality: number }) {
    return request<any, any>({
      url: `${DRONE_BASE_URL}/${id}/live/stop`,
      method: "post",
      data: body,
    });
  },
};

export default DroneAPI;
