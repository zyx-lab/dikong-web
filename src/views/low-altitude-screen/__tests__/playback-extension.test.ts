import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "@/views/route/utils";
import { createPlaybackMission, getPlaybackState } from "../playback";

const { gltfLoadAsyncMock, consoleWarnMock } = vi.hoisted(() => ({
  gltfLoadAsyncMock: vi.fn(),
  consoleWarnMock: vi.fn(),
}));

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class MockGLTFLoader {
    loadAsync(url: string) {
      return gltfLoadAsyncMock(url);
    }
  },
}));

import { createPlaybackSceneExtension } from "../scene/playback-extension";

function createPointRoute() {
  return createEmptyRoute({
    id: "route-42",
    persisted: true,
    routeName: "港区巡检航线",
    routeType: RouteType.POINT,
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

function createGeospatialStub() {
  return {
    sceneOrigin: {
      longitude: 113.52958706944445,
      latitude: 22.252818819444443,
      altitudeMeters: 86.885,
    },
    geodeticToEnu({
      longitude,
      latitude,
      altitudeMeters,
    }: {
      longitude: number;
      latitude: number;
      altitudeMeters: number;
    }) {
      return {
        east: longitude,
        north: latitude,
        up: altitudeMeters,
      };
    },
    enuToRenderVector({ east, north, up }: { east: number; north: number; up: number }) {
      return new THREE.Vector3(east, north, up);
    },
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function createTurnMission(): ReturnType<typeof createPlaybackMission> {
  const startCoordinate = {
    lng: 113.5285956152,
    lat: 22.2551856026,
    alt: 60,
  };
  const turnCoordinate = {
    lng: 113.5263935271,
    lat: 22.2501442839,
    alt: 60,
  };
  const endCoordinate = {
    lng: 113.5270290622,
    lat: 22.2499299869,
    alt: 60,
  };

  return {
    cruiseHeight: 60,
    cruiseSpeed: 15,
    pathCoordinates: [startCoordinate, turnCoordinate, endCoordinate],
    returnHeight: 80,
    routeId: "turn-mission",
    routeName: "转向阶段镜头验证",
    segments: [
      {
        startCoordinate,
        endCoordinate: turnCoordinate,
        durationSeconds: 1,
        phase: "cruise",
        waypointIndex: 1,
        startHeadingDeg: 350,
        endHeadingDeg: 350,
      },
      {
        startCoordinate: turnCoordinate,
        endCoordinate: turnCoordinate,
        durationSeconds: 1,
        phase: "turn",
        waypointIndex: 1,
        startHeadingDeg: 350,
        endHeadingDeg: 10,
      },
      {
        startCoordinate: turnCoordinate,
        endCoordinate,
        durationSeconds: 1,
        phase: "cruise",
        waypointIndex: 2,
        startHeadingDeg: 10,
        endHeadingDeg: 10,
      },
      {
        startCoordinate: endCoordinate,
        endCoordinate,
        durationSeconds: 0,
        phase: "completed",
        waypointIndex: 2,
        startHeadingDeg: 10,
        endHeadingDeg: 10,
      },
    ],
    takeoffHeight: 30,
    totalDurationSeconds: 3,
    waypointCoordinates: [startCoordinate, turnCoordinate, endCoordinate],
    waypointCount: 3,
  } as ReturnType<typeof createPlaybackMission>;
}

describe("playback scene extension", () => {
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    gltfLoadAsyncMock.mockReset();
    originalConsoleWarn = console.warn;
    console.warn = consoleWarnMock;
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    vi.restoreAllMocks();
  });

  it("emits the initial zero-second playback state before the first animation frame advances time", async () => {
    gltfLoadAsyncMock.mockResolvedValue({
      animations: [],
      scene: new THREE.Group(),
    });
    const mission = createPlaybackMission(createPointRoute());
    const onStateChange = vi.fn();
    const sceneRoot = new THREE.Group();
    const camera = {
      setView: vi.fn(),
    };
    const geospatial = createGeospatialStub();
    const factory = createPlaybackSceneExtension({
      mission,
      onStateChange,
    });

    const extension = factory({
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0]?.[0]).toMatchObject({
      elapsedSeconds: 0,
      progressRatio: 0,
    });

    extension.onFrame?.({
      deltaTime: 1,
      elapsedTime: 1,
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    expect(onStateChange).toHaveBeenCalledTimes(2);
    expect(onStateChange.mock.calls[1]?.[0].elapsedSeconds).toBeGreaterThan(0);
  });

  it("adds the loaded drone model root to the scene without creating a sphere placeholder", async () => {
    const mission = (createPlaybackMission as any)(createPointRoute(), {
      baseGroundAltitudeMeters: 150,
      landingGroundAltitudeMeters: 150,
    });
    const sceneRoot = new THREE.Group();
    const camera = {
      setView: vi.fn(),
    };
    const geospatial = createGeospatialStub();
    const droneScene = new THREE.Group();
    droneScene.name = "LoadedDroneScene";
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 4),
      new THREE.MeshStandardMaterial({ color: "#ffffff" })
    );
    droneScene.add(mesh);
    gltfLoadAsyncMock.mockResolvedValue({
      animations: [],
      scene: droneScene,
    });

    const extension = createPlaybackSceneExtension({
      mission,
    })({
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    expect(sceneRoot.children).toHaveLength(1);
    expect(sceneRoot.children[0]).toBeInstanceOf(THREE.Line);
    expect(
      sceneRoot.children.some(
        (child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry
      )
    ).toBe(false);

    await flushPromises();

    expect(sceneRoot.children).toHaveLength(2);
    expect(sceneRoot.children[1]).toBeInstanceOf(THREE.Group);

    extension.onFrame?.({
      deltaTime: 0.5,
      elapsedTime: 0.5,
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    const expectedState = getPlaybackState(mission, 0.5);
    expect(expectedState.currentCoordinate.alt).toBeGreaterThan(150);
    const droneRoot = sceneRoot.children[1] as THREE.Group;
    expect(droneRoot.position.x).toBeCloseTo(expectedState.currentCoordinate.lng, 6);
    expect(droneRoot.position.y).toBeCloseTo(expectedState.currentCoordinate.lat, 6);
    expect(droneRoot.position.z).toBeCloseTo(expectedState.currentCoordinate.alt, 6);
  });

  it("updates the drone animation mixer on each frame when the model provides clips", async () => {
    const mission = createPlaybackMission(createPointRoute());
    const sceneRoot = new THREE.Group();
    const camera = {
      setView: vi.fn(),
    };
    const geospatial = createGeospatialStub();
    const droneScene = new THREE.Group();
    droneScene.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: "#ffffff" })
      )
    );
    const updateSpy = vi.spyOn(THREE.AnimationMixer.prototype, "update");

    gltfLoadAsyncMock.mockResolvedValue({
      animations: [new THREE.AnimationClip("RotorSpin", 1, [])],
      scene: droneScene,
    });

    const extension = createPlaybackSceneExtension({
      mission,
    })({
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    await flushPromises();

    extension.onFrame?.({
      deltaTime: 0.25,
      elapsedTime: 0.25,
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    expect(updateSpy).toHaveBeenCalledWith(0.25);
  });

  it("keeps playback running and logs a warning when the drone model fails to load", async () => {
    const mission = createPlaybackMission(createPointRoute());
    const onStateChange = vi.fn();
    const sceneRoot = new THREE.Group();
    const camera = {
      setView: vi.fn(),
    };
    const geospatial = createGeospatialStub();
    gltfLoadAsyncMock.mockRejectedValue(new Error("load failed"));

    const extension = createPlaybackSceneExtension({
      mission,
      onStateChange,
    })({
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    await flushPromises();

    expect(sceneRoot.children).toHaveLength(1);
    expect(consoleWarnMock).toHaveBeenCalled();

    extension.onFrame?.({
      deltaTime: 1,
      elapsedTime: 1,
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    expect(onStateChange).toHaveBeenCalledTimes(2);
    expect(camera.setView).toHaveBeenCalled();
  });

  it("feeds a continuously interpolated heading to the follow camera during turn segments", async () => {
    gltfLoadAsyncMock.mockResolvedValue({
      animations: [],
      scene: new THREE.Group(),
    });
    const mission = createTurnMission();
    const onStateChange = vi.fn();
    const sceneRoot = new THREE.Group();
    const camera = {
      setView: vi.fn(),
    };
    const geospatial = createGeospatialStub();

    const extension = createPlaybackSceneExtension({
      mission,
      onStateChange,
    })({
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    extension.onFrame?.({
      deltaTime: 1.5,
      elapsedTime: 1.5,
      sceneRoot,
      viewer: { camera },
      geospatial,
    } as any);

    const turnState = onStateChange.mock.calls.at(-1)?.[0];
    const latestCameraView = camera.setView.mock.calls.at(-1)?.[0];

    expect(onStateChange).toHaveBeenCalledTimes(2);
    expect(turnState.phase).toBe("turn");
    expect(turnState.headingDeg).toBeCloseTo(0, 6);
    expect(latestCameraView.orientation.heading).toBeCloseTo(0, 6);
  });
});
