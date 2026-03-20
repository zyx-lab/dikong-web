import { describe, expect, it } from "vitest";

import { buildDroneMockData, buildPilotMockData } from "@/views/resource/shared/mock-data";
import { createMockRoutes } from "@/views/route/mock";
import { buildLowAltitudeScreenState } from "@/views/screen/low-altitude/screen-state";

function cloneRoute<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("buildLowAltitudeScreenState()", () => {
  it("aggregates drone, pilot and route statistics from shared mock data", () => {
    const state = buildLowAltitudeScreenState({
      drones: buildDroneMockData(),
      pilots: buildPilotMockData(),
      routes: createMockRoutes(),
    });

    expect(state.topMetrics.map((item) => [item.label, item.value])).toEqual([
      ["无人机总量", 8],
      ["飞手总量", 7],
      ["航线总量", 3],
    ]);

    expect(state.droneMetrics.map((item) => [item.label, item.value])).toEqual([
      ["总量", 8],
      ["在线", 4],
      ["保养提醒", 3],
      ["保险风险", 3],
    ]);

    expect(state.pilotMetrics.map((item) => [item.label, item.value])).toEqual([
      ["总量", 7],
      ["启用账号", 5],
      ["已分配机体", 5],
      ["资料完备", 7],
    ]);

    expect(state.routeMetrics.map((item) => [item.label, item.value])).toEqual([
      ["总量", 3],
      ["点状", 1],
      ["面状", 1],
      ["环状", 1],
    ]);

    expect(state.routeOverlays).toHaveLength(3);
    expect(state.routeLegend).toHaveLength(3);
    expect(state.routeHighlights).toHaveLength(3);
  });

  it("excludes draft routes and limits highlighted overlays", () => {
    const baseRoutes = createMockRoutes();
    const extraRoutes = baseRoutes.map((route, index) => ({
      ...cloneRoute(route),
      id: `extra-${index}`,
      routeName: `扩展航线-${index}`,
      persisted: true,
    }));
    const draftRoute = {
      ...cloneRoute(baseRoutes[0]),
      id: "draft-only",
      routeName: "草稿航线",
      persisted: false,
    };

    const state = buildLowAltitudeScreenState({
      drones: buildDroneMockData(),
      pilots: buildPilotMockData(),
      routes: [...baseRoutes, ...extraRoutes, draftRoute],
    });

    expect(state.routeMetrics[0].value).toBe(6);
    expect(state.routeOverlays.some((item) => item.id === "draft-only")).toBe(false);
    expect(state.routeHighlights).toHaveLength(4);
    expect(state.routeOverlays.filter((item) => item.highlight)).toHaveLength(4);
  });
});
