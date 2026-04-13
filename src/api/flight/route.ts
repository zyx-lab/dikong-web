import type { AxiosResponse } from "axios";
import request from "@/utils/request";

export interface RoutePageQuery {
  pageNum?: number;
  pageSize?: number;
  name?: string;
}

export interface RouteRead {
  id: number;
  name: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutePageResult {
  list: RouteRead[];
  total: number;
}

const ROUTE_BASE_URL = "/api/v1/routes";

const RouteAPI = {
  getPage(params: RoutePageQuery) {
    return request<any, RoutePageResult>({
      url: ROUTE_BASE_URL,
      method: "get",
      params,
    });
  },

  getDetail(id: number | string) {
    return request<any, RouteRead>({
      url: `${ROUTE_BASE_URL}/${id}`,
      method: "get",
    });
  },

  getKmz(id: number | string) {
    return request<any, AxiosResponse<Blob>>({
      url: `${ROUTE_BASE_URL}/${id}/kmz`,
      method: "get",
      responseType: "blob",
    });
  },

  create(data: { name: string; kmzFile: File }) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("kmz_file", data.kmzFile);

    return request<any, RouteRead>({
      url: ROUTE_BASE_URL,
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id: number | string, data: { name: string; kmzFile: File }) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("kmz_file", data.kmzFile);

    return request<any, RouteRead>({
      url: `${ROUTE_BASE_URL}/${id}`,
      method: "put",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete(id: number | string) {
    return request({
      url: `${ROUTE_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default RouteAPI;
