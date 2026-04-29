import { RouteType } from "@/api/flight/types";
import type { HeadingMode, RouteRecordModel } from "@/views/route/types";
import type { PlaybackAltitudeContext } from "./playback-altitude";
import { buildSceneModel } from "./scene-model";
import type {
  PlaybackCoordinate,
  PlaybackMission,
  PlaybackPhase,
  PlaybackSegment,
  PlaybackState,
} from "./types";

const MIN_SPEED = 1;
const MIN_TURN_SECONDS = 0.4;
const MIN_TURN_ANGLE_DEGREES = 2;
const TURN_RATE_DEGREES_PER_SECOND = 90;
const ZERO_EPSILON = 1e-6;
const DEFAULT_PLAYBACK_ALTITUDE_CONTEXT: PlaybackAltitudeContext = {
  baseGroundAltitudeMeters: 0,
  landingGroundAltitudeMeters: 0,
};

export function createPlaybackMission(
  route: RouteRecordModel,
  altitudeContext: PlaybackAltitudeContext = DEFAULT_PLAYBACK_ALTITUDE_CONTEXT
): PlaybackMission {
  if (route.routeType === RouteType.POINT) {
    return createPointPlaybackMission(route, altitudeContext);
  }

  if (route.routeType === RouteType.AREA) {
    return createAreaPlaybackMission(route, altitudeContext);
  }

  throw new Error("环状航线暂不支持模拟飞行");
}

function createPointPlaybackMission(
  route: RouteRecordModel,
  altitudeContext: PlaybackAltitudeContext
): PlaybackMission {
  if (route.points.length < 2) {
    throw new Error("点状航线至少需要 2 个航点");
  }

  const waypointCoordinates = route.points.map((point) => ({
    lng: point.lng,
    lat: point.lat,
    alt: toAbsoluteAltitude(point.alt, altitudeContext.baseGroundAltitudeMeters),
  }));
  const firstWaypoint = waypointCoordinates[0];
  const lastWaypoint = waypointCoordinates.at(-1) ?? firstWaypoint;
  const cruiseSpeed = Math.max(MIN_SPEED, route.globalConfig.routeSpeed || 0);
  const segments: PlaybackSegment[] = [];
  const takeoffCoordinate = {
    ...firstWaypoint,
    alt: toAbsoluteAltitude(
      route.globalConfig.takeoffHeight,
      altitudeContext.baseGroundAltitudeMeters
    ),
  };
  const preflightCoordinate = {
    ...firstWaypoint,
    alt: toAbsoluteAltitude(
      route.pointConfig.preflightAction.height,
      altitudeContext.baseGroundAltitudeMeters
    ),
  };
  const firstCruiseCoordinate = {
    ...firstWaypoint,
    alt:
      firstWaypoint.alt ||
      toAbsoluteAltitude(route.globalConfig.routeHeight, altitudeContext.baseGroundAltitudeMeters),
  };
  const preflightHoverDuration = Math.max(0, route.pointConfig.preflightAction.hoverSeconds || 0);
  const firstCruiseHeading =
    resolvePointHeadingModeHeading(route, 0, firstWaypoint, waypointCoordinates[1]) ??
    calculateBearingDegrees(firstWaypoint, waypointCoordinates[1]);

  pushTravelSegment(
    segments,
    "takeoff",
    { ...firstWaypoint, alt: altitudeContext.baseGroundAltitudeMeters },
    takeoffCoordinate,
    cruiseSpeed,
    0,
    firstCruiseHeading
  );

  pushTravelSegment(
    segments,
    "cruise",
    takeoffCoordinate,
    preflightCoordinate,
    cruiseSpeed,
    0,
    firstCruiseHeading
  );

  pushStationarySegment(
    segments,
    "hover",
    preflightCoordinate,
    preflightHoverDuration,
    0,
    firstCruiseHeading
  );

  pushTravelSegment(
    segments,
    "cruise",
    preflightCoordinate,
    firstCruiseCoordinate,
    cruiseSpeed,
    0,
    firstCruiseHeading
  );

  waypointCoordinates.forEach((coordinate, index) => {
    if (index > 0) {
      segments.push(
        createTravelSegment(
          "cruise",
          waypointCoordinates[index - 1],
          coordinate,
          cruiseSpeed,
          index,
          resolvePointHeadingModeHeading(
            route,
            index - 1,
            waypointCoordinates[index - 1],
            coordinate
          )
        )
      );
    }

    const hoverDuration = Math.max(0, route.points[index]?.hoverSeconds ?? 0);
    if (hoverDuration > 0) {
      segments.push(
        createStationarySegment(
          "hover",
          coordinate,
          hoverDuration,
          index,
          getSegmentEndHeading(segments.at(-1)) ??
            resolvePointHeadingModeHeading(route, index, coordinate, waypointCoordinates[index + 1])
        )
      );
    }
  });

  const shouldReturnHome = route.globalConfig.finishAction === "returnHome";
  if (shouldReturnHome) {
    segments.push(
      createTravelSegment(
        "returnHome",
        lastWaypoint,
        {
          ...firstWaypoint,
          alt: toAbsoluteAltitude(
            route.globalConfig.returnHeight,
            altitudeContext.baseGroundAltitudeMeters
          ),
        },
        cruiseSpeed,
        waypointCoordinates.length - 1,
        calculateBearingIfChanged(lastWaypoint, firstWaypoint)
      )
    );
  }

  const segmentsWithTurns = insertTurnSegments(segments);
  const landingStartCoordinate = shouldReturnHome
    ? {
        ...firstWaypoint,
        alt: toAbsoluteAltitude(
          route.globalConfig.returnHeight,
          altitudeContext.baseGroundAltitudeMeters
        ),
      }
    : lastWaypoint;
  const landingEndCoordinate = {
    ...landingStartCoordinate,
    alt: altitudeContext.landingGroundAltitudeMeters,
  };
  const landingHeading =
    getSegmentEndHeading(segmentsWithTurns.at(-1)) ??
    getSegmentStartHeading(segmentsWithTurns.at(-1));

  pushTravelSegment(
    segmentsWithTurns,
    "landing",
    landingStartCoordinate,
    landingEndCoordinate,
    cruiseSpeed,
    waypointCoordinates.length - 1,
    landingHeading
  );

  const completedCoordinate = landingEndCoordinate;
  const completedHeading =
    getSegmentEndHeading(segmentsWithTurns.at(-1)) ??
    getSegmentStartHeading(segmentsWithTurns.at(-1));

  segmentsWithTurns.push(
    createStationarySegment(
      "completed",
      completedCoordinate,
      0,
      waypointCoordinates.length - 1,
      completedHeading
    )
  );

  return {
    cruiseHeight: route.globalConfig.routeHeight,
    cruiseSpeed,
    displayAltitudeBaselineMeters: altitudeContext.baseGroundAltitudeMeters,
    pathCoordinates: [
      ...waypointCoordinates,
      ...(shouldReturnHome
        ? [
            {
              ...firstWaypoint,
              alt: toAbsoluteAltitude(
                route.globalConfig.returnHeight,
                altitudeContext.baseGroundAltitudeMeters
              ),
            },
          ]
        : []),
      landingEndCoordinate,
    ],
    returnHeight: route.globalConfig.returnHeight,
    routeId: route.id,
    routeName: route.routeName,
    segments: segmentsWithTurns,
    takeoffHeight: route.globalConfig.takeoffHeight,
    totalDurationSeconds: segmentsWithTurns.reduce(
      (total, segment) => total + segment.durationSeconds,
      0
    ),
    waypointCoordinates,
    waypointCount: waypointCoordinates.length,
  };
}

function createAreaPlaybackMission(
  route: RouteRecordModel,
  altitudeContext: PlaybackAltitudeContext
): PlaybackMission {
  if (route.points.length < 4) {
    throw new Error("面状航线请先完成范围框选");
  }

  const waypointCoordinates = route.points.slice(0, 4).map((point) => ({
    lng: point.lng,
    lat: point.lat,
    alt: toAbsoluteAltitude(
      route.areaConfig.flightHeight,
      altitudeContext.baseGroundAltitudeMeters
    ),
  }));
  const firstWaypoint = waypointCoordinates[0];
  const closedBoundaryCoordinates = [...waypointCoordinates, firstWaypoint];
  const cruiseSpeed = Math.max(MIN_SPEED, route.globalConfig.routeSpeed || 0);
  const segments: PlaybackSegment[] = [];
  const firstCruiseHeading = calculateBearingDegrees(
    closedBoundaryCoordinates[0],
    closedBoundaryCoordinates[1]
  );

  segments.push(
    createTravelSegment(
      "takeoff",
      { ...firstWaypoint, alt: altitudeContext.baseGroundAltitudeMeters },
      {
        ...firstWaypoint,
        alt: toAbsoluteAltitude(
          route.globalConfig.takeoffHeight,
          altitudeContext.baseGroundAltitudeMeters
        ),
      },
      cruiseSpeed,
      0,
      firstCruiseHeading
    )
  );

  segments.push(
    createTravelSegment(
      "cruise",
      {
        ...firstWaypoint,
        alt: toAbsoluteAltitude(
          route.globalConfig.takeoffHeight,
          altitudeContext.baseGroundAltitudeMeters
        ),
      },
      firstWaypoint,
      cruiseSpeed,
      0,
      firstCruiseHeading
    )
  );

  closedBoundaryCoordinates.slice(1).forEach((coordinate, index) => {
    const startCoordinate = closedBoundaryCoordinates[index];
    const isClosingSegment = index === closedBoundaryCoordinates.length - 2;
    segments.push(
      createTravelSegment(
        "cruise",
        startCoordinate,
        coordinate,
        cruiseSpeed,
        isClosingSegment ? waypointCoordinates.length - 1 : index + 1,
        calculateBearingDegrees(startCoordinate, coordinate)
      )
    );
  });

  const shouldReturnHome = route.globalConfig.finishAction === "returnHome";
  if (shouldReturnHome) {
    segments.push(
      createTravelSegment(
        "returnHome",
        firstWaypoint,
        {
          ...firstWaypoint,
          alt: toAbsoluteAltitude(
            route.globalConfig.returnHeight,
            altitudeContext.baseGroundAltitudeMeters
          ),
        },
        cruiseSpeed,
        waypointCoordinates.length - 1,
        getSegmentEndHeading(segments.at(-1)) ?? firstCruiseHeading
      )
    );
  }

  const segmentsWithTurns = insertTurnSegments(segments);
  const landingStartCoordinate = shouldReturnHome
    ? {
        ...firstWaypoint,
        alt: toAbsoluteAltitude(
          route.globalConfig.returnHeight,
          altitudeContext.baseGroundAltitudeMeters
        ),
      }
    : firstWaypoint;
  const landingEndCoordinate = {
    ...landingStartCoordinate,
    alt: altitudeContext.landingGroundAltitudeMeters,
  };
  const landingHeading =
    getSegmentEndHeading(segmentsWithTurns.at(-1)) ??
    getSegmentStartHeading(segmentsWithTurns.at(-1));

  pushTravelSegment(
    segmentsWithTurns,
    "landing",
    landingStartCoordinate,
    landingEndCoordinate,
    cruiseSpeed,
    waypointCoordinates.length - 1,
    landingHeading
  );

  const completedCoordinate = landingEndCoordinate;
  const completedHeading =
    getSegmentEndHeading(segmentsWithTurns.at(-1)) ??
    getSegmentStartHeading(segmentsWithTurns.at(-1));

  segmentsWithTurns.push(
    createStationarySegment(
      "completed",
      completedCoordinate,
      0,
      waypointCoordinates.length - 1,
      completedHeading
    )
  );

  return {
    cruiseHeight: route.areaConfig.flightHeight,
    cruiseSpeed,
    displayAltitudeBaselineMeters: altitudeContext.baseGroundAltitudeMeters,
    pathCoordinates: [
      ...closedBoundaryCoordinates,
      ...(shouldReturnHome
        ? [
            {
              ...firstWaypoint,
              alt: toAbsoluteAltitude(
                route.globalConfig.returnHeight,
                altitudeContext.baseGroundAltitudeMeters
              ),
            },
          ]
        : []),
      landingEndCoordinate,
    ],
    returnHeight: route.globalConfig.returnHeight,
    routeId: route.id,
    routeName: route.routeName,
    segments: segmentsWithTurns,
    takeoffHeight: route.globalConfig.takeoffHeight,
    totalDurationSeconds: segmentsWithTurns.reduce(
      (total, segment) => total + segment.durationSeconds,
      0
    ),
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
      displayAltitudeMeters: toDisplayAltitudeMeters(
        completedSegment.endCoordinate.alt,
        mission.displayAltitudeBaselineMeters
      ),
      elapsedSeconds: clampedElapsed,
      flownCoordinates: collectFlownCoordinates(
        mission,
        mission.segments.length - 1,
        completedSegment,
        completedSegment.endCoordinate
      ),
      headingDeg: resolveSegmentHeading(completedSegment, 1),
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
      currentSegment.phase === "completed" ||
      currentSegment.phase === "returnHome" ||
      currentSegment.phase === "landing"
        ? mission.waypointCount
        : (currentSegment.waypointIndex ?? 0) + 1,
    displayAltitudeMeters: toDisplayAltitudeMeters(
      currentCoordinate.alt,
      mission.displayAltitudeBaselineMeters
    ),
    elapsedSeconds: clampedElapsed,
    flownCoordinates: collectFlownCoordinates(
      mission,
      currentSegmentIndex,
      currentSegment,
      currentCoordinate
    ),
    headingDeg: resolveSegmentHeading(currentSegment, segmentProgress),
    phase: currentSegment.phase,
    progressRatio:
      mission.totalDurationSeconds <= ZERO_EPSILON
        ? 1
        : clampedElapsed / mission.totalDurationSeconds,
    returning: currentSegment.phase === "returnHome",
    speedMetersPerSecond:
      currentSegment.phase === "hover" ||
      currentSegment.phase === "turn" ||
      currentSegment.phase === "completed"
        ? 0
        : mission.cruiseSpeed,
    totalDurationSeconds: mission.totalDurationSeconds,
    totalWaypointCount: mission.waypointCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildPlaybackSceneModel(mission: PlaybackMission, state: PlaybackState) {
  computeBounds(mission.pathCoordinates);

  return buildSceneModel({
    routes: [],
    markers: [],
    selectedMarkerId: null,
  });
}

function createTravelSegment(
  phase: Exclude<PlaybackPhase, "hover" | "turn" | "completed">,
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate,
  cruiseSpeed: number,
  waypointIndex: number,
  headingDeg: number | null
): PlaybackSegment {
  return {
    startCoordinate,
    endCoordinate,
    durationSeconds: calculateDistanceMeters(startCoordinate, endCoordinate) / cruiseSpeed,
    phase,
    waypointIndex,
    startHeadingDeg: headingDeg,
    endHeadingDeg: headingDeg,
  };
}

function pushTravelSegment(
  segments: PlaybackSegment[],
  phase: Exclude<PlaybackPhase, "hover" | "turn" | "completed">,
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate,
  cruiseSpeed: number,
  waypointIndex: number,
  headingDeg: number | null
) {
  if (coordinatesEqual(startCoordinate, endCoordinate)) {
    return;
  }

  segments.push(
    createTravelSegment(
      phase,
      startCoordinate,
      endCoordinate,
      cruiseSpeed,
      waypointIndex,
      headingDeg
    )
  );
}

function createStationarySegment(
  phase: Extract<PlaybackPhase, "hover" | "completed">,
  coordinate: PlaybackCoordinate,
  durationSeconds: number,
  waypointIndex: number,
  headingDeg: number | null
): PlaybackSegment {
  return {
    startCoordinate: coordinate,
    endCoordinate: coordinate,
    durationSeconds,
    phase,
    waypointIndex,
    startHeadingDeg: headingDeg,
    endHeadingDeg: headingDeg,
  };
}

function pushStationarySegment(
  segments: PlaybackSegment[],
  phase: Extract<PlaybackPhase, "hover" | "completed">,
  coordinate: PlaybackCoordinate,
  durationSeconds: number,
  waypointIndex: number,
  headingDeg: number | null
) {
  if (durationSeconds <= 0) {
    return;
  }

  segments.push(
    createStationarySegment(phase, coordinate, durationSeconds, waypointIndex, headingDeg)
  );
}

function createTurnSegment(
  coordinate: PlaybackCoordinate,
  startHeadingDeg: number,
  endHeadingDeg: number,
  waypointIndex: number | null
): PlaybackSegment {
  return {
    startCoordinate: coordinate,
    endCoordinate: coordinate,
    durationSeconds: calculateTurnDurationSeconds(startHeadingDeg, endHeadingDeg),
    phase: "turn",
    waypointIndex,
    startHeadingDeg,
    endHeadingDeg,
  };
}

function insertTurnSegments(segments: PlaybackSegment[]) {
  const result: PlaybackSegment[] = [];

  segments.forEach((segment, index) => {
    result.push(segment);
    const nextSegment = segments[index + 1];
    if (!nextSegment) {
      return;
    }

    if (!coordinatesEqual(segment.endCoordinate, nextSegment.startCoordinate)) {
      return;
    }

    const startHeadingDeg = getSegmentEndHeading(segment);
    const endHeadingDeg = getSegmentStartHeading(nextSegment);
    if (
      typeof startHeadingDeg !== "number" ||
      typeof endHeadingDeg !== "number" ||
      Math.abs(shortestHeadingDeltaDegrees(startHeadingDeg, endHeadingDeg)) < MIN_TURN_ANGLE_DEGREES
    ) {
      return;
    }

    result.push(
      createTurnSegment(
        segment.endCoordinate,
        startHeadingDeg,
        endHeadingDeg,
        segment.waypointIndex
      )
    );
  });

  return result;
}

function resolvePointHeadingModeHeading(
  route: RouteRecordModel,
  departureIndex: number,
  startCoordinate: PlaybackCoordinate,
  endCoordinate?: PlaybackCoordinate
) {
  const yawMode = route.pointConfig.yawMode as HeadingMode;

  switch (yawMode) {
    case "manual":
      return normalizeHeadingDegrees(route.points[departureIndex]?.yaw ?? 0);
    case "track":
    case "tangent":
    case "auto":
    default:
      return endCoordinate ? calculateBearingIfChanged(startCoordinate, endCoordinate) : null;
  }
}

function resolveSegmentHeading(segment: PlaybackSegment, progress: number) {
  const startHeadingDeg = getSegmentStartHeading(segment);
  const endHeadingDeg = getSegmentEndHeading(segment);
  if (typeof startHeadingDeg !== "number" && typeof endHeadingDeg !== "number") {
    return null;
  }

  if (typeof startHeadingDeg === "number" && typeof endHeadingDeg === "number") {
    return interpolateHeadingDegrees(startHeadingDeg, endHeadingDeg, progress);
  }

  return typeof endHeadingDeg === "number" ? endHeadingDeg : startHeadingDeg;
}

function getSegmentStartHeading(segment?: PlaybackSegment) {
  return segment?.startHeadingDeg ?? null;
}

function getSegmentEndHeading(segment?: PlaybackSegment) {
  return segment?.endHeadingDeg ?? null;
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

function interpolateHeadingDegrees(
  startHeadingDeg: number,
  endHeadingDeg: number,
  progress: number
) {
  return normalizeHeadingDegrees(
    startHeadingDeg + shortestHeadingDeltaDegrees(startHeadingDeg, endHeadingDeg) * progress
  );
}

function shortestHeadingDeltaDegrees(startHeadingDeg: number, endHeadingDeg: number) {
  return ((endHeadingDeg - startHeadingDeg + 540) % 360) - 180;
}

function calculateTurnDurationSeconds(startHeadingDeg: number, endHeadingDeg: number) {
  return Math.max(
    MIN_TURN_SECONDS,
    Math.abs(shortestHeadingDeltaDegrees(startHeadingDeg, endHeadingDeg)) /
      TURN_RATE_DEGREES_PER_SECOND
  );
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

function coordinatesEqual(startCoordinate: PlaybackCoordinate, endCoordinate: PlaybackCoordinate) {
  return (
    Math.abs(startCoordinate.lng - endCoordinate.lng) < ZERO_EPSILON &&
    Math.abs(startCoordinate.lat - endCoordinate.lat) < ZERO_EPSILON &&
    Math.abs(startCoordinate.alt - endCoordinate.alt) < ZERO_EPSILON
  );
}

function calculateBearingIfChanged(
  startCoordinate: PlaybackCoordinate,
  endCoordinate: PlaybackCoordinate
) {
  if (
    Math.abs(startCoordinate.lng - endCoordinate.lng) < ZERO_EPSILON &&
    Math.abs(startCoordinate.lat - endCoordinate.lat) < ZERO_EPSILON
  ) {
    return null;
  }

  return calculateBearingDegrees(startCoordinate, endCoordinate);
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
  return normalizeHeadingDegrees(degrees);
}

function normalizeHeadingDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function toAbsoluteAltitude(relativeAltitudeMeters: number, baseGroundAltitudeMeters: number) {
  return baseGroundAltitudeMeters + relativeAltitudeMeters;
}

function toDisplayAltitudeMeters(
  absoluteAltitudeMeters: number,
  displayAltitudeBaselineMeters: number
) {
  const relativeAltitudeMeters = absoluteAltitudeMeters - displayAltitudeBaselineMeters;
  return Math.abs(relativeAltitudeMeters) < ZERO_EPSILON ? 0 : relativeAltitudeMeters;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
