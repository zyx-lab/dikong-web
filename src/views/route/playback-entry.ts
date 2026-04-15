import { RouteType } from "@/api/flight/types";
import type { RouteRecordModel } from "./types";

export function getPlaybackEntryState(
  route: RouteRecordModel | null | undefined,
  isDraftRoute: boolean,
  hasUnsavedChanges: boolean
) {
  if (!route || !route.persisted || isDraftRoute) {
    return {
      enabled: false,
      reason: "请先保存航线后再模拟飞行",
    };
  }

  if (route.routeType === RouteType.LOOP) {
    return {
      enabled: false,
      reason: "环状航线暂不支持模拟飞行",
    };
  }

  if (hasUnsavedChanges) {
    return {
      enabled: false,
      reason: "检测到未保存修改，请先保存当前航线",
    };
  }

  return {
    enabled: true,
    reason: "",
  };
}

export function buildPlaybackLocation(routeId: string) {
  return {
    path: "/low-altitude-screen",
    query: {
      mode: "playback",
      routeId,
    },
  };
}
