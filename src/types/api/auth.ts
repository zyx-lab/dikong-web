/**
 * Authentication related API models.
 */

export interface LoginRequest {
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
  rememberMe?: boolean;
  tenantId?: number;
}

export interface SessionUserProfile {
  userId: number | string;
  username: string;
  status: string;
  hasPlatformAccess?: boolean;
  staffProfile?: {
    name?: string;
    phone?: string;
    email?: string;
    employmentStatus?: string;
    orgId?: number | null;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn?: number;
  user?: SessionUserProfile;
}

export interface CaptchaInfo {
  captchaId: string;
  captchaBase64: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
