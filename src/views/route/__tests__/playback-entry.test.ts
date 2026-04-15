import { describe, expect, it } from "vitest";
import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "../utils";
import { buildPlaybackLocation, getPlaybackEntryState } from "../playback-entry";

describe("route playback entry", () => {
  it("allows saved point routes without unsaved changes to enter playback mode", () => {
    const route = createEmptyRoute({
      id: "108",
      persisted: true,
      routeName: "测试航线",
      routeType: RouteType.POINT,
    });

    expect(getPlaybackEntryState(route, false, false)).toEqual({
      enabled: true,
      reason: "",
    });
    expect(buildPlaybackLocation(route.id)).toEqual({
      path: "/low-altitude-screen",
      query: {
        mode: "playback",
        routeId: "108",
      },
    });
  });

  it("allows saved area routes without unsaved changes to enter playback mode", () => {
    const route = createEmptyRoute({
      id: "area-1",
      persisted: true,
      routeName: "面状测试航线",
      routeType: RouteType.AREA,
    });

    expect(getPlaybackEntryState(route, false, false)).toEqual({
      enabled: true,
      reason: "",
    });
  });

  it("blocks unsaved, dirty, and loop routes with specific reasons", () => {
    const draftRoute = createEmptyRoute({
      id: "draft-1",
      persisted: false,
      routeType: RouteType.POINT,
    });
    const dirtySavedRoute = createEmptyRoute({
      id: "dirty-1",
      persisted: true,
      routeType: RouteType.POINT,
    });
    const loopRoute = createEmptyRoute({
      id: "loop-1",
      persisted: true,
      routeType: RouteType.LOOP,
    });

    expect(getPlaybackEntryState(draftRoute, true, false)).toEqual({
      enabled: false,
      reason: "请先保存航线后再模拟飞行",
    });
    expect(getPlaybackEntryState(loopRoute, false, false)).toEqual({
      enabled: false,
      reason: "环状航线暂不支持模拟飞行",
    });
    expect(getPlaybackEntryState(dirtySavedRoute, false, true)).toEqual({
      enabled: false,
      reason: "检测到未保存修改，请先保存当前航线",
    });
  });
});
