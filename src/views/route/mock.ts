import { RouteType } from "@/api/flight/types";
import type { RouteRecordModel } from "./types";
import {
  buildAreaRectangle,
  createEmptyRoute,
  createLoopTargetPoint,
  createPlannerPoint,
} from "./utils";

export function createMockRoutes(): RouteRecordModel[] {
  const pointRoute = createEmptyRoute({
    id: "mock-route-1",
    code: "MOCK-R1",
    persisted: true,
    routeName: "【交通巡查】紫金山核心区交通要道航线",
    department: "市交通局",
    routeType: RouteType.POINT,
    creatorName: "系统管理员",
    updatedAt: "2026-03-11 09:30:55",
  });
  pointRoute.globalConfig.routeSpeed = 4.6;
  pointRoute.points = [
    createPlannerPoint(1, 118.8232, 32.0572, 30),
    createPlannerPoint(2, 118.8268, 32.0603, 29),
    createPlannerPoint(3, 118.8316, 32.0629, 28),
    createPlannerPoint(4, 118.8382, 32.0601, 32),
    createPlannerPoint(5, 118.8438, 32.0562, 31),
    createPlannerPoint(6, 118.8489, 32.0513, 33),
  ];

  const areaRoute = createEmptyRoute({
    id: "mock-route-2",
    code: "MOCK-R2",
    persisted: true,
    routeName: "【林场巡护】农林草场火警安全巡检航线",
    department: "市林业局",
    routeType: RouteType.AREA,
    creatorName: "系统管理员",
    updatedAt: "2026-03-11 09:30:55",
  });
  areaRoute.globalConfig.routeSpeed = 5.5;
  areaRoute.areaConfig.flightHeight = 90;
  areaRoute.areaConfig.shootIntervalDistance = 30;
  areaRoute.points = buildAreaRectangle(
    { lng: 118.7358, lat: 32.0962 },
    { lng: 118.7562, lat: 32.1111 },
    90
  );

  const loopRoute = createEmptyRoute({
    id: "mock-route-3",
    code: "MOCK-R3",
    persisted: true,
    routeName: "【文旅宣传】城市景点全景航拍航线",
    department: "市文旅局",
    routeType: RouteType.LOOP,
    creatorName: "系统管理员",
    updatedAt: "2026-03-11 09:30:55",
  });
  loopRoute.globalConfig.routeSpeed = 4.2;
  loopRoute.loopConfig.radius = 80;
  loopRoute.loopConfig.totalAngle = 360;
  loopRoute.loopConfig.flightHeight = 80;
  loopRoute.loopConfig.targetPoint = createLoopTargetPoint(80);
  if (loopRoute.loopConfig.targetPoint) {
    loopRoute.loopConfig.targetPoint.lng = 118.7816;
    loopRoute.loopConfig.targetPoint.lat = 32.0458;
  }

  return [pointRoute, areaRoute, loopRoute];
}
