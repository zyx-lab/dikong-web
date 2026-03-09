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

export interface FlightTaskQuery extends PageQuery {
  taskName?: string;
  status?: TaskStatus;
  droneId?: number;
  startTime?: string;
  endTime?: string;
}

export interface FlightTask {
  id: number;
  taskName: string;
  routeId: number;
  routeName: string;
  droneId: number;
  droneName: string;
  inspectionArea: string;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  createTime: string;
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
  droneId?: number;
  status?: number;
  startTime?: string;
  endTime?: string;
}

export interface FlightRecord {
  id: number;
  taskName: string;
  droneId: number;
  droneName: string;
  takeoffTime: string;
  landingTime: string;
  flightDuration: number;
  flightDistance: number;
  status: number;
}
