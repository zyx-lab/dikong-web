import * as Cesium from "cesium";
import { RouteType } from "@/api/flight/types";
import type { RouteRecordModel } from "@/views/route/types";
import type { SceneOriginConfig } from "./types";

export interface PlaybackAltitudeContext {
  baseGroundAltitudeMeters: number;
  landingGroundAltitudeMeters: number;
}

export type PlaybackTerrainSampler = (
  coordinates: Array<{ lng: number; lat: number }>
) => Promise<Array<number | null | undefined>>;

let worldTerrainProviderPromise: Promise<
  Awaited<ReturnType<typeof Cesium.createWorldTerrainAsync>>
> | null = null;

export async function resolvePlaybackAltitudeContext(
  route: RouteRecordModel,
  sceneOrigin: SceneOriginConfig,
  terrainSampler: PlaybackTerrainSampler = samplePlaybackTerrainHeights
): Promise<PlaybackAltitudeContext> {
  const fallbackAltitudeMeters = sceneOrigin.altitudeMeters;
  const { baseCoordinate, landingCoordinate } = getPlaybackGroundReferenceCoordinates(route);

  try {
    const [baseGroundAltitudeMeters, landingGroundAltitudeMeters] = await terrainSampler([
      baseCoordinate,
      landingCoordinate,
    ]);

    return {
      baseGroundAltitudeMeters: normalizeSampledAltitude(
        baseGroundAltitudeMeters,
        fallbackAltitudeMeters
      ),
      landingGroundAltitudeMeters: normalizeSampledAltitude(
        landingGroundAltitudeMeters,
        fallbackAltitudeMeters
      ),
    };
  } catch {
    return {
      baseGroundAltitudeMeters: fallbackAltitudeMeters,
      landingGroundAltitudeMeters: fallbackAltitudeMeters,
    };
  }
}

export async function samplePlaybackTerrainHeights(
  coordinates: Array<{ lng: number; lat: number }>,
  ionToken: string | undefined = import.meta.env.VITE_CESIUM_ION_TOKEN
): Promise<Array<number | null>> {
  const terrainProvider = await getWorldTerrainProvider(ionToken);
  if (!terrainProvider) {
    return coordinates.map(() => null);
  }

  const positions = coordinates.map((coordinate) =>
    Cesium.Cartographic.fromDegrees(coordinate.lng, coordinate.lat)
  );

  try {
    await Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
    return positions.map((position) =>
      typeof position.height === "number" && Number.isFinite(position.height)
        ? position.height
        : null
    );
  } catch {
    return coordinates.map(() => null);
  }
}

function getPlaybackGroundReferenceCoordinates(route: RouteRecordModel) {
  if (route.routeType === RouteType.POINT) {
    const basePoint = route.points[0];
    const landingPoint =
      route.globalConfig.finishAction === "returnHome"
        ? basePoint
        : (route.points.at(-1) ?? basePoint);

    return {
      baseCoordinate: { lng: basePoint.lng, lat: basePoint.lat },
      landingCoordinate: { lng: landingPoint.lng, lat: landingPoint.lat },
    };
  }

  if (route.routeType === RouteType.AREA) {
    const basePoint = route.points[0];
    const landingPoint = basePoint;

    return {
      baseCoordinate: { lng: basePoint.lng, lat: basePoint.lat },
      landingCoordinate: { lng: landingPoint.lng, lat: landingPoint.lat },
    };
  }

  throw new Error("环状航线暂不支持模拟飞行");
}

async function getWorldTerrainProvider(ionToken?: string) {
  if (!ionToken) {
    return null;
  }

  Cesium.Ion.defaultAccessToken = ionToken;
  worldTerrainProviderPromise ??= Cesium.createWorldTerrainAsync();

  try {
    return await worldTerrainProviderPromise;
  } catch {
    worldTerrainProviderPromise = null;
    return null;
  }
}

function normalizeSampledAltitude(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
