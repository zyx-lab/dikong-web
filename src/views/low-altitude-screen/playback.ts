import { RouteType } from "@/api/flight/types";
import type { RouteRecordModel } from "@/views/route/types";
import { buildSceneModel } from "./scene-model";
import type {
  PlaybackCoordinate,
  PlaybackMission,
  PlaybackPhase,
  PlaybackSegment,
  PlaybackState,
} from "./types";

const MIN_SPEED = 1;
const ZERO_EPSILON = 1e-6;

export function createPlaybackMission(route: RouteRecordModel): PlaybackMission {
  if (route.routeType === RouteType.POINT) {
    return createPointPlaybackMission(route);
  }

  if (route.routeType === RouteType.AREA) {
    return createAreaPlaybackMission(route);
  }

  throw new Error("环状航线暂不支持模拟飞行");
}

function createPointPlaybackMission(route: RouteRecordModel): PlaybackMission {
  if (route.points.length < 2) {
    throw new Error("点状航线至少需要 2 个航点");
  }

  const waypointCoordinates = route.points.map((point) => ({
    lng: point.lng,
    lat: point.lat,
    alt: point.alt,
  }));
  const firstWaypoint = waypointCoordinates[0];
  const lastWaypoint = waypointCoordinates.at(-1) ?? firstWaypoint;
  const cruiseSpeed = Math.max(MIN_SPEED, route.globalConfig.routeSpeed || 0);
  const segments: PlaybackSegment[] = [];

  segments.push(
    createSegment(
      "takeoff",
      { ...firstWaypoint, alt: 0 },
      { ...firstWaypoint, alt: route.globalConfig.takeoffHeight },
      cruiseSpeed,
      0
    )
  );

  segments.push(
    createSegment(
      "cruise",
      { ...firstWaypoint, alt: route.globalConfig.takeoffHeight },
      { ...firstWaypoint, alt: firstWaypoint.alt || route.globalConfig.routeHeight },
      cruiseSpeed,
      0
    )
  );

  waypointCoordinates.forEach((coordinate, index) => {
    if (index > 0) {
      segments.push(
        createSegment("cruise", waypointCoordinates[index - 1], coordinate, cruiseSpeed, index)
      );
    }

    const hoverDuration = Math.max(0, route.points[index]?.hoverSeconds ?? 0);
    if (hoverDuration > 0) {
      segments.push({
        startCoordinate: coordinate,
        endCoordinate: coordinate,
        durationSeconds: hoverDuration,
        phase: "hover",
        waypointIndex: index,
      });
    }
  });

  const shouldReturnHome = route.globalConfig.finishAction === "returnHome";
  if (shouldReturnHome) {
    segments.push(
      createSegment(
        "returnHome",
        lastWaypoint,
        {
          ...firstWaypoint,
          alt: route.globalConfig.returnHeight,
        },
        cruiseSpeed,
        waypointCoordinates.length - 1
      )
    );
  }

  const completedCoordinate = shouldReturnHome
    ? {
        ...firstWaypoint,
        alt: route.globalConfig.returnHeight,
      }
    : lastWaypoint;

  segments.push({
    startCoordinate: completedCoordinate,
    endCoordinate: completedCoordinate,
    durationSeconds: 0,
    phase: "completed",
    waypointIndex: waypointCoordinates.length - 1,
  });

  return {
    cruiseHeight: route.globalConfig.routeHeight,
    cruiseSpeed,
    pathCoordinates: shouldReturnHome
      ? [...waypointCoordinates, { ...firstWaypoint, alt: route.globalConfig.returnHeight }]
      : waypointCoordinates,
    returnHeight: route.globalConfig.returnHeight,
    routeId: route.id,
    routeName: route.routeName,
    segments,
    takeoffHeight: route.globalConfig.takeoffHeight,
    totalDurationSeconds: segments.reduce((total, segment) => total + segment.durationSeconds, 0),
    waypointCoordinates,
    waypointCount: waypointCoordinates.length,
  };
}

function createAreaPlaybackMission(route: RouteRecordModel): PlaybackMission {
  if (route.points.length < 4) {
    throw new Error("面状航线请先完成范围框选");
  }

  const waypointCoordinates = route.points.slice(0, 4).map((point) => ({
    lng: point.lng,
    lat: point.lat,
    alt: route.areaConfig.flightHeight,
  }));
  const firstWaypoint = waypointCoordinates[0];
  const closedBoundaryCoordinates = [...waypointCoordinates, firstWaypoint];
  const cruiseSpeed = Math.max(MIN_SPEED, route.globalConfig.routeSpeed || 0);
  const segments: PlaybackSegment[] = [];

  segments.push(
    createSegment(
      "takeoff",
      { ...firstWaypoint, alt: 0 },
      { ...firstWaypoint, alt: route.globalConfig.takeoffHeight },
      cruiseSpeed,
      0
    )
  );

  segments.push(
    createSegment(
      "cruise",
      { ...firstWaypoint, alt: route.globalConfig.takeoffHeight },
      firstWaypoint,
      cruiseSpeed,
      0
    )
  );

  closedBoundaryCoordinates.slice(1).forEach((coordinate, index) => {
    const isClosingSegment = index === closedBoundaryCoordinates.length - 2;
    segments.push(
      createSegment(
        "cruise",
        closedBoundaryCoordinates[index],
        coordinate,
        cruiseSpeed,
        isClosingSegment ? waypointCoordinates.length - 1 : index + 1
      )
    );
  });

  const shouldReturnHome = route.globalConfig.finishAction === "returnHome";
  if (shouldReturnHome) {
    segments.push(
      createSegment(
        "returnHome",
        firstWaypoint,
        {
          ...firstWaypoint,
          alt: route.globalConfig.returnHeight,
        },
        cruiseSpeed,
        waypointCoordinates.length - 1
      )
    );
  }

  const completedCoordinate = shouldReturnHome
    ? {
        ...firstWaypoint,
        alt: route.globalConfig.returnHeight,
      }
    : firstWaypoint;

  segments.push({
    startCoordinate: completedCoordinate,
    endCoordinate: completedCoordinate,
    durationSeconds: 0,
    phase: "completed",
    waypointIndex: waypointCoordinates.length - 1,
  });

  return {
    cruiseHeight: route.areaConfig.flightHeight,
    cruiseSpeed,
    pathCoordinates: shouldReturnHome
      ? [...closedBoundaryCoordinates, { ...firstWaypoint, alt: route.globalConfig.returnHeight }]
      : closedBoundaryCoordinates,
    returnHeight: route.globalConfig.returnHeight,
    routeId: route.id,
    routeName: route.routeName,
    segments,
    takeoffHeight: route.globalConfig.takeoffHeight,
    totalDurationSeconds: segments.reduce((total, segment) => total + segment.durationSeconds, 0),
    waypointCoordinates,
    waypointCount: waypointCoordinates.length,
  };
}

export function getPlaybackState(mission: PlaybackMission, elapsedSeconds: number): PlaybackState {
  const clampedElapsed = Math.max(0, Math.min(elapsedSeconds, mission.totalDurationSeconds));
  if (clampedElapsed >= mission.totalDurationSeconds) {
    const completedSegment = mission.segments.at(-1)!;

    return {
      completed: true,
      currentCoordinate: completedSegment.endCoordinate,
      currentSegmentIndex: mission.segments.length - 1,
      currentWaypointIndex: mission.waypointCount,
      elapsedSeconds: clampedElapsed,
      flownCoordinates: collectFlownCoordinates(
        mission,
        mission.segments.length - 1,
        completedSegment,
        completedSegment.endCoordinate
      ),
      headingDeg: null,
      phase: "completed",
      progressRatio: 1,
      returning: false,
      speedMetersPerSecond: 0,
      totalDurationSeconds: mission.totalDurationSeconds,
      totalWaypointCount: mission.waypointCount,
    };
  }

  let elapsedCursor = 0;
  let currentSegmentIndex = mission.segments.length - 1;
  let currentSegment = mission.segments.at(-1)!;

  for (let index = 0; index < mission.segments.length; index += 1) {
    const segment = mission.segments[index];
    const segmentEnd = elapsedCursor + segment.durationSeconds;
    const isCurrent =
      clampedElapsed <= segmentEnd ||
      index === mission.segments.length - 1 ||
      segment.durationSeconds === 0;

    if (isCurrent) {
      currentSegment = segment;
      currentSegmentIndex = index;
      break;
    }

    elapsedCursor = segmentEnd;
  }

  const segmentElapsed = Math.max(0, clampedElapsed - elapsedCursor);
  const segmentProgress =
    currentSegment.durationSeconds <= ZERO_EPSILON
      ? 1
      : Math.max(0, Math.min(segmentElapsed / currentSegment.durationSeconds, 1));
  const currentCoordinate = interpolateCoordinate(
    currentSegment.startCoordinate,
    currentSegment.endCoordinate,
    segmentProgress
  );

  return {
    completed: currentSegment.phase === "completed",
    currentCoordinate,
    currentSegmentIndex,
    currentWaypointIndex:
      currentSegment.phase === "completed" || currentSegment.phase === "returnHome"
        ? mission.waypointCount
        : (currentSegment.waypointIndex ?? 0) + 1,
    elapsedSeconds: clampedElapsed,
    flownCoordinates: collectFlownCoordinates(
      mission,
      currentSegmentIndex,
      currentSegment,
      currentCoordinate
    ),
    headingDeg: getSegmentHeading(currentSegment),
    phase: currentSegment.phase,
    progressRatio:
      mission.totalDurationSeconds <= ZERO_EPSILON
        ? 1
        : clampedElapsed / mission.totalDurationSeconds,
    returning: currentSegment.phase === "returnHome",
    speedMetersPerSecond:
      currentSegment.phase === "hover" || currentSegment.phase === "completed"
        ? 0
        : mission.cruiseSpeed,
    totalDurationSeconds: mission.totalDurationSeconds,
    totalWaypointCount: mission.waypointCount,
  };
}

export function buildPlaybackSceneModel(mission: PlaybackMission, state: PlaybackState) {
  const bounds = computeBounds(mission.pathCoordinates);
  const flownRoute = state.flownCoordinates.map((coordinate) =>
    normalizeCoordinate(bounds, coordinate)
  );
  const marker = normalizeCoordinate(bounds, state.currentCoordinate);

  return buildSceneModel({
    routes:
      flownRoute.length > 1
        ? [
            {
              id: "flown-route",
              label: `${mission.routeName}-flown`,
              points: flownRoute,
            },
          ]
        : [],
    markers: [
      {
        id: "playback-drone",
        kind: "drone",
        label: "当前无人机",
        tone: "success",
        x: marker.x,
        y: marker.y,
      },
    ],
    selectedMarkerId: "playback-drone",
  });
}

function createSegment(
  phase: Exclude<PlaybackPhase, "hover" | "completed">,
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate,
  cruiseSpeed: number,
  waypointIndex: number
): PlaybackSegment {
  return {
    startCoordinate,
    endCoordinate,
    durationSeconds: calculateDistanceMeters(startCoordinate, endCoordinate) / cruiseSpeed,
    phase,
    waypointIndex,
  };
}

function interpolateCoordinate(
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate,
  progress: number
): PlaybackCoordinate {
  return {
    lng: startCoordinate.lng + (endCoordinate.lng - startCoordinate.lng) * progress,
    lat: startCoordinate.lat + (endCoordinate.lat - startCoordinate.lat) * progress,
    alt: startCoordinate.alt + (endCoordinate.alt - startCoordinate.alt) * progress,
  };
}

function collectFlownCoordinates(
  mission: PlaybackMission,
  currentSegmentIndex: number,
  currentSegment: PlaybackSegment,
  currentCoordinate: PlaybackCoordinate
) {
  const flownCoordinates: PlaybackCoordinate[] = [mission.segments[0].startCoordinate];

  for (let index = 0; index < currentSegmentIndex; index += 1) {
    pushCoordinate(flownCoordinates, mission.segments[index].endCoordinate);
  }

  if (currentSegment.phase !== "completed") {
    pushCoordinate(flownCoordinates, currentCoordinate);
  } else {
    pushCoordinate(flownCoordinates, currentSegment.endCoordinate);
  }

  return flownCoordinates;
}

function pushCoordinate(target: PlaybackCoordinate[], coordinate: PlaybackCoordinate) {
  const lastCoordinate = target.at(-1);
  if (
    lastCoordinate &&
    Math.abs(lastCoordinate.lng - coordinate.lng) < ZERO_EPSILON &&
    Math.abs(lastCoordinate.lat - coordinate.lat) < ZERO_EPSILON &&
    Math.abs(lastCoordinate.alt - coordinate.alt) < ZERO_EPSILON
  ) {
    return;
  }

  target.push(coordinate);
}

function getSegmentHeading(segment: PlaybackSegment) {
  if (
    Math.abs(segment.startCoordinate.lng - segment.endCoordinate.lng) < ZERO_EPSILON &&
    Math.abs(segment.startCoordinate.lat - segment.endCoordinate.lat) < ZERO_EPSILON
  ) {
    return null;
  }

  return calculateBearingDegrees(segment.startCoordinate, segment.endCoordinate);
}

function calculateBearingDegrees(
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate
) {
  const startLat = toRadians(startCoordinate.lat);
  const endLat = toRadians(endCoordinate.lat);
  const deltaLng = toRadians(endCoordinate.lng - startCoordinate.lng);
  const y = Math.sin(deltaLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);
  const degrees = (Math.atan2(y, x) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

function calculateDistanceMeters(
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate
) {
  const earthRadius = 6378137;
  const latitudeDelta = toRadians(endCoordinate.lat - startCoordinate.lat);
  const longitudeDelta = toRadians(endCoordinate.lng - startCoordinate.lng);
  const latitudeStart = toRadians(startCoordinate.lat);
  const latitudeEnd = toRadians(endCoordinate.lat);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitudeStart) *
      Math.cos(latitudeEnd) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const horizontalDistance = 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const altitudeDelta = endCoordinate.alt - startCoordinate.alt;
  return Math.sqrt(horizontalDistance * horizontalDistance + altitudeDelta * altitudeDelta);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function computeBounds(coordinates: PlaybackCoordinate[]) {
  const lngValues = coordinates.map((coordinate) => coordinate.lng);
  const latValues = coordinates.map((coordinate) => coordinate.lat);

  return {
    minLng: Math.min(...lngValues),
    maxLng: Math.max(...lngValues),
    minLat: Math.min(...latValues),
    maxLat: Math.max(...latValues),
  };
}

function normalizeCoordinate(
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  coordinate: PlaybackCoordinate
) {
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, ZERO_EPSILON);
  const latRange = Math.max(bounds.maxLat - bounds.minLat, ZERO_EPSILON);
  const paddingRatio = 0.12;
  const x = paddingRatio + ((coordinate.lng - bounds.minLng) / lngRange) * (1 - paddingRatio * 2);
  const y =
    paddingRatio + (1 - (coordinate.lat - bounds.minLat) / latRange) * (1 - paddingRatio * 2);

  return { x, y };
}
