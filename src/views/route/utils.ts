import { RouteType } from "@/api/flight/types";
import type {
  AreaRouteConfig,
  GlobalConfig,
  LoopRouteConfig,
  LoopTargetPoint,
  PlannerPoint,
  PointRouteConfig,
  RouteMetrics,
  RouteRecordModel,
} from "./types";

const EARTH_RADIUS = 6378137;

export const DEFAULT_CENTER = {
  lng: 118.7969,
  lat: 32.0603,
};

export const DEFAULT_CREATOR_NAME = "当前用户";
export const DEFAULT_DRONE_MODEL = "多旋翼";
export const DEFAULT_ROUTE_DESCRIPTION = "低空智能巡检航线规划";

export function createRouteDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function createPointRouteConfig(): PointRouteConfig {
  return {
    yawMode: "auto",
    waypointType: "拍照",
    hoverSeconds: 3,
    photoIntervalSeconds: 30,
    photoIntervalDistance: 200,
    gimbalPitch: -45,
    yaw: 0,
  };
}

export function createAreaRouteConfig(): AreaRouteConfig {
  return {
    shootMode: "distance",
    shootIntervalSeconds: 30,
    shootIntervalDistance: 30,
    gsd: 2,
    flightHeight: 90,
    overlapFront: 80,
    overlapSide: 70,
    routeDirection: 0,
    takeoffPointMode: "system",
  };
}

export function createLoopTargetPoint(alt: number = 80): LoopTargetPoint {
  return {
    lng: DEFAULT_CENTER.lng,
    lat: DEFAULT_CENTER.lat,
    alt,
  };
}

export function createLoopRouteConfig(): LoopRouteConfig {
  return {
    shootMode: "distance",
    shootIntervalSeconds: 30,
    shootIntervalDistance: 30,
    targetResolution: 2,
    flightHeight: 80,
    direction: "clockwise",
    startAngle: 0,
    radius: 80,
    totalAngle: 360,
    yawMode: "track",
    gimbalPitch: -45,
    targetPoint: createLoopTargetPoint(80),
  };
}

export function createGlobalConfig(): GlobalConfig {
  return {
    takeoffHeight: 30,
    routeHeight: 60,
    returnHeight: 80,
    routeSpeed: 15,
    signalLossAction: "returnHome",
    finishAction: "returnHome",
    cameraMode: "wide",
    zoom: 2,
  };
}

export function createPlannerPoint(
  index: number,
  lng: number,
  lat: number,
  alt: number,
  options?: Partial<PlannerPoint>
): PlannerPoint {
  return {
    id: options?.id || `waypoint-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: options?.name || `航点${index}`,
    lng,
    lat,
    alt,
    hoverSeconds: options?.hoverSeconds ?? 3,
    gimbalPitch: options?.gimbalPitch ?? -45,
    yaw: options?.yaw ?? 0,
    shootPhoto: options?.shootPhoto ?? true,
    startRecord: options?.startRecord ?? false,
    stopRecord: options?.stopRecord ?? false,
  };
}

export function normalizeWaypointNames(points: PlannerPoint[]): PlannerPoint[] {
  return points.map((point, index) => ({
    ...point,
    name: `航点${index + 1}`,
  }));
}

export function createEmptyRoute(overrides?: Partial<RouteRecordModel>): RouteRecordModel {
  const pointConfig = createPointRouteConfig();
  const areaConfig = createAreaRouteConfig();
  const loopConfig = createLoopRouteConfig();
  const routeType = overrides?.routeType ?? RouteType.POINT;

  if (routeType !== RouteType.LOOP) {
    loopConfig.targetPoint = null;
  }

  return {
    id: overrides?.id ?? createRouteDraftId(),
    code: overrides?.code,
    persisted: overrides?.persisted ?? false,
    routeName: overrides?.routeName ?? "",
    department: overrides?.department ?? "",
    routeType,
    creatorName: overrides?.creatorName ?? DEFAULT_CREATOR_NAME,
    updatedAt: overrides?.updatedAt ?? formatDateTime(new Date()),
    droneModel: overrides?.droneModel ?? DEFAULT_DRONE_MODEL,
    description: overrides?.description ?? DEFAULT_ROUTE_DESCRIPTION,
    points: overrides?.points ?? [],
    globalConfig: overrides?.globalConfig ?? createGlobalConfig(),
    pointConfig: overrides?.pointConfig ?? pointConfig,
    areaConfig: overrides?.areaConfig ?? areaConfig,
    loopConfig: overrides?.loopConfig ?? loopConfig,
  };
}

export function cloneRouteRecord(route: RouteRecordModel): RouteRecordModel {
  return JSON.parse(JSON.stringify(route)) as RouteRecordModel;
}

export function getRouteTypeLabel(type: RouteType): string {
  switch (type) {
    case RouteType.AREA:
      return "面状航线";
    case RouteType.LOOP:
      return "环状航线";
    case RouteType.POINT:
    default:
      return "点状航线";
  }
}

export function getRouteInstruction(
  type: RouteType,
  pendingAreaSelection: boolean = false
): string {
  if (type === RouteType.AREA) {
    return pendingAreaSelection
      ? "已设置框选起点，请再次点击地图完成范围框选"
      : "鼠标连续两次点击地图框选规划范围";
  }

  if (type === RouteType.LOOP) {
    return "鼠标点击地图设置环绕中心";
  }

  return "鼠标点击地图逐个添加航点";
}

export function formatDistance(distance: number): string {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)}km`;
  }
  return `${Math.round(distance)}m`;
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}时${minutes}分${remainingSeconds}秒`;
  }
  return `${minutes}分${remainingSeconds}秒`;
}

export function buildAreaRectangle(
  start: { lng: number; lat: number },
  end: { lng: number; lat: number },
  alt: number
): PlannerPoint[] {
  return normalizeWaypointNames([
    createPlannerPoint(1, start.lng, start.lat, alt),
    createPlannerPoint(2, end.lng, start.lat, alt),
    createPlannerPoint(3, end.lng, end.lat, alt),
    createPlannerPoint(4, start.lng, end.lat, alt),
  ]);
}

export function calculateRouteMetrics(route: RouteRecordModel): RouteMetrics {
  const speed = Math.max(1, route.globalConfig.routeSpeed);

  if (route.routeType === RouteType.LOOP) {
    const angleRatio = Math.max(0, Math.abs(route.loopConfig.totalAngle) / 360);
    const distance = 2 * Math.PI * Math.max(1, route.loopConfig.radius) * angleRatio;
    const estimatedSeconds = distance / speed;
    const photoCount = estimatePhotoCount(
      distance,
      route.loopConfig.shootMode,
      route.loopConfig.shootIntervalSeconds,
      route.loopConfig.shootIntervalDistance,
      speed
    );

    return {
      distance,
      estimatedSeconds,
      waypointCount: 1,
      photoCount,
      totalAngle: Math.abs(route.loopConfig.totalAngle),
      areaSquareMeters: 0,
    };
  }

  if (route.routeType === RouteType.AREA) {
    const areaSquareMeters = calculatePolygonArea(route.points);
    const distance = estimateAreaSurveyDistance(route.points, route.areaConfig);
    const estimatedSeconds = distance / speed;
    const photoCount = estimatePhotoCount(
      distance,
      route.areaConfig.shootMode,
      route.areaConfig.shootIntervalSeconds,
      route.areaConfig.shootIntervalDistance,
      speed
    );

    return {
      distance,
      estimatedSeconds,
      waypointCount: route.points.length,
      photoCount,
      totalAngle: 0,
      areaSquareMeters,
    };
  }

  const distance = calculatePathDistance(route.points);
  const hoverSeconds = route.points.reduce((total, point) => total + point.hoverSeconds, 0);

  return {
    distance,
    estimatedSeconds: distance / speed + hoverSeconds,
    waypointCount: route.points.length,
    photoCount: route.points.filter((point) => point.shootPhoto).length,
    totalAngle: 0,
    areaSquareMeters: 0,
  };
}

export function getRouteStatItems(route: RouteRecordModel) {
  const metrics = calculateRouteMetrics(route);
  const commonItems = [
    {
      label: "航线长度",
      value: formatDistance(metrics.distance),
    },
    {
      label: "预计时长",
      value: formatDuration(metrics.estimatedSeconds),
    },
  ];

  if (route.routeType === RouteType.AREA) {
    return [
      ...commonItems,
      {
        label: "照片数量",
        value: `${metrics.photoCount}`,
      },
    ];
  }

  if (route.routeType === RouteType.LOOP) {
    return [
      ...commonItems,
      {
        label: "总角度",
        value: `${metrics.totalAngle}°`,
      },
    ];
  }

  return [
    ...commonItems,
    {
      label: "航点数量",
      value: `${metrics.waypointCount}`,
    },
  ];
}

export function offsetCoordinate(
  origin: { lng: number; lat: number },
  distance: number,
  bearingDegrees: number
): { lng: number; lat: number } {
  const angularDistance = distance / EARTH_RADIUS;
  const bearing = toRadians(bearingDegrees);
  const latitude = toRadians(origin.lat);
  const longitude = toRadians(origin.lng);

  const nextLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
      Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const nextLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(nextLatitude)
    );

  return {
    lng: toDegrees(nextLongitude),
    lat: toDegrees(nextLatitude),
  };
}

export function generateLoopPathCoordinates(
  route: RouteRecordModel
): Array<{ lng: number; lat: number; alt: number }> {
  const targetPoint = route.loopConfig.targetPoint;
  if (!targetPoint) {
    return [];
  }

  const directionFactor = route.loopConfig.direction === "clockwise" ? 1 : -1;
  const segments = Math.max(48, Math.ceil(Math.abs(route.loopConfig.totalAngle) / 6));
  const positions: Array<{ lng: number; lat: number; alt: number }> = [];

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    const angle =
      route.loopConfig.startAngle + directionFactor * route.loopConfig.totalAngle * progress;
    const coordinate = offsetCoordinate(targetPoint, route.loopConfig.radius, angle);
    positions.push({
      lng: coordinate.lng,
      lat: coordinate.lat,
      alt: route.loopConfig.flightHeight,
    });
  }

  return positions;
}

function calculatePathDistance(points: PlannerPoint[]): number {
  return points.slice(1).reduce((distance, point, index) => {
    return distance + calculatePointDistance(points[index], point);
  }, 0);
}

function calculatePointDistance(start: PlannerPoint, end: PlannerPoint): number {
  const latitudeDelta = toRadians(end.lat - start.lat);
  const longitudeDelta = toRadians(end.lng - start.lng);
  const latitudeStart = toRadians(start.lat);
  const latitudeEnd = toRadians(end.lat);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitudeStart) *
      Math.cos(latitudeEnd) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  return 2 * EARTH_RADIUS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculatePolygonArea(points: PlannerPoint[]): number {
  if (points.length < 3) {
    return 0;
  }

  const averageLatitude = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const projectedPoints = points.map((point) => projectToMeters(point, averageLatitude));
  let total = 0;

  for (let index = 0; index < projectedPoints.length; index += 1) {
    const current = projectedPoints[index];
    const next = projectedPoints[(index + 1) % projectedPoints.length];
    total += current.x * next.y - next.x * current.y;
  }

  return Math.abs(total) / 2;
}

function estimateAreaSurveyDistance(points: PlannerPoint[], config: AreaRouteConfig): number {
  if (points.length < 3) {
    return 0;
  }

  const averageLatitude = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const projectedPoints = points.map((point) => projectToMeters(point, averageLatitude));
  const xValues = projectedPoints.map((point) => point.x);
  const yValues = projectedPoints.map((point) => point.y);
  const width = Math.max(...xValues) - Math.min(...xValues);
  const height = Math.max(...yValues) - Math.min(...yValues);
  const lineSpacing = Math.max(
    12,
    config.flightHeight * Math.max(0.2, 1 - config.overlapSide / 100) * 1.6
  );
  const lineCount = Math.max(1, Math.ceil(width / lineSpacing));

  return lineCount * Math.max(height, 20) + Math.max(lineCount - 1, 0) * lineSpacing;
}

function estimatePhotoCount(
  distance: number,
  shootMode: AreaRouteConfig["shootMode"] | LoopRouteConfig["shootMode"],
  shootIntervalSeconds: number,
  shootIntervalDistance: number,
  speed: number
): number {
  if (distance <= 0) {
    return 0;
  }

  if (shootMode === "time") {
    const intervalDistance = Math.max(1, speed * Math.max(1, shootIntervalSeconds));
    return Math.max(1, Math.round(distance / intervalDistance));
  }

  return Math.max(1, Math.round(distance / Math.max(1, shootIntervalDistance)));
}

function projectToMeters(point: { lng: number; lat: number }, baseLatitude: number) {
  const baseLatitudeRadians = toRadians(baseLatitude);
  return {
    x: EARTH_RADIUS * toRadians(point.lng) * Math.cos(baseLatitudeRadians),
    y: EARTH_RADIUS * toRadians(point.lat),
  };
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}
