/** 无人机状态 */
export enum DroneStatus {
  OFFLINE = 0,
  ONLINE = 1,
  MAINTENANCE = 2,
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

export interface DroneQuery extends BaseQueryParams {
  droneName?: string;
  model?: string;
  status?: DroneStatus;
}

export interface DroneInfo {
  id: number;
  droneName: string;
  model: string;
  snCode: string;
  status: DroneStatus;
  batteryLevel: number;
  lastFlightTime?: string;
  totalFlightHours: number;
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
