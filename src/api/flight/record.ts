import request from "@/utils/request";
import type { PageResult } from "@/types/api";
import type { FlightRecordWire, FlightRecordInfo, FlightRecordQuery } from "./types";

const BASE_URL = "/api/v1/flight-records";

function normalize(flightrecord: FlightRecordWire): FlightRecordInfo {
  return {
    id: flightrecord.id,
    flightNo: flightrecord.flight_no,
    missionName: flightrecord.mission_name,
    routeName: flightrecord.route_name,
    airportName: flightrecord.airport_name,
    deviceSn: flightrecord.device_sn,
    droneName: flightrecord.drone_name,
    pilotName: flightrecord.pilot_name,
    startTime: flightrecord.start_time,
    endTime: flightrecord.end_time,
    flightDuration: flightrecord.flight_duration,
    photoCount: flightrecord.photo_count,
    videoCount: flightrecord.video_count,
    status: flightrecord.status,
    replayUrl: flightrecord.replay_url,
    createdAt: flightrecord.created_at,
    updatedAt: flightrecord.updated_at,
  };
}

const FlightRecordAPI = {
  async getPage(queryParams: FlightRecordQuery) {
    const raw = await request<any, any>({
      url: BASE_URL,
      method: "get",
      params: {
        pageNum: queryParams.pageNum,
        pageSize: queryParams.pageSize,
        flight_no: queryParams.flightNo,
        drone_id: queryParams.droneId,
        mission_id: queryParams.missionId,
        pilot_id: queryParams.pilotId,
        status: queryParams.status,
      },
    });

    let list: FlightRecordWire[] = [];
    let total = 0;

    // request 工具已自动解包 data，故 raw = { count, results: [{code,msg,data:{list,total}}] }
    if (Array.isArray(raw?.results)) {
      const results = raw.results as any[];
      for (const item of results) {
        if (Array.isArray(item?.data?.list)) {
          list = list.concat(item.data.list);
          total = item.data.total ?? 0;
        }
      }
    } else if (Array.isArray(raw?.data?.list)) {
      // { data: { list, total } } — 兜底结构
      list = raw.data.list;
      total = raw.data.total ?? 0;
    } else if (Array.isArray(raw?.list)) {
      // { list, total } — 直接列表
      list = raw.list;
      total = raw.total ?? 0;
    }

    return {
      list: (list ?? []).map(normalize),
      total: total ?? 0,
    } as PageResult<FlightRecordInfo> & { list: FlightRecordInfo[] };
  },

  async getDetail(id: number) {
    const raw = await request<any, any>({
      url: `${BASE_URL}/${id}`,
      method: "get",
    });
    // 返回原始数据（含 media_files），normalize 只处理顶级字段
    const base = normalize(raw as FlightRecordWire);
    // media_files 直接透传
    return { ...base, media_files: (raw as any).media_files ?? [] };
  },

  update(id: number, data: Record<string, any>) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  patch(id: number, data: Record<string, any>) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "patch",
      data,
    });
  },

  delete(id: number) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 获取视频回放地址（返回带签名的原始文件 URL） */
  getReplayUrl(id: number) {
    return request<any, any>({
      url: `${BASE_URL}/${id}/replay`,
      method: "get",
    });
  },

  /** 获取视频播放地址（后端返回 S3 签名 URL） */
  getPlaybackUrl(mediaId: number) {
    return request<any, any>({
      url: `/api/v1/media-files/${mediaId}/playback-url`,
      method: "get",
    });
  },
};

export default FlightRecordAPI;
