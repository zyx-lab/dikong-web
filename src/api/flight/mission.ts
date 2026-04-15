import request from "@/utils/request";

export interface MissionPageQuery {
  pageNum?: number;
  pageSize?: number;
  drone_id?: number;
  pilot_id?: number;
  route_id?: number;
  status?: number;
}

export interface MissionRead {
  id: number;
  name: string;
  route: number | null;
  route_name: string;
  drone: number | null;
  drone_name: string;
  pilot: number | null;
  pilot_name: string;
  scheduled_at: string | null;
  remark: string;
  status: number;
  dji_job_id: string;
  sync_status: string;
  execution_status: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MissionPageResult {
  list?: MissionRead[];
  total?: number;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: MissionRead[];
}

const MISSION_BASE_URL = "/api/v1/missions";

const MissionAPI = {
  getPage(params: MissionPageQuery) {
    return request<any, MissionPageResult>({
      url: MISSION_BASE_URL,
      method: "get",
      params,
    });
  },
};

export default MissionAPI;
