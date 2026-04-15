import * as Cesium from "cesium";
import * as THREE from "three";
import { offsetCoordinate } from "@/views/route/utils";
import { getPlaybackState } from "../playback";
import type { PlaybackMission, PlaybackState } from "../types";
import { loadPlaybackDroneModelRuntime } from "./playback-drone-model";
import type {
  DashboardSceneExtension,
  DashboardSceneExtensionContext,
  DashboardSceneFrameContext,
} from "./runtime";

interface PlaybackExtensionOptions {
  mission: PlaybackMission;
  onStateChange?: (state: PlaybackState) => void;
}

export function createPlaybackSceneExtension(
  options: PlaybackExtensionOptions
): (context: DashboardSceneExtensionContext) => DashboardSceneExtension {
  return (context) => {
    const flownLine = createRouteLine(
      context,
      [options.mission.waypointCoordinates[0]],
      "#7bffb4",
      0.95
    );
    const followDistanceMeters = 180;
    const followHeightMeters = 120;
    let elapsedSeconds = 0;
    let lastHeadingDeg = 0;
    let disposed = false;
    let droneRuntime: Awaited<ReturnType<typeof loadPlaybackDroneModelRuntime>> | undefined;

    context.sceneRoot.add(flownLine);

    const initialState = getPlaybackState(options.mission, 0);
    let currentCoordinate = initialState.currentCoordinate;
    if (typeof initialState.headingDeg === "number") {
      lastHeadingDeg = initialState.headingDeg;
    }
    updateFlownLine(
      context as DashboardSceneFrameContext,
      flownLine,
      initialState.flownCoordinates
    );
    updateFollowCamera(
      context as DashboardSceneFrameContext,
      initialState,
      lastHeadingDeg,
      followDistanceMeters,
      followHeightMeters
    );
    options.onStateChange?.(initialState);
    void loadPlaybackDroneModelRuntime()
      .then((runtime) => {
        if (disposed) {
          runtime.dispose();
          return;
        }

        droneRuntime = runtime;
        context.sceneRoot.add(runtime.root);
        syncDroneRuntime(context, runtime, currentCoordinate, lastHeadingDeg);
      })
      .catch((error) => {
        if (disposed) return;
        console.warn("[low-altitude-playback] Failed to load playback drone model.", error);
      });

    return {
      dispose() {
        disposed = true;
        flownLine.geometry.dispose();
        (flownLine.material as THREE.Material).dispose();
        flownLine.removeFromParent();
        droneRuntime?.dispose();
        droneRuntime = undefined;
      },
      onFrame(frameContext) {
        elapsedSeconds = Math.min(
          elapsedSeconds + frameContext.deltaTime,
          options.mission.totalDurationSeconds
        );
        const state = getPlaybackState(options.mission, elapsedSeconds);

        if (typeof state.headingDeg === "number") {
          lastHeadingDeg = state.headingDeg;
        }

        currentCoordinate = state.currentCoordinate;
        if (droneRuntime) {
          syncDroneRuntime(frameContext, droneRuntime, state.currentCoordinate, lastHeadingDeg);
          droneRuntime.update(frameContext.deltaTime);
        }
        updateFlownLine(frameContext, flownLine, state.flownCoordinates);
        updateFollowCamera(
          frameContext,
          state,
          lastHeadingDeg,
          followDistanceMeters,
          followHeightMeters
        );
        options.onStateChange?.(state);
      },
    };
  };
}

function createRouteLine(
  context: DashboardSceneExtensionContext,
  coordinates: PlaybackMission["pathCoordinates"],
  color: string,
  opacity: number
) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    coordinates.map((coordinate) => toRenderPosition(context, coordinate))
  );
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      opacity,
      transparent: opacity < 1,
    })
  );
}

function syncDroneRuntime(
  context: DashboardSceneExtensionContext,
  droneRuntime: Awaited<ReturnType<typeof loadPlaybackDroneModelRuntime>>,
  coordinate: PlaybackState["currentCoordinate"],
  headingDeg: number
) {
  const nextPosition = toRenderPosition(context, coordinate);
  droneRuntime.setPosition(nextPosition);
  droneRuntime.setHeadingDegrees(headingDeg);
}

function updateFlownLine(
  context: DashboardSceneFrameContext,
  flownLine: THREE.Line,
  flownCoordinates: PlaybackState["flownCoordinates"]
) {
  flownLine.geometry.dispose();
  flownLine.geometry = new THREE.BufferGeometry().setFromPoints(
    flownCoordinates.map((coordinate) => toRenderPosition(context, coordinate))
  );
}

function updateFollowCamera(
  context: DashboardSceneFrameContext,
  state: PlaybackState,
  headingDeg: number,
  followDistanceMeters: number,
  followHeightMeters: number
) {
  const followCoordinate = offsetCoordinate(
    {
      lng: state.currentCoordinate.lng,
      lat: state.currentCoordinate.lat,
    },
    followDistanceMeters,
    headingDeg + 180
  );

  context.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      followCoordinate.lng,
      followCoordinate.lat,
      Math.max(state.currentCoordinate.alt + followHeightMeters, followHeightMeters)
    ),
    orientation: {
      heading: Cesium.Math.toRadians(headingDeg),
      pitch: Cesium.Math.toRadians(-28),
      roll: 0,
    },
  });
}

function toRenderPosition(
  context: DashboardSceneExtensionContext,
  coordinate: PlaybackState["currentCoordinate"]
) {
  const enuPosition = context.geospatial.geodeticToEnu(
    {
      longitude: coordinate.lng,
      latitude: coordinate.lat,
      altitudeMeters: coordinate.alt,
    },
    context.geospatial.sceneOrigin
  );

  return context.geospatial.enuToRenderVector(enuPosition);
}
