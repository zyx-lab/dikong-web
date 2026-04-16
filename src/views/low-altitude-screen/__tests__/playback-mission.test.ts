import { describe, expect, it } from "vitest";
import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "@/views/route/utils";
import { createPlaybackMission, getPlaybackState } from "../playback";

function createPointRoute(options?: {
  pointHoverSeconds?: number;
  preflightHoverSeconds?: number;
  preflightHeight?: number;
  takeoffHeight?: number;
  finishAction?: "returnHome" | "hover" | "land";
}) {
  const pointHoverSeconds = options?.pointHoverSeconds ?? 3;
  const preflightHoverSeconds = options?.preflightHoverSeconds ?? 3;
  const preflightHeight = options?.preflightHeight ?? 30;
  const takeoffHeight = options?.takeoffHeight ?? 30;
  const finishAction = options?.finishAction ?? "returnHome";
  const createTestPoint = (id: string, name: string, lng: number, lat: number) => ({
    id,
    name,
    lng,
    lat,
    alt: 60,
    hoverSeconds: pointHoverSeconds,
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
    globalConfig: {
      takeoffHeight,
      routeHeight: 60,
      returnHeight: 80,
      routeSpeed: 15,
      signalLossAction: "returnHome",
      finishAction,
      cameraMode: "wide",
      zoom: 2,
    },
    pointConfig: {
      yawMode: "auto",
      waypointType: "拍照",
      hoverSeconds: pointHoverSeconds,
      photoIntervalSeconds: 30,
      photoIntervalDistance: 200,
      gimbalPitch: -45,
      yaw: 0,
      preflightAction: {
        hoverSeconds: preflightHoverSeconds,
        height: preflightHeight,
        gimbalPitch: -45,
      },
    },
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

function createThreePointRoute(yawMode: "auto" | "manual" = "auto", waypointYaw = -90) {
  const createTestPoint = (id: string, name: string, lng: number, lat: number, yaw = 0) => ({
    id,
    name,
    lng,
    lat,
    alt: 60,
    hoverSeconds: 3,
    gimbalPitch: -45,
    yaw,
    shootPhoto: true,
    startRecord: false,
    stopRecord: false,
  });

  return createEmptyRoute({
    id: "route-turn-3",
    persisted: true,
    routeName: "转向验证航线",
    routeType: RouteType.POINT,
    points: [
      createTestPoint("p1", "航点1", 113.5285956152, 22.2551856026, 10),
      createTestPoint("p2", "航点2", 113.5263935271, 22.2501442839, waypointYaw),
      createTestPoint("p3", "航点3", 113.5270290622, 22.2499299869, 25),
    ],
    pointConfig: {
      yawMode,
      waypointType: "拍照",
      hoverSeconds: 3,
      photoIntervalSeconds: 30,
      photoIntervalDistance: 200,
      gimbalPitch: -45,
      yaw: 0,
      preflightAction: {
        hoverSeconds: 3,
        height: 30,
        gimbalPitch: -45,
      },
    },
  });
}

function normalizeHeading(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function findPreflightHoverSegment(mission: ReturnType<typeof createPlaybackMission>) {
  const firstWaypoint = mission.waypointCoordinates[0];

  return mission.segments.find(
    (segment) =>
      segment.phase === "hover" &&
      segment.durationSeconds > 0 &&
      segment.startCoordinate.lng === firstWaypoint.lng &&
      segment.startCoordinate.lat === firstWaypoint.lat &&
      segment.startCoordinate.alt !== firstWaypoint.alt
  );
}

describe("playback mission", () => {
  it("builds a point-route mission from absolute altitudes while preserving a relative display baseline", () => {
    const mission = (createPlaybackMission as any)(createPointRoute({ finishAction: "hover" }), {
      baseGroundAltitudeMeters: 100,
      landingGroundAltitudeMeters: 92,
    });

    expect(mission.waypointCoordinates[0]).toMatchObject({
      alt: 160,
    });
    expect(mission.segments[0]).toMatchObject({
      phase: "takeoff",
      startCoordinate: expect.objectContaining({ alt: 100 }),
      endCoordinate: expect.objectContaining({ alt: 130 }),
    });
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "landing",
      endCoordinate: expect.objectContaining({ alt: 92 }),
    });
    expect(mission.segments.at(-1)).toMatchObject({
      phase: "completed",
      endCoordinate: expect.objectContaining({ alt: 92 }),
    });
    expect(mission.pathCoordinates.at(-1)).toEqual(
      expect.objectContaining({
        alt: 92,
      })
    );
  });

  it("reports relative display altitude even when the playback coordinates are absolute", () => {
    const mission = (createPlaybackMission as any)(createPointRoute({ finishAction: "hover" }), {
      baseGroundAltitudeMeters: 100,
      landingGroundAltitudeMeters: 92,
    });
    const state = getPlaybackState(mission, mission.segments[0].durationSeconds);

    expect(state.currentCoordinate.alt).toBe(130);
    expect(state.displayAltitudeMeters).toBe(30);
  });

  it("builds an area-route mission with absolute altitudes and a terrain-grounded landing end", () => {
    const mission = (createPlaybackMission as any)(createAreaRoute(), {
      baseGroundAltitudeMeters: 120,
      landingGroundAltitudeMeters: 120,
    });

    expect(mission.waypointCoordinates[0]).toMatchObject({
      alt: 210,
    });
    expect(mission.segments[0]).toMatchObject({
      phase: "takeoff",
      startCoordinate: expect.objectContaining({ alt: 120 }),
      endCoordinate: expect.objectContaining({ alt: 150 }),
    });
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "landing",
      endCoordinate: expect.objectContaining({ alt: 120 }),
    });
    expect(mission.segments.at(-1)).toMatchObject({
      phase: "completed",
      endCoordinate: expect.objectContaining({ alt: 120 }),
    });
  });

  it("includes the preflight hover in the point-route timeline and total duration", () => {
    const mission = createPlaybackMission(
      createPointRoute({
        preflightHoverSeconds: 8,
        preflightHeight: 45,
      })
    );
    const missionWithoutPreflightHover = createPlaybackMission(
      createPointRoute({
        preflightHoverSeconds: 0,
        preflightHeight: 45,
      })
    );
    const preflightHover = findPreflightHoverSegment(mission);

    expect(preflightHover).toMatchObject({
      durationSeconds: 8,
      phase: "hover",
      waypointIndex: 0,
      startCoordinate: expect.objectContaining({ alt: 45 }),
      endCoordinate: expect.objectContaining({ alt: 45 }),
    });
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toHaveLength(11);
    expect(
      mission.totalDurationSeconds - missionWithoutPreflightHover.totalDurationSeconds
    ).toBeCloseTo(8, 6);
  });

  it("reports a stationary hover state while executing the preflight hover", () => {
    const mission = createPlaybackMission(
      createPointRoute({
        pointHoverSeconds: 0,
        preflightHoverSeconds: 6,
        preflightHeight: 45,
      })
    );
    const preflightHoverIndex = mission.segments.findIndex(
      (segment) => segment === findPreflightHoverSegment(mission)
    );
    const elapsedBeforeHover = mission.segments
      .slice(0, preflightHoverIndex)
      .reduce((total, segment) => total + segment.durationSeconds, 0);
    const state = getPlaybackState(mission, elapsedBeforeHover + 2);

    expect(state.phase).toBe("hover");
    expect(state.speedMetersPerSecond).toBe(0);
    expect(state.currentCoordinate).toMatchObject({
      lng: mission.waypointCoordinates[0].lng,
      lat: mission.waypointCoordinates[0].lat,
      alt: 45,
    });
  });

  it("skips the preflight hover segment when its configured duration is zero", () => {
    const mission = createPlaybackMission(
      createPointRoute({
        pointHoverSeconds: 0,
        preflightHoverSeconds: 0,
        preflightHeight: 45,
      })
    );

    expect(findPreflightHoverSegment(mission)).toBeUndefined();
  });

  it("does not create a zero-distance travel segment when the preflight height matches takeoff height", () => {
    const mission = createPlaybackMission(
      createPointRoute({
        pointHoverSeconds: 0,
        preflightHoverSeconds: 5,
        preflightHeight: 30,
        takeoffHeight: 30,
      })
    );
    const firstWaypoint = mission.waypointCoordinates[0];
    const zeroDistanceTravelSegments = mission.segments.filter(
      (segment) =>
        segment.phase !== "hover" &&
        segment.phase !== "turn" &&
        segment.phase !== "completed" &&
        segment.startCoordinate.lng === firstWaypoint.lng &&
        segment.startCoordinate.lat === firstWaypoint.lat &&
        segment.endCoordinate.lng === firstWaypoint.lng &&
        segment.endCoordinate.lat === firstWaypoint.lat &&
        segment.startCoordinate.alt === 30 &&
        segment.endCoordinate.alt === 30
    );

    expect(findPreflightHoverSegment(mission)).toMatchObject({
      durationSeconds: 5,
      startCoordinate: expect.objectContaining({ alt: 30 }),
    });
    expect(zeroDistanceTravelSegments).toHaveLength(0);
  });

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
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toHaveLength(11);
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          durationSeconds: 3,
          waypointIndex: 0,
        }),
      ])
    );
    expect(mission.segments.at(-3)).toMatchObject({
      phase: "returnHome",
      endCoordinate: expect.objectContaining({ alt: 80 }),
    });
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "landing",
      endCoordinate: expect.objectContaining({ alt: 0 }),
    });
    expect(mission.segments.at(-1)).toMatchObject({
      phase: "completed",
      durationSeconds: 0,
      endCoordinate: expect.objectContaining({ alt: 0 }),
    });
  });

  it("returns a completed playback state after the timeline ends", () => {
    const mission = createPlaybackMission(createPointRoute());

    const state = getPlaybackState(mission, mission.totalDurationSeconds + 5);

    expect(state.phase).toBe("completed");
    expect(state.currentWaypointIndex).toBe(10);
    expect(state.returning).toBe(false);
    expect(state.completed).toBe(true);
    expect(state.currentCoordinate.alt).toBe(0);
  });

  it("lands after returning home instead of finishing at the return height", () => {
    const mission = createPlaybackMission(createPointRoute());

    expect(mission.pathCoordinates.at(-1)).toEqual(
      expect.objectContaining({
        lng: mission.waypointCoordinates[0].lng,
        lat: mission.waypointCoordinates[0].lat,
        alt: 0,
      })
    );
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "landing",
      startCoordinate: expect.objectContaining({ alt: 80 }),
      endCoordinate: expect.objectContaining({ alt: 0 }),
    });
    expect(mission.segments.at(-1)).toMatchObject({
      phase: "completed",
      endCoordinate: expect.objectContaining({ alt: 0 }),
    });
  });

  it("lands in place at the final waypoint when finish action does not return home", () => {
    const mission = createPlaybackMission(
      createPointRoute({
        finishAction: "hover",
      })
    );
    const finalWaypoint = mission.waypointCoordinates.at(-1)!;

    expect(mission.segments.some((segment) => segment.phase === "returnHome")).toBe(false);
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "landing",
      startCoordinate: expect.objectContaining({
        lng: finalWaypoint.lng,
        lat: finalWaypoint.lat,
        alt: finalWaypoint.alt,
      }),
      endCoordinate: expect.objectContaining({
        lng: finalWaypoint.lng,
        lat: finalWaypoint.lat,
        alt: 0,
      }),
    });
    expect(mission.pathCoordinates.at(-1)).toEqual(
      expect.objectContaining({
        lng: finalWaypoint.lng,
        lat: finalWaypoint.lat,
        alt: 0,
      })
    );
  });

  it("reports a landing state before the mission becomes completed", () => {
    const mission = createPlaybackMission(createPointRoute());
    const landingIndex = mission.segments.findIndex((segment) => segment.phase === "landing");
    const elapsedBeforeLanding = mission.segments
      .slice(0, landingIndex)
      .reduce((total, segment) => total + segment.durationSeconds, 0);
    const state = getPlaybackState(mission, elapsedBeforeLanding + 0.5);

    expect(state.phase).toBe("landing");
    expect(state.currentWaypointIndex).toBe(mission.waypointCount);
    expect(state.returning).toBe(false);
    expect(state.completed).toBe(false);
    expect(state.currentCoordinate.alt).toBeLessThan(80);
    expect(state.currentCoordinate.alt).toBeGreaterThan(0);
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
      expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 0 }),
    ]);
    expect(mission.segments.filter((segment) => segment.phase === "hover")).toHaveLength(0);
    expect(mission.segments.filter((segment) => segment.phase === "cruise")).toHaveLength(5);
    expect(mission.segments.find((segment) => segment.phase === "returnHome")).toMatchObject({
      phase: "returnHome",
      endCoordinate: expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 80 }),
    });
    expect(mission.segments.at(-2)).toMatchObject({
      phase: "landing",
      endCoordinate: expect.objectContaining({ lng: 113.5282, lat: 22.2558, alt: 0 }),
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
      alt: 0,
    });
  });

  it("inserts a turn segment before leaving waypoint 2 on a point route", () => {
    const mission = createPlaybackMission(createThreePointRoute());
    const waypointTwo = mission.waypointCoordinates[1];
    const turnIndex = mission.segments.findIndex(
      (segment) =>
        segment.phase === "turn" &&
        segment.startCoordinate.lng === waypointTwo.lng &&
        segment.startCoordinate.lat === waypointTwo.lat
    );

    expect(turnIndex).toBeGreaterThan(-1);
    expect(mission.segments[turnIndex - 1]).toMatchObject({
      phase: "hover",
      waypointIndex: 1,
    });
    expect(mission.segments[turnIndex + 1]).toMatchObject({
      phase: "cruise",
      waypointIndex: 2,
    });
  });

  it("uses the waypoint yaw as the next heading target in manual mode", () => {
    const mission = createPlaybackMission(createThreePointRoute("manual", -90));
    const waypointTwo = mission.waypointCoordinates[1];
    const turnSegment = mission.segments.find(
      (segment) =>
        segment.phase === "turn" &&
        segment.startCoordinate.lng === waypointTwo.lng &&
        segment.startCoordinate.lat === waypointTwo.lat
    );
    const departingCruiseSegment = mission.segments.find(
      (segment) =>
        segment.phase === "cruise" &&
        segment.startCoordinate.lng === waypointTwo.lng &&
        segment.startCoordinate.lat === waypointTwo.lat &&
        segment.endCoordinate.lng === mission.waypointCoordinates[2].lng &&
        segment.endCoordinate.lat === mission.waypointCoordinates[2].lat
    );

    expect(turnSegment).toMatchObject({
      startHeadingDeg: expect.any(Number),
      endHeadingDeg: 270,
    });
    expect(departingCruiseSegment).toMatchObject({
      startHeadingDeg: 270,
      endHeadingDeg: 270,
    });
  });

  it("adds turn segments at area route corners and increases total duration", () => {
    const mission = createPlaybackMission(createAreaRoute());
    const turnSegments = mission.segments.filter((segment) => segment.phase === "turn");
    const nonTurnDuration = mission.segments
      .filter((segment) => segment.phase !== "turn")
      .reduce((total, segment) => total + segment.durationSeconds, 0);

    expect(turnSegments.length).toBeGreaterThan(0);
    expect(mission.totalDurationSeconds).toBeGreaterThan(nonTurnDuration);
  });

  it("keeps the position fixed and interpolates heading across the shortest arc during turn", () => {
    const coordinate = { lng: 113.5, lat: 22.2, alt: 60 };
    const mission = {
      cruiseHeight: 60,
      cruiseSpeed: 15,
      displayAltitudeBaselineMeters: 60,
      pathCoordinates: [coordinate],
      returnHeight: 80,
      routeId: "turn-only",
      routeName: "短弧转向验证",
      segments: [
        {
          startCoordinate: coordinate,
          endCoordinate: coordinate,
          durationSeconds: 1,
          phase: "turn" as const,
          waypointIndex: 0,
          startHeadingDeg: 350,
          endHeadingDeg: 10,
        },
        {
          startCoordinate: coordinate,
          endCoordinate: coordinate,
          durationSeconds: 0,
          phase: "completed" as const,
          waypointIndex: 0,
          startHeadingDeg: 10,
          endHeadingDeg: 10,
        },
      ],
      takeoffHeight: 30,
      totalDurationSeconds: 1,
      waypointCoordinates: [coordinate],
      waypointCount: 1,
    };

    const state = getPlaybackState(mission, 0.5);

    expect(state.phase).toBe("turn");
    expect(state.speedMetersPerSecond).toBe(0);
    expect(state.currentCoordinate).toEqual(coordinate);
    expect(state.headingDeg).toBeCloseTo(0, 6);
  });

  it("normalizes interpolated turn heading when crossing 0 degrees", () => {
    const coordinate = { lng: 113.5, lat: 22.2, alt: 60 };
    const mission = {
      cruiseHeight: 60,
      cruiseSpeed: 15,
      displayAltitudeBaselineMeters: 60,
      pathCoordinates: [coordinate],
      returnHeight: 80,
      routeId: "turn-wrap",
      routeName: "跨零度转向验证",
      segments: [
        {
          startCoordinate: coordinate,
          endCoordinate: coordinate,
          durationSeconds: 1,
          phase: "turn" as const,
          waypointIndex: 0,
          startHeadingDeg: 350,
          endHeadingDeg: 10,
        },
        {
          startCoordinate: coordinate,
          endCoordinate: coordinate,
          durationSeconds: 0,
          phase: "completed" as const,
          waypointIndex: 0,
          startHeadingDeg: 10,
          endHeadingDeg: 10,
        },
      ],
      takeoffHeight: 30,
      totalDurationSeconds: 1,
      waypointCoordinates: [coordinate],
      waypointCount: 1,
    };

    const quarterTurnState = getPlaybackState(mission, 0.25);

    expect(normalizeHeading(quarterTurnState.headingDeg ?? 0)).toBeCloseTo(355, 6);
  });
});
