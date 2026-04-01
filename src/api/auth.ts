import request from "@/utils/request";
import type {
  CaptchaInfo,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
} from "@/types/api/auth";

const IAM_SESSION_BASE_URL = "/api/v1/iam/session";

const AuthAPI = {
  login(data: LoginRequest) {
    return request<any, LoginResponse>({
      url: `${IAM_SESSION_BASE_URL}/login`,
      method: "post",
      data: {
        username: data.username,
        password: data.password,
      },
    });
  },

  refreshToken(refreshToken: string) {
    const payload: RefreshTokenRequest = { refreshToken };

    return request<any, LoginResponse>({
      url: `${IAM_SESSION_BASE_URL}/refresh`,
      method: "post",
      data: payload,
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  logout() {
    return request({
      url: `${IAM_SESSION_BASE_URL}/logout`,
      method: "post",
    });
  },

  /**
   * @deprecated The first IAM rollout no longer uses captcha.
   * Keep the legacy method only to avoid breaking older branches.
   */
  getCaptcha() {
    return request<any, CaptchaInfo>({
      url: "/api/v1/auth/captcha",
      method: "get",
    });
  },
};

export default AuthAPI;
