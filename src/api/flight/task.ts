import request from "@/utils/request";
import type { BaseQueryParams, PageResult } from "@/types/api";

/**
 * Wire 类型：对应后端原始字段（snake_case）
 */
export interface TaskWire {
  id: number;
  name: string;
  // backend may return either `route` or `route_id` for the route id
  route?: number;
  route_id?: number;
  route_name?: string;
  // backend may return either `drone` or `drone_id` for the drone id
  drone?: number;
  drone_id?: number;
  drone_name?: string;
  // pilot fields
  pilot?: number;
  pilot_name?: string;
  scheduled_at?: string;
  started_at?: string;
  finished_at?: string;
  status?: number;
  sync_status?: string;
  execution_status?: string;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
  remark?: string;
  dji_job_id?: string;
}

/**
 * 页面使用的对象（camelCase）
 */
export interface TaskVO {
  id: number;
  name: string;
  routeId?: number;
  routeName?: string;
  droneId?: number;
  droneName?: string;
  pilotId?: number;
  pilotName?: string;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  status?: number;
  syncStatus?: string;
  executionStatus?: string;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
  remark?: string;
  djiJobId?: string;
}

/**
 * 查询参数（保持 pageNum/pageSize）
 */
export interface TaskPageQuery extends BaseQueryParams {
  name?: string;
  status?: number;
  route_id?: number;
  route_name?: string;
  drone_name?: string;
  pilot_name?: string;
  scheduled_range?: string[];
  started_at_start?: string;
  started_at_end?: string;
  finished_at_start?: string;
  finished_at_end?: string;
}

/**
 * 页面表单对象（前端内部使用 camelCase）
 */
export interface TaskForm {
  id?: number;
  name: string;
  routeId?: number;
  droneId?: number;
  pilotId?: number;
  scheduledAt?: string;
  remark?: string;
}

/** 航线下拉项 */
export interface RouteOption {
  id: number;
  name: string;
}

/** 租户成员（飞手）下拉项 */
export interface MemberOption {
  memberId: number;
  displayName: string;
  roleCodes: string[];
}

const TASK_BASE_URL = "/api/v1/missions";

function mapTaskWireToVO(w: TaskWire): TaskVO {
  return {
    id: w.id,
    name: w.name,
    routeId: w.route ?? w.route_id,
    routeName: w.route_name,
    droneId: w.drone ?? w.drone_id,
    droneName: w.drone_name,
    pilotId: w.pilot,
    pilotName: w.pilot_name,
    scheduledAt: w.scheduled_at,
    startedAt: w.started_at,
    finishedAt: w.finished_at,
    status:
      typeof w.status === "number" ? w.status : w.status != null ? Number(w.status) : undefined,
    syncStatus: w.sync_status,
    executionStatus: w.execution_status,
    lastSyncAt: w.last_sync_at,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    remark: w.remark,
    djiJobId: w.dji_job_id,
  };
}

function mapFormToWire(form: TaskForm): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: form.name,
  };

  if (form.routeId !== undefined) body.route = form.routeId;
  if (form.droneId !== undefined) body.drone = form.droneId;
  if (form.pilotId !== undefined) body.pilot = form.pilotId;
  if (form.scheduledAt) body.scheduled_at = form.scheduledAt;
  if (form.remark) body.remark = form.remark;

  return body;
}

function mapUpdateToWire(form: TaskForm): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (form.name !== undefined) body.name = form.name;
  if (form.scheduledAt !== undefined) body.scheduled_at = form.scheduledAt;
  if (form.remark !== undefined) body.remark = form.remark;
  return body;
}

const TaskAPI = {
  /** 获取任务分页列表，返回已映射的 camelCase 数据 */
  async getPage(queryParams: TaskPageQuery) {
    // backend may return different shapes; the request layer already unwraps the outer `code/msg/data`
    const raw = await request<any, any>({
      url: `${TASK_BASE_URL}`,
      method: "get",
      params: queryParams,
    });

    // support multiple shapes: { results, count } | { list, total } | direct array
    let list: TaskWire[] = [];
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
      list: (list ?? []).map(mapTaskWireToVO),
      total: total ?? 0,
    } as PageResult<TaskVO> & { list: TaskVO[] };
  },

  /** 获取单条任务并映射 */
  async getDetail(id: number) {
    const data = await request<any, TaskWire>({
      url: `${TASK_BASE_URL}/${id}`,
      method: "get",
    });
    return mapTaskWireToVO(data as TaskWire);
  },

  /** 新增任务（在 API 层做表单字段到后端字段的转换） */
  add(data: TaskForm) {
    const body = mapFormToWire(data);
    return request({
      url: `${TASK_BASE_URL}`,
      method: "post",
      data: body,
    });
  },

  /** 修改任务 */
  update(id: number, data: TaskForm) {
    const body = mapUpdateToWire(data);
    return request({
      url: `${TASK_BASE_URL}/${id}`,
      method: "put",
      data: body,
    });
  },

  /** 删除任务 */
  delete(id: number) {
    return request({
      url: `${TASK_BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 推进任务 */
  advance(id: number) {
    return request({
      url: `${TASK_BASE_URL}/${id}/advance`,
      method: "post",
    });
  },

  /** 获取航线列表（用于下拉选择） */
  async getRoutes() {
    const raw = await request<any, any>({ url: "/api/v1/routes", method: "get" });
    const list: any[] = [];
    if (Array.isArray(raw?.results)) {
      for (const item of raw.results) {
        if (Array.isArray(item?.data?.list)) list.push(...item.data.list);
        else if (Array.isArray(item?.list)) list.push(...item.list);
      }
    } else if (Array.isArray(raw?.list)) {
      list.push(...raw.list);
    } else if (Array.isArray(raw)) {
      list.push(...raw);
    } else if (Array.isArray(raw?.data?.list)) {
      list.push(...raw.data.list);
    }
    return list.map((r: any) => ({ id: r.id, name: r.name })) as RouteOption[];
  },

  /** 获取任务列表（用于下拉选择） */
  async getMissions() {
    const raw = await request<any, any>({
      url: "/api/v1/missions",
      method: "get",
      params: { pageNum: 1, pageSize: 1000 },
    });
    let list: TaskWire[] = [];
    if (Array.isArray(raw?.list)) {
      list = raw.list;
    } else if (Array.isArray(raw?.results)) {
      list = raw.results;
    } else if (Array.isArray(raw?.data?.list)) {
      list = raw.data.list;
    }
    return list.map(mapTaskWireToVO);
  },

  /** 获取租户成员列表（用于下拉选择飞手） */
  async getMembers() {
    const raw = await request<any, any>({ url: "/api/v1/iam/tenant/members", method: "get" });
    const list: any[] = [];
    if (Array.isArray(raw?.results)) {
      for (const item of raw.results) {
        if (Array.isArray(item?.data?.list)) list.push(...item.data.list);
        else if (Array.isArray(item?.list)) list.push(...item.list);
      }
    } else if (Array.isArray(raw?.list)) {
      list.push(...raw.list);
    } else if (Array.isArray(raw)) {
      list.push(...raw);
    } else if (Array.isArray(raw?.data?.list)) {
      list.push(...raw.data.list);
    }
    return list.map((m: any) => ({
      memberId: m.memberId,
      displayName: m.displayName,
      roleCodes: m.roleCodes ?? [],
    })) as MemberOption[];
  },
};

export default TaskAPI;
