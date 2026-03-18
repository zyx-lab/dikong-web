import axios from "axios";

export interface WaylineUploadParams {
  baseUrl: string;
  workspaceId: string;
  token: string;
  file: File;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function getResponseMessage(data: any) {
  return data?.msg || data?.message || data?.error || data?.detail || "";
}

const WaylineAPI = {
  async uploadKmz(params: WaylineUploadParams) {
    const formData = new FormData();
    formData.append("file", params.file);

    const response = await axios.post(
      `${normalizeBaseUrl(params.baseUrl)}/wayline/api/v1/workspaces/${params.workspaceId}/waylines/file/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-auth-token": params.token,
        },
        timeout: 60000,
      }
    );

    const data = response.data;
    if (typeof data === "object" && data !== null && "code" in data) {
      const code = Number(data.code);
      if (!Number.isNaN(code) && code !== 0) {
        throw new Error(getResponseMessage(data) || "航线下发失败");
      }
    }

    return data;
  },
};

export default WaylineAPI;
