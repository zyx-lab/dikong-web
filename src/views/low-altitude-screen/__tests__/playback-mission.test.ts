import { describe, expect, it } from "vitest";
import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "@/views/route/utils";
import { createPlaybackMission, getPlaybackState } from "../playback";

function createPointRoute() {
  const createTestPoint = (id: string, name: string, lng: number, lat: number) => ({
    id,
    name,
    lng,
    lat,
    alt: 60,
    hoverSeconds: 3,
    gimbalPitch: -45,
    yaw: 0,
    shootPhoto: true,
    startRecord: false,
    stopRecord: false,
  });

  return createEmptyRoute({
    id: "route-42",
    persisted: true,
    routeName: "港区巡检航线",
    routeType: RouteType.POINT,
    points: [
      createTestPoint("p1", "航点1", 113.5285956152, 22.2551856026),
      createTestPoint("p2", "航点2", 113.5263935271, 22.2501442839),
      createTestPoint("p3", "航点3", 113.5270290622, 22.2499299869),
      createTestPoint("p4", "航点4", 113.5294539552, 22.2554671057),
      createTestPoint("p5", "航点5", 113.5302826782, 22.2552704755),
      createTestPoint("p6", "航点6", 113.5284396671, 22.2508593688),
      createTestPoint("p7", "航点7", 113.5297608217, 22.2504226142),
      createTestPoint("p8", "航点8", 113.5315432984, 22.2554980483),
      createTestPoint("p9", "航点9", 113.5327008309, 22.2553038679),
      createTestPoint("p10", "航点10", 113.5309299295, 22.2501701106),
    ],
  });
}

function createAreaRoute() {
  const createAreaPoint = (id: string, name: string, lng: number, lat: number) => ({
    id,
    name,
    lng,
    lat,
    alt: 90,
    hoverSeconds: 0,
    gimbalPitch: -90,
    yaw: 0,
    shootPhoto: false,
    startRecord: false,
    stopRecord: false,
  });

  return createEmptyRoute({
    id: "area-route-9",
    persisted: true,
    routeName: "港区测绘范围",
    routeType: RouteType.AREA,
    points: [
      createAreaPoint("a1", "顶点1", 113.5282, 22.2558),
      createAreaPoint("a2", "顶点2", 113.5312, 22.2558),
      createAreaPoint("a3", "顶点3", 113.5312, 22.2521),
      createAreaPoint("a4", "顶点4", 113.5282, 22.2521),
    ],
    areaConfig: {
      shootMode: "distance",
      shootIntervalSeconds: 30,
      shootIntervalDistance: 30,
      gsd: 2,
      flightHeight: 90,
      overlapFront: 80,
      overlapSide: 70,
      routeDirection: 0,
      takeoffPointMode: "system",
    },
  });
}

describe("playback mission", () => {
  it("builds a point-route playback timeline with takeoff, hover, return-home, and completion", () => {
    const mission = createPlaybackMission(createPointRoute());

    expect(mission.routeId).toBe("route-42");
    expect(mission.waypointCount).toBe(10);
    expect(mission.takeoffHeight).toBe(30);
    expect(mission.cruiseHeight).toBe(60);
    expect(mission.returnHeight).toBe(80);
    expect(mission.cruiseSpeed).toBe(15);
    expect(mission.segments[0]).toMatchObject({
      phase: "takeoff",
      endCoordinate: expect.objectContaining({ alt: 30 }),
    });
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toHaveLength(10);
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          durationSeconds: 3,
          waypointIndex: 0,
        }),
      ])
    );
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "returnHome",
      endCoordinate: expect.objectContaining({ alt: 80 }),
    });
    expect(mission.segments.at(-1)).toMatchObject({
      phase: "completed",
      durationSeconds: 0,
    });
  });

  it("returns a completed playback state after the timeline ends", () => {
    const mission = createPlaybackMission(createPointRoute());

    const state = getPlaybackState(mission, mission.totalDurationSeconds + 5);

    expect(state.phase).toBe("completed");
    expect(state.currentWaypointIndex).toBe(10);
    expect(state.returning).toBe(false);
    expect(state.completed).toBe(true);
    expect(state.currentCoordinate.alt).toBe(80);
  });

  it("builds an area-route playback timeline by flying the boundary and closing the loop", () => {
    const mission = createPlaybackMission(createAreaRoute());

    expect(mission.routeId).toBe("area-route-9");
    expect(mission.waypointCount).toBe(4);
    expect(mission.cruiseHeight).toBe(90);
    expect(mission.waypointCoordinates).toHaveLength(4);
    expect(mission.pathCoordinates).toEqual([
      expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 90 }),
      expect.objectContaining({ lng: 113.5312, lat: 22.2558, alt: 90 }),
      expect.objectContaining({ lng: 113.5312, lat: 22.2521, alt: 90 }),
      expect.objectContaining({ lng: 113.5282, lat: 22.2521, alt: 90 }),
      expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 90 }),
      expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 80 }),
    ]);
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toHaveLength(0);
    expect(mission.segments.filter((segment) => segment.phase === "cruise")).toHaveLength(5);
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "returnHome",
      endCoordinate: expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 80 }),
    });
  });

  it("returns a completed playback state after an area-route playback timeline ends", () => {
    const mission = createPlaybackMission(createAreaRoute());

    const state = getPlaybackState(mission, mission.totalDurationSeconds + 5);

    expect(state.phase).toBe("completed");
    expect(state.currentWaypointIndex).toBe(4);
    expect(state.totalWaypointCount).toBe(4);
    expect(state.returning).toBe(false);
    expect(state.completed).toBe(true);
    expect(state.currentCoordinate).toMatchObject({
      lng: 113.5282,
      lat: 22.2558,
      alt: 80,
    });
  });
});
