import { describe, expect, it, vi } from "vitest";
import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "@/views/route/utils";
import { resolvePlaybackAltitudeContext } from "../playback-altitude";

function createPointRoute(finishAction: "returnHome" | "hover" | "land" = "returnHome") {
  return createEmptyRoute({
    id: "route-42",
    persisted: true,
    routeName: "港区巡检航线",
    routeType: RouteType.POINT,
    globalConfig: {
      takeoffHeight: 30,
      routeHeight: 60,
      returnHeight: 80,
      routeSpeed: 15,
      signalLossAction: "returnHome",
      finishAction,
      cameraMode: "wide",
      zoom: 2,
    },
    points: [
      {
        id: "p1",
        name: "航点1",
        lng: 113.5285956152,
        lat: 22.2551856026,
        alt: 60,
        hoverSeconds: 3,
        gimbalPitch: -45,
        yaw: 0,
        shootPhoto: true,
        startRecord: false,
        stopRecord: false,
      },
      {
        id: "p2",
        name: "航点2",
        lng: 113.5263935271,
        lat: 22.2501442839,
        alt: 60,
        hoverSeconds: 3,
        gimbalPitch: -45,
        yaw: 0,
        shootPhoto: true,
        startRecord: false,
        stopRecord: false,
      },
    ],
  });
}

const sceneOrigin = {
  longitude: 113.52958706944445,
  latitude: 22.252818819444443,
  altitudeMeters: 86.885,
};

describe("playback altitude context", () => {
  it("uses sampled first-point and landing-point terrain heights for a non-return point route", async () => {
    const terrainSampler = vi.fn().mockResolvedValue([101.25, 98.5]);

    const context = await resolvePlaybackAltitudeContext(
      createPointRoute("hover"),
      sceneOrigin,
      terrainSampler
    );

    expect(terrainSampler).toHaveBeenCalledWith([
      { lng: 113.5285956152, lat: 22.2551856026 },
      { lng: 113.5263935271, lat: 22.2501442839 },
    ]);
    expect(context).toEqual({
      baseGroundAltitudeMeters: 101.25,
      landingGroundAltitudeMeters: 98.5,
    });
  });

  it("reuses the first-point terrain height when the route returns home before landing", async () => {
    const terrainSampler = vi.fn().mockResolvedValue([101.25, 101.25]);

    const context = await resolvePlaybackAltitudeContext(
      createPointRoute("returnHome"),
      sceneOrigin,
      terrainSampler
    );

    expect(context).toEqual({
      baseGroundAltitudeMeters: 101.25,
      landingGroundAltitudeMeters: 101.25,
    });
  });

  it("falls back to the scene origin height when terrain sampling fails", async () => {
    const terrainSampler = vi.fn().mockRejectedValue(new Error("terrain-unavailable"));

    const context = await resolvePlaybackAltitudeContext(
      createPointRoute("hover"),
      sceneOrigin,
      terrainSampler
    );

    expect(context).toEqual({
      baseGroundAltitudeMeters: 86.885,
      landingGroundAltitudeMeters: 86.885,
    });
  });

  it("falls back per point when a sampled terrain height is missing", async () => {
    const terrainSampler = vi.fn().mockResolvedValue([undefined, Number.NaN]);

    const context = await resolvePlaybackAltitudeContext(
      createPointRoute("hover"),
      sceneOrigin,
      terrainSampler
    );

    expect(context).toEqual({
      baseGroundAltitudeMeters: 86.885,
      landingGroundAltitudeMeters: 86.885,
    });
  });
});
