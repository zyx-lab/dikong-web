/** 无人机状态 */
export enum DroneStatus {
  OFFLINE = 0,
  ONLINE = 1,
  MAINTENANCE = 2,
}

/** 无人机控制模式 */
export enum DroneControlMode {
  PLATFORM = "PLATFORM",
  REMOTE = "REMOTE",
}

/** 无人机控制权类型 */
export enum DroneControlAuthority {
  EXCLUSIVE = "EXCLUSIVE",
  SHARED = "SHARED",
  TEAM = "TEAM",
}

/** 无人机保养状态 */
export enum DroneMaintenanceStatus {
  NORMAL = "NORMAL",
  NEEDS_MAINTENANCE = "NEEDS_MAINTENANCE",
  OVERDUE = "OVERDUE",
}

/** 无人机保险状态 */
export enum DroneInsuranceStatus {
  NORMAL = "NORMAL",
  EXPIRING_SOON = "EXPIRING_SOON",
  EXPIRED = "EXPIRED",
}

/** 负载类型 */
export enum PayloadType {
  VISIBLE_CAMERA = "visible_camera",
  INFRARED_CAMERA = "infrared_camera",
  LIDAR = "lidar",
  SPEAKER = "speaker",
}

/** 飞手证件类型 */
export enum PilotCertificateType {
  AOPA = "AOPA",
  ALPA = "ALPA",
  UTC = "UTC",
}

/** 飞手控制模式 */
export enum PilotControlMode {
  AUTO = "AUTO",
  MANUAL = "MANUAL",
  HYBRID = "HYBRID",
}

/** 飞手账号状态 */
export enum PilotAccountStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/** 后端原始返回的无人机对象（snake_case） */
export interface DroneWire {
  id: number;
  code?: string;
  name?: string;
  model?: string;
  device_sn?: string;
  status?: string; // e.g. "ENABLED"
  org_id?: number;
  created_by_tenant_member_id?: number;
  last_seen_at?: string;
  dji_online?: boolean;
  firmware_version?: string;
  firmware_status?: string;
  last_payload?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface DroneQuery extends BaseQueryParams {
  code?: string;
  deviceSn?: string;
  model?: string;
  name?: string;
}

export interface DroneInfo {
  id: number;
  code?: string;
  name?: string;
  model?: string;
  deviceSn?: string;
  status?: string;
  orgId?: number;
  createdByTenantMemberId?: number;
  lastSeenAt?: string;
  djiOnline?: boolean;
  firmwareVersion?: string;
  firmwareStatus?: string;
  lastPayload?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DroneForm {
  id?: number;
  code?: string;
  name?: string;
  model?: string;
  orgId?: number;
}

export interface AirportQuery extends BaseQueryParams {
  airportName?: string;
  status?: number;
}

export interface AirportInfo {
  id: number;
  airportName: string;
  location: string;
  longitude: number;
  latitude: number;
  droneCount: number;
  status: number;
}

export interface PayloadInfo {
  id: number;
  payloadName: string;
  type: PayloadType;
  model: string;
  droneId?: number;
  droneName?: string;
  status: number;
}

export interface PilotQuery extends BaseQueryParams {
  username?: string;
  name?: string;
  organization?: string;
  certificateType?: PilotCertificateType;
  controlMode?: PilotControlMode;
}

export interface PilotInfo {
  id: number;
  username: string;
  name: string;
  phone: string;
  organization: string;
  department: string;
  certificateType: PilotCertificateType;
  certificateNo: string;
  controlMode: PilotControlMode;
  assignedDroneName?: string;
  status: PilotAccountStatus;
  email?: string;
  remark?: string;
  createdAt: string;
  issuedDate?: string;
  validityYears?: number;
  certificateScanUrl?: string;
}

export interface PilotForm {
  id?: number;
  username: string;
  password?: string;
  name: string;
  phone: string;
  organization?: string;
  department?: string;
  email?: string;
  remark?: string;
  certificateType?: PilotCertificateType;
  certificateNo?: string;
  issuedDate?: string;
  validityYears?: number;
  certificateScanUrl?: string;
  controlMode?: PilotControlMode;
  assignedDroneName?: string;
  status?: PilotAccountStatus;
}
