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

export interface DroneQuery extends PageQuery {
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

export interface AirportQuery extends PageQuery {
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

export interface PilotInfo {
  id: number;
  name: string;
  phone: string;
  certification: string;
  certExpireDate: string;
  totalFlightHours: number;
  droneId?: number;
  droneName?: string;
  status: number;
}
