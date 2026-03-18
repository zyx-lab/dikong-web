import { RouteType } from "@/api/flight/types";

export type BaseMapMode = "standard" | "satellite" | "terrain";
export type PhotoMode = "time" | "distance";
export type CameraMode = "wide" | "infrared";
export type FinishAction = "returnHome" | "hover" | "land";
export type SignalLossAction = "returnHome" | "hover" | "continue";
export type HeadingMode = "auto" | "track" | "tangent" | "manual";
export type TakeoffPointMode = "system" | "manual";
export type OrbitDirection = "clockwise" | "counterclockwise";

export interface PlannerPoint {
  id: string;
  name: string;
  lng: number;
  lat: number;
  alt: number;
  hoverSeconds: number;
  gimbalPitch: number;
  yaw: number;
  shootPhoto: boolean;
  startRecord: boolean;
  stopRecord: boolean;
}

export interface LoopTargetPoint {
  lng: number;
  lat: number;
  alt: number;
}

export interface GlobalConfig {
  takeoffHeight: number;
  routeHeight: number;
  returnHeight: number;
  routeSpeed: number;
  signalLossAction: SignalLossAction;
  finishAction: FinishAction;
  cameraMode: CameraMode;
  zoom: number;
}

export interface PointRouteConfig {
  yawMode: HeadingMode;
  waypointType: string;
  hoverSeconds: number;
  photoIntervalSeconds: number;
  photoIntervalDistance: number;
  gimbalPitch: number;
  yaw: number;
  preflightAction: {
    hoverSeconds: number;
    height: number;
    gimbalPitch: number;
  };
}

export interface AreaRouteConfig {
  shootMode: PhotoMode;
  shootIntervalSeconds: number;
  shootIntervalDistance: number;
  gsd: number;
  flightHeight: number;
  overlapFront: number;
  overlapSide: number;
  routeDirection: number;
  takeoffPointMode: TakeoffPointMode;
}

export interface LoopRouteConfig {
  shootMode: PhotoMode;
  shootIntervalSeconds: number;
  shootIntervalDistance: number;
  targetResolution: number;
  flightHeight: number;
  direction: OrbitDirection;
  startAngle: number;
  radius: number;
  totalAngle: number;
  yawMode: HeadingMode;
  gimbalPitch: number;
  targetPoint: LoopTargetPoint | null;
}

export interface RouteMetrics {
  distance: number;
  estimatedSeconds: number;
  waypointCount: number;
  photoCount: number;
  totalAngle: number;
  areaSquareMeters: number;
}

export interface RouteRecordModel {
  id: string;
  code?: string;
  persisted: boolean;
  routeName: string;
  department: string;
  routeType: RouteType;
  creatorName: string;
  updatedAt: string;
  droneModel: string;
  description: string;
  points: PlannerPoint[];
  globalConfig: GlobalConfig;
  pointConfig: PointRouteConfig;
  areaConfig: AreaRouteConfig;
  loopConfig: LoopRouteConfig;
}

export interface CreateRouteForm {
  routeName: string;
  department: string;
  routeType: RouteType;
}

export interface RouteFilterForm {
  routeName: string;
  creatorName: string;
  department: string;
  routeType?: RouteType;
  updatedRange: string[];
}
