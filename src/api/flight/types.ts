/** 任务状态 */
export enum TaskStatus {
  PENDING = 0,
  EXECUTING = 1,
  COMPLETED = 2,
  FAILED = 3,
  CANCELLED = 4,
}

/** 航线类型 */
export enum RouteType {
  POINT = "point",
  AREA = "area",
  LOOP = "loop",
}

/** 任务策略 */
export enum TaskStrategy {
  PERIODIC = "periodic",
  SCHEDULED = "scheduled",
  MANUAL = "manual",
}

export interface FlightTaskQuery {
  pageNum?: number;
  pageSize?: number;
  taskName?: string;
  status?: TaskStatus;
  routeName?: string;
  airportName?: string;
  droneName?: string;
}

export interface FlightTask {
  id: number;
  taskName: string;
  routeId?: number;
  routeName: string;
  airportName: string;
  droneId?: number;
  droneName: string;
  algorithm: string;
  taskContent: string;
  taskStrategy: string;
  status: TaskStatus;
  creator: string;
  createTime: string;
}

export interface FlightTaskForm {
  id?: number;
  taskName: string;
  routeId?: number;
  droneId?: number;
  airportId?: number;
  algorithmId?: number;
  taskStrategy: string;
  executeDate?: string;
  executeTime?: string;
  status?: TaskStatus;
}

export interface RouteQuery extends PageQuery {
  routeName?: string;
  routeType?: RouteType;
}

export interface RouteInfo {
  id: number;
  routeName: string;
  routeType: RouteType;
  waypointCount: number;
  distance: number;
  estimatedDuration: number;
  createTime: string;
}

export interface FlightRecordQuery extends PageQuery {
  flightNo?: string;
  droneId?: number;
  missionId?: number;
  pilotId?: number;
  status?: number;
}

export interface FlightRecordWire {
  id: number;
  flight_no: string;
  mission: number | null;
  mission_name: string;
  route_name: string;
  airport_name: string;
  drone: number | null;
  device_sn: string;
  drone_name: string;
  pilot: number | null;
  pilot_name: string;
  start_time: string | null;
  end_time: string | null;
  flight_duration: number | null;
  photo_count: number;
  video_count: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface FlightRecordInfo {
  id: number;
  flightNo: string;
  missionName: string;
  routeName: string;
  airportName: string;
  deviceSn: string;
  droneName: string;
  pilotName: string;
  startTime: string | null;
  endTime: string | null;
  flightDuration: number | null;
  photoCount: number;
  videoCount: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}
