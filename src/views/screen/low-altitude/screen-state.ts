import { RouteType } from "@/api/flight/types";
import {
  DroneInsuranceStatus,
  DroneMaintenanceStatus,
  DroneStatus,
  PilotAccountStatus,
  PilotCertificateType,
  type DroneInfo,
  type PilotInfo,
} from "@/api/resource/types";
import type { RouteRecordModel } from "@/views/route/types";
import {
  calculateRouteMetrics,
  formatDistance,
  formatDuration,
  generateLoopPathCoordinates,
  getRouteTypeLabel,
} from "@/views/route/utils";

type MetricTone = "accent" | "normal" | "warning" | "danger";

export interface LowAltitudeMetric {
  label: string;
  value: number;
  note: string;
  tone: MetricTone;
}

export interface LowAltitudeBreakdownItem {
  label: string;
  value: number;
}

export interface LowAltitudeRosterItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  meta: string;
  tone: MetricTone;
}

export interface LowAltitudeGeoPoint {
  lng: number;
  lat: number;
  alt: number;
}

export interface LowAltitudeRouteOverlay {
  id: string;
  routeName: string;
  department: string;
  routeType: RouteType;
  color: string;
  highlight: boolean;
  labelText: string;
  labelPosition: LowAltitudeGeoPoint | null;
  path: LowAltitudeGeoPoint[];
  polygon: LowAltitudeGeoPoint[];
  sweepLines: LowAltitudeGeoPoint[][];
  orbitCenter: LowAltitudeGeoPoint | null;
  orbitRadius: number;
  metricsLabel: string;
}

export interface LowAltitudeRouteHighlight {
  id: string;
  routeName: string;
  department: string;
  routeTypeLabel: string;
  metricsLabel: string;
  color: string;
}

export interface LowAltitudeLegendItem {
  label: string;
  color: string;
}

export interface LowAltitudeSummaryItem {
  label: string;
  value: number;
  unit: string;
}

export interface LowAltitudeScreenState {
  topMetrics: LowAltitudeMetric[];
  droneMetrics: LowAltitudeMetric[];
  droneBreakdown: LowAltitudeBreakdownItem[];
  droneRoster: LowAltitudeRosterItem[];
  pilotMetrics: LowAltitudeMetric[];
  pilotBreakdown: LowAltitudeBreakdownItem[];
  pilotRoster: LowAltitudeRosterItem[];
  routeMetrics: LowAltitudeMetric[];
  routeSummary: LowAltitudeSummaryItem[];
  routeHighlights: LowAltitudeRouteHighlight[];
  routeLegend: LowAltitudeLegendItem[];
  routeOverlays: LowAltitudeRouteOverlay[];
}

export interface BuildLowAltitudeScreenStateInput {
  drones: DroneInfo[];
  pilots: PilotInfo[];
  routes: RouteRecordModel[];
}

const ROUTE_COLORS: Record<RouteType, string> = {
  [RouteType.POINT]: "#67b6ff",
  [RouteType.AREA]: "#69d8ba",
  [RouteType.LOOP]: "#f1c76a",
};

const ROUTE_LEGEND: LowAltitudeLegendItem[] = [
  { label: "点状航线", color: ROUTE_COLORS[RouteType.POINT] },
  { label: "面状航线", color: ROUTE_COLORS[RouteType.AREA] },
  { label: "环状航线", color: ROUTE_COLORS[RouteType.LOOP] },
];

export function buildLowAltitudeScreenState({
  drones,
  pilots,
  routes,
}: BuildLowAltitudeScreenStateInput): LowAltitudeScreenState {
  const persistedRoutes = routes.filter((route) => route.persisted !== false);

  const onlineDroneCount = drones.filter((item) => item.status === DroneStatus.ONLINE).length;
  const maintenanceAlertCount = drones.filter(
    (item) => item.maintenanceStatus !== DroneMaintenanceStatus.NORMAL
  ).length;
  const insuranceRiskCount = drones.filter(
    (item) => item.insuranceStatus !== DroneInsuranceStatus.NORMAL
  ).length;

  const enabledPilotCount = pilots.filter(
    (item) => item.status === PilotAccountStatus.ENABLED
  ).length;
  const assignedPilotCount = pilots.filter(
    (item) => item.assignedDroneName && item.assignedDroneName !== "暂未分配"
  ).length;
  const certificateReadyCount = pilots.filter((item) => Boolean(item.certificateScanUrl)).length;

  const pointRouteCount = persistedRoutes.filter(
    (item) => item.routeType === RouteType.POINT
  ).length;
  const areaRouteCount = persistedRoutes.filter((item) => item.routeType === RouteType.AREA).length;
  const loopRouteCount = persistedRoutes.filter((item) => item.routeType === RouteType.LOOP).length;

  const routeMetrics = persistedRoutes.map((route) => ({
    route,
    metrics: calculateRouteMetrics(route),
  }));
  const totalRouteDistance = routeMetrics.reduce((total, item) => total + item.metrics.distance, 0);
  const totalRouteDuration = routeMetrics.reduce(
    (total, item) => total + item.metrics.estimatedSeconds,
    0
  );

  const highlightedRouteIds = new Set(
    [...routeMetrics]
      .sort((left, right) => right.metrics.distance - left.metrics.distance)
      .slice(0, 4)
      .map((item) => item.route.id)
  );

  const routeOverlays = persistedRoutes.map((route) =>
    buildRouteOverlay(route, highlightedRouteIds)
  );
  const routeHighlights = routeMetrics
    .sort((left, right) => right.metrics.distance - left.metrics.distance)
    .slice(0, 4)
    .map(({ route, metrics }) => ({
      id: route.id,
      routeName: route.routeName,
      department: route.department || "未分组",
      routeTypeLabel: getRouteTypeLabel(route.routeType),
      metricsLabel: `${formatDistance(metrics.distance)} · ${formatDuration(metrics.estimatedSeconds)}`,
      color: ROUTE_COLORS[route.routeType],
    }));

  return {
    topMetrics: [
      {
        label: "无人机总量",
        value: drones.length,
        note: `在线 ${onlineDroneCount} 架，保养提醒 ${maintenanceAlertCount} 架`,
        tone: "accent",
      },
      {
        label: "飞手总量",
        value: pilots.length,
        note: `启用 ${enabledPilotCount} 人，已分配机体 ${assignedPilotCount} 人`,
        tone: "normal",
      },
      {
        label: "航线总量",
        value: persistedRoutes.length,
        note: `点状 ${pointRouteCount} / 面状 ${areaRouteCount} / 环状 ${loopRouteCount}`,
        tone: "warning",
      },
    ],
    droneMetrics: [
      { label: "总量", value: drones.length, note: "纳入大屏统计的无人机资源池", tone: "accent" },
      { label: "在线", value: onlineDroneCount, note: "具备实时调度能力的机体", tone: "normal" },
      {
        label: "保养提醒",
        value: maintenanceAlertCount,
        note: "存在保养提示或超期风险",
        tone: "warning",
      },
      {
        label: "保险风险",
        value: insuranceRiskCount,
        note: "即将到期或已经过期的保险",
        tone: "danger",
      },
    ],
    droneBreakdown: buildBreakdown(drones.map((item) => item.organization)),
    droneRoster: [...drones]
      .sort(
        (left, right) =>
          scoreDrone(left) - scoreDrone(right) || right.createdAt.localeCompare(left.createdAt)
      )
      .slice(0, 4)
      .map((item) => ({
        id: String(item.id),
        title: item.droneName,
        subtitle: `${item.organization} · ${item.model}`,
        status: getDroneStatusLabel(item),
        meta: item.airportName || "未绑定机场",
        tone: getDroneTone(item),
      })),
    pilotMetrics: [
      { label: "总量", value: pilots.length, note: "当前值守编组下的飞手资源", tone: "accent" },
      {
        label: "启用账号",
        value: enabledPilotCount,
        note: "可直接参与值守排班的账号",
        tone: "normal",
      },
      {
        label: "已分配机体",
        value: assignedPilotCount,
        note: "已明确绑定无人机协同关系",
        tone: "warning",
      },
      {
        label: "资料完备",
        value: certificateReadyCount,
        note: "证件扫描件已入库",
        tone: "accent",
      },
    ],
    pilotBreakdown: buildBreakdown(pilots.map((item) => item.organization)),
    pilotRoster: [...pilots]
      .sort(
        (left, right) =>
          scorePilot(left) - scorePilot(right) || right.createdAt.localeCompare(left.createdAt)
      )
      .slice(0, 4)
      .map((item) => ({
        id: String(item.id),
        title: item.name,
        subtitle: `${item.organization} · ${item.department}`,
        status: item.status === PilotAccountStatus.ENABLED ? "启用" : "停用",
        meta: `${getPilotCertificateLabel(item)} · ${item.assignedDroneName || "待分配机体"}`,
        tone: item.status === PilotAccountStatus.ENABLED ? "accent" : "warning",
      })),
    routeMetrics: [
      {
        label: "总量",
        value: persistedRoutes.length,
        note: "仅统计已持久化的航线记录",
        tone: "accent",
      },
      { label: "点状", value: pointRouteCount, note: "适合离散点位巡检", tone: "normal" },
      { label: "面状", value: areaRouteCount, note: "适合测绘与片区覆盖", tone: "normal" },
      { label: "环状", value: loopRouteCount, note: "适合环拍展示与观察", tone: "warning" },
    ],
    routeSummary: [
      { label: "累计航线长度", value: Number((totalRouteDistance / 1000).toFixed(2)), unit: "km" },
      { label: "理论飞行时长", value: Math.round(totalRouteDuration / 60), unit: "分钟" },
    ],
    routeHighlights,
    routeLegend: ROUTE_LEGEND,
    routeOverlays,
  };
}

function buildBreakdown(labels: string[]) {
  const counter = new Map<string, number>();

  labels.forEach((label) => {
    counter.set(label, (counter.get(label) ?? 0) + 1);
  });

  return [...counter.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, value]) => ({ label, value }));
}

function scoreDrone(drone: DroneInfo) {
  if (drone.status === DroneStatus.MAINTENANCE) return 0;
  if (drone.status === DroneStatus.ONLINE) return 1;
  return 2;
}

function scorePilot(pilot: PilotInfo) {
  if (
    pilot.status === PilotAccountStatus.ENABLED &&
    pilot.assignedDroneName &&
    pilot.assignedDroneName !== "暂未分配"
  ) {
    return 0;
  }

  if (pilot.status === PilotAccountStatus.ENABLED) return 1;
  return 2;
}

function getDroneTone(drone: DroneInfo): MetricTone {
  if (drone.status === DroneStatus.MAINTENANCE) return "danger";
  if (drone.status === DroneStatus.ONLINE) return "accent";
  return "normal";
}

function getDroneStatusLabel(drone: DroneInfo) {
  if (drone.status === DroneStatus.MAINTENANCE) return "维护中";
  if (drone.status === DroneStatus.ONLINE) return "在线";
  return "未对接";
}

function getPilotCertificateLabel(pilot: PilotInfo) {
  switch (pilot.certificateType) {
    case PilotCertificateType.AOPA:
      return "AOPA";
    case PilotCertificateType.ALPA:
      return "ALPA";
    case PilotCertificateType.UTC:
    default:
      return "UTC";
  }
}

function buildRouteOverlay(
  route: RouteRecordModel,
  highlightedRouteIds: Set<string>
): LowAltitudeRouteOverlay {
  const metrics = calculateRouteMetrics(route);
  const path =
    route.routeType === RouteType.LOOP
      ? generateLoopPathCoordinates(route)
      : route.points.map((point) => ({ lng: point.lng, lat: point.lat, alt: point.alt }));
  const polygon =
    route.routeType === RouteType.AREA
      ? route.points.map((point) => ({ lng: point.lng, lat: point.lat, alt: point.alt }))
      : [];
  const orbitCenter =
    route.routeType === RouteType.LOOP && route.loopConfig.targetPoint
      ? {
          lng: route.loopConfig.targetPoint.lng,
          lat: route.loopConfig.targetPoint.lat,
          alt: route.loopConfig.flightHeight,
        }
      : null;

  return {
    id: route.id,
    routeName: route.routeName,
    department: route.department,
    routeType: route.routeType,
    color: ROUTE_COLORS[route.routeType],
    highlight: highlightedRouteIds.has(route.id),
    labelText: route.routeName,
    labelPosition: getLabelPosition(route, path),
    path,
    polygon,
    sweepLines: route.routeType === RouteType.AREA ? buildAreaSweepLines(route) : [],
    orbitCenter,
    orbitRadius: route.routeType === RouteType.LOOP ? route.loopConfig.radius : 0,
    metricsLabel: `${formatDistance(metrics.distance)} · ${formatDuration(metrics.estimatedSeconds)}`,
  };
}

function getLabelPosition(route: RouteRecordModel, path: LowAltitudeGeoPoint[]) {
  if (route.routeType === RouteType.LOOP && route.loopConfig.targetPoint) {
    return {
      lng: route.loopConfig.targetPoint.lng,
      lat: route.loopConfig.targetPoint.lat,
      alt: route.loopConfig.flightHeight,
    };
  }

  if (route.routeType === RouteType.AREA && route.points.length > 0) {
    return getAveragePoint(
      route.points.map((point) => ({ lng: point.lng, lat: point.lat, alt: point.alt }))
    );
  }

  if (path.length === 0) {
    return null;
  }

  return path[Math.floor(path.length / 2)] ?? path[0];
}

function buildAreaSweepLines(route: RouteRecordModel) {
  if (route.points.length < 3) {
    return [];
  }

  const lngList = route.points.map((point) => point.lng);
  const latList = route.points.map((point) => point.lat);
  const minLng = Math.min(...lngList);
  const maxLng = Math.max(...lngList);
  const minLat = Math.min(...latList);
  const maxLat = Math.max(...latList);
  const altitude = route.areaConfig.flightHeight || route.points[0].alt;

  return Array.from({ length: 4 }, (_, index) => {
    const progress = (index + 1) / 5;
    const lat = maxLat - (maxLat - minLat) * progress;
    const inset = (maxLng - minLng) * (index % 2 === 0 ? 0.06 : 0.12);

    return [
      { lng: minLng + inset, lat, alt: altitude },
      { lng: maxLng - inset, lat, alt: altitude },
    ];
  });
}

function getAveragePoint(points: LowAltitudeGeoPoint[]) {
  if (points.length === 0) {
    return null;
  }

  const total = points.reduce(
    (result, point) => {
      result.lng += point.lng;
      result.lat += point.lat;
      result.alt += point.alt;
      return result;
    },
    { lng: 0, lat: 0, alt: 0 }
  );

  return {
    lng: total.lng / points.length,
    lat: total.lat / points.length,
    alt: total.alt / points.length,
  };
}
