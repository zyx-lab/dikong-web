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
