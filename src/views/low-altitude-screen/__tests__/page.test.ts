import { render, waitFor } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteType } from "@/api/flight/types";

const {
  mountDashboardSceneMock,
  getDetailMock,
  getKmzMock,
  hydrateRouteRecordMock,
  loadPlaybackDroneModelRuntimeMock,
  resolvePlaybackAltitudeContextMock,
} = vi.hoisted(() => ({
  mountDashboardSceneMock: vi.fn(),
  getDetailMock: vi.fn(),
  getKmzMock: vi.fn(),
  hydrateRouteRecordMock: vi.fn(),
  loadPlaybackDroneModelRuntimeMock: vi.fn(() =>
    Promise.resolve({
      dispose() {},
      root: {},
      setHeadingDegrees() {},
      setPosition() {},
      update() {},
    })
  ),
  resolvePlaybackAltitudeContextMock: vi.fn(() =>
    Promise.resolve({
      baseGroundAltitudeMeters: 86.885,
      landingGroundAltitudeMeters: 86.885,
    })
  ),
}));

vi.mock("../scene/runtime", () => ({
  mountDashboardScene: mountDashboardSceneMock,
}));

vi.mock("@/api/flight/route", () => ({
  default: {
    getDetail: getDetailMock,
    getKmz: getKmzMock,
  },
}));

vi.mock("@/views/route/route-xml", () => ({
  hydrateRouteRecord: hydrateRouteRecordMock,
}));

vi.mock("../playback-altitude", () => ({
  resolvePlaybackAltitudeContext: resolvePlaybackAltitudeContextMock,
}));

vi.mock("../scene/playback-drone-model", () => ({
  loadPlaybackDroneModelRuntime: loadPlaybackDroneModelRuntimeMock,
}));

import LowAltitudeScreenPage from "../index.vue";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createSceneRuntime(status: "ready" | "error" | "unsupported", errorMessage = "") {
  return {
    destroy() {},
    resize() {},
    updateConfig() {},
    status,
    errorMessage,
  };
}

function createPlaybackRouteRecord() {
  return {
    id: "42",
    routeName: "港区巡检航线",
    persisted: true,
    routeType: RouteType.POINT,
    points: [
      {
        id: "p1",
        name: "航点1",
        lng: 113.5285956152,
        lat: 22.2551856026,
        alt: 60,
        hoverSeconds: 3,
      },
      {
        id: "p2",
        name: "航点2",
        lng: 113.5263935271,
        lat: 22.2501442839,
        alt: 60,
        hoverSeconds: 3,
      },
    ],
    globalConfig: {
      takeoffHeight: 30,
      routeHeight: 60,
      returnHeight: 80,
      routeSpeed: 15,
      signalLossAction: "returnHome",
      finishAction: "returnHome",
      cameraMode: "wide",
      zoom: 2,
    },
    pointConfig: {
      yawMode: "auto",
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
    loopConfig: {
      shootMode: "distance",
      shootIntervalSeconds: 30,
      shootIntervalDistance: 30,
      targetResolution: 2,
      flightHeight: 80,
      direction: "clockwise",
      startAngle: 0,
      radius: 80,
      totalAngle: 360,
      yawMode: "track",
      gimbalPitch: -45,
      targetPoint: null,
    },
  };
}

function createAreaPlaybackRouteRecord() {
  return {
    id: "84",
    routeName: "港区测绘范围",
    persisted: true,
    routeType: RouteType.AREA,
    points: [
      {
        id: "a1",
        name: "顶点1",
        lng: 113.5282,
        lat: 22.2558,
        alt: 90,
        hoverSeconds: 0,
      },
      {
        id: "a2",
        name: "顶点2",
        lng: 113.5312,
        lat: 22.2558,
        alt: 90,
        hoverSeconds: 0,
      },
      {
        id: "a3",
        name: "顶点3",
        lng: 113.5312,
        lat: 22.2521,
        alt: 90,
        hoverSeconds: 0,
      },
      {
        id: "a4",
        name: "顶点4",
        lng: 113.5282,
        lat: 22.2521,
        alt: 90,
        hoverSeconds: 0,
      },
    ],
    globalConfig: {
      takeoffHeight: 30,
      routeHeight: 60,
      returnHeight: 80,
      routeSpeed: 15,
      signalLossAction: "returnHome",
      finishAction: "returnHome",
      cameraMode: "wide",
      zoom: 2,
    },
    pointConfig: {
      yawMode: "auto",
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
    loopConfig: {
      shootMode: "distance",
      shootIntervalSeconds: 30,
      shootIntervalDistance: 30,
      targetResolution: 2,
      flightHeight: 80,
      direction: "clockwise",
      startAngle: 0,
      radius: 80,
      totalAngle: 360,
      yawMode: "track",
      gimbalPitch: -45,
      targetPoint: null,
    },
  };
}

function createPlaybackExtensionContextStub() {
  return {
    sceneRoot: new (class {
      add() {}
    })(),
    viewer: {
      camera: {
        setView() {},
      },
    },
    geospatial: {
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
        return { x: east, y: north, z: up };
      },
    },
  };
}

describe("low-altitude screen page", () => {
  afterEach(() => {
    window.location.hash = "";
    window.location.search = "";
    resolvePlaybackAltitudeContextMock.mockClear();
  });

  it("shows the scene failure state when the runtime returns an error", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "error",
      errorMessage: "asset-error",
    });

    const { container, findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("asset-error")).toBeTruthy();
    expect(container.querySelector(".low-altitude-scene-host__status")).toBeTruthy();
  });

  it("renders the dashboard chrome around the Cesium and 3DGS stage", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    expect(await findAllByRole("button")).not.toHaveLength(0);
    expect(container.querySelector(".dashboard-stage")).toBeTruthy();
    expect(container.querySelector(".screen-header")).toBeTruthy();
    expect(container.querySelector(".screen-content")).toBeTruthy();
    expect(container.querySelector(".side-panel--left")).toBeTruthy();
    expect(container.querySelector(".side-panel--right")).toBeTruthy();
    expect(container.querySelector(".screen-center__viewer-shell")).toBeTruthy();
  });

  it("keeps the center stage clean without route or marker overlays", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelector(".low-altitude-scene-host__overlay")).toBeNull();
    expect(container.querySelector(".low-altitude-scene-host__marker")).toBeNull();
  });

  it("mounts the Cesium scene host behind the dashboard chrome without a standalone Spark canvas", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    const host = container.querySelector(".low-altitude-scene-host");
    const map = container.querySelector(".low-altitude-scene-host__map");
    const slot = container.querySelector(".low-altitude-scene-host__slot");

    expect(host).toBeTruthy();
    expect(map).toBeTruthy();
    expect(container.querySelector(".low-altitude-scene-host__canvas")).toBeNull();
    expect(slot).toBeTruthy();
    expect(getComputedStyle(host as HTMLElement).position).toBe("relative");
    expect(getComputedStyle(map as HTMLElement).position).toBe("absolute");
    expect(getComputedStyle(slot as HTMLElement).position).toBe("relative");
  });

  it("keeps the fullscreen chrome from blocking Cesium map drag interactions", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    const slot = container.querySelector(".low-altitude-scene-host__slot");
    const header = container.querySelector(".screen-header");
    const leftPanel = container.querySelector(".side-panel--left");
    const rightPanel = container.querySelector(".side-panel--right");

    expect(slot).toBeTruthy();
    expect(header).toBeTruthy();
    expect(leftPanel).toBeTruthy();
    expect(rightPanel).toBeTruthy();
    expect(getComputedStyle(slot as HTMLElement).pointerEvents).toBe("none");
    expect(getComputedStyle(header as HTMLElement).pointerEvents).toBe("auto");
    expect(getComputedStyle(leftPanel as HTMLElement).pointerEvents).toBe("auto");
    expect(getComputedStyle(rightPanel as HTMLElement).pointerEvents).toBe("auto");
  });

  it("renders four stable duty panels around the center stage", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelectorAll(".screen-panel")).toHaveLength(4);
  });

  it("keeps the center stage free of the framed shell border", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    const viewerShell = container.querySelector(".screen-center__viewer-shell");
    expect(viewerShell).toBeTruthy();
    expect(getComputedStyle(viewerShell as HTMLElement).boxShadow).toBe("");
  });

  it("keeps the calibration panel hidden by default", async () => {
    window.location.hash = "#/low-altitude-screen";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelector('[data-testid="scene-calibration-panel"]')).toBeNull();
  });

  it("shows the calibration panel when the route hash enables calibrate=1", async () => {
    window.location.hash = "#/low-altitude-screen?calibrate=1";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelector('[data-testid="scene-calibration-panel"]')).toBeTruthy();
    expect(container.querySelector('input[name="anchorLng"]')).toBeTruthy();
    expect(container.querySelector('input[name="scale"]')).toBeTruthy();
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.textContent).toContain("复制当前视角 JSON");
  });

  it("passes a camera snapshot callback through scene options", async () => {
    window.location.hash = "#/low-altitude-screen?calibrate=1";
    mountDashboardSceneMock.mockClear();
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    render(LowAltitudeScreenPage);

    await waitFor(() => {
      expect(mountDashboardSceneMock).toHaveBeenCalledTimes(1);
    });

    expect(mountDashboardSceneMock.mock.calls.at(-1)?.[2]).toEqual(
      expect.objectContaining({
        onCameraViewChange: expect.any(Function),
      })
    );
  });

  it("switches into focused playback mode and hides the dashboard duty panels", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=42";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });
    getDetailMock.mockResolvedValueOnce({
      id: 42,
      name: "港区巡检航线",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce({
      id: "42",
      routeName: "港区巡检航线",
      persisted: true,
      routeType: RouteType.POINT,
      points: [
        {
          id: "p1",
          name: "航点1",
          lng: 113.5285956152,
          lat: 22.2551856026,
          alt: 60,
          hoverSeconds: 3,
        },
        {
          id: "p2",
          name: "航点2",
          lng: 113.5263935271,
          lat: 22.2501442839,
          alt: 60,
          hoverSeconds: 3,
        },
      ],
      globalConfig: {
        takeoffHeight: 30,
        routeHeight: 60,
        returnHeight: 80,
        routeSpeed: 15,
        signalLossAction: "returnHome",
        finishAction: "returnHome",
        cameraMode: "wide",
        zoom: 2,
      },
      pointConfig: {
        yawMode: "auto",
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
      loopConfig: {
        shootMode: "distance",
        shootIntervalSeconds: 30,
        shootIntervalDistance: 30,
        targetResolution: 2,
        flightHeight: 80,
        direction: "clockwise",
        startAngle: 0,
        radius: 80,
        totalAngle: 360,
        yawMode: "track",
        gimbalPitch: -45,
        targetPoint: null,
      },
    });

    const { container, findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("专注回放")).toBeTruthy();
    expect(container.querySelector(".playback-stage")).toBeTruthy();
    expect(container.querySelector(".screen-content")).toBeNull();
    expect(getDetailMock).toHaveBeenCalledWith("42");
    expect(getKmzMock).toHaveBeenCalledWith("42");
  });

  it("resolves playback altitude context before building the focused playback mission", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=42";
    mountDashboardSceneMock.mockResolvedValueOnce(createSceneRuntime("ready"));
    getDetailMock.mockResolvedValueOnce({
      id: 42,
      name: "港区巡检航线",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce(createPlaybackRouteRecord());

    render(LowAltitudeScreenPage);

    await waitFor(() => {
      expect(resolvePlaybackAltitudeContextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "42",
          routeType: RouteType.POINT,
        }),
        expect.objectContaining({
          altitudeMeters: 86.885,
          latitude: 22.252818819444443,
          longitude: 113.52958706944445,
        })
      );
    });
  });

  it("keeps the playback altitude readout in relative meters after absolute-height mission preparation", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=42";
    resolvePlaybackAltitudeContextMock.mockResolvedValueOnce({
      baseGroundAltitudeMeters: 150,
      landingGroundAltitudeMeters: 150,
    });
    mountDashboardSceneMock.mockImplementationOnce((_container, _config, options) => {
      options?.createExtension?.(createPlaybackExtensionContextStub() as any);
      return Promise.resolve(createSceneRuntime("ready"));
    });
    getDetailMock.mockResolvedValueOnce({
      id: 42,
      name: "港区巡检航线",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce(createPlaybackRouteRecord());

    const { container } = render(LowAltitudeScreenPage);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="playback-stats"]')).toBeTruthy();
    });

    expect(container.textContent).toContain("0m");
  });

  it("renders a clear playback error state when route playback loading fails", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=404";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });
    getDetailMock.mockRejectedValueOnce(new Error("missing-route"));

    const { findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("无法加载模拟飞行航线")).toBeTruthy();
    expect(await findByText("missing-route")).toBeTruthy();
  });

  it("loads an area route in playback mode without falling back to the error state", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=84";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });
    getDetailMock.mockResolvedValueOnce({
      id: 84,
      name: "港区测绘范围",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce(createAreaPlaybackRouteRecord());

    const { container, findByText, queryByText } = render(LowAltitudeScreenPage);

    expect(await findByText("专注回放")).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector(".playback-stage")).toBeTruthy();
    });
    expect(queryByText("无法加载模拟飞行航线")).toBeNull();
    expect(getDetailMock).toHaveBeenCalledWith("84");
    expect(getKmzMock).toHaveBeenCalledWith("84");
  });

  it("waits for the 3DGS scene to become ready before starting focused playback", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=42";
    mountDashboardSceneMock.mockReset();
    getDetailMock.mockReset();
    getKmzMock.mockReset();
    hydrateRouteRecordMock.mockReset();
    const runtimeDeferred = createDeferred<ReturnType<typeof createSceneRuntime>>();
    mountDashboardSceneMock.mockImplementation((_container, _config, options) => {
      options?.createExtension?.(createPlaybackExtensionContextStub() as any);
      return runtimeDeferred.promise;
    });
    getDetailMock.mockResolvedValueOnce({
      id: 42,
      name: "港区巡检航线",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce(createPlaybackRouteRecord());

    const { container, findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("专注回放")).toBeTruthy();
    await waitFor(() => {
      expect(
        container.querySelector('.playback-stage[data-playback-state="waitingScene"]')
      ).toBeTruthy();
    });

    expect(mountDashboardSceneMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="playback-stats"]')).toBeNull();

    runtimeDeferred.resolve(createSceneRuntime("ready"));
  });

  it("switches from scene waiting state into live playback stats after the 3DGS scene is ready", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=42";
    mountDashboardSceneMock.mockReset();
    getDetailMock.mockReset();
    getKmzMock.mockReset();
    hydrateRouteRecordMock.mockReset();
    const runtimeDeferred = createDeferred<ReturnType<typeof createSceneRuntime>>();
    mountDashboardSceneMock.mockImplementation((_container, _config, options) => {
      options?.createExtension?.(createPlaybackExtensionContextStub() as any);
      return runtimeDeferred.promise;
    });
    getDetailMock.mockResolvedValueOnce({
      id: 42,
      name: "港区巡检航线",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce(createPlaybackRouteRecord());

    const { container, findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("专注回放")).toBeTruthy();
    await waitFor(() => {
      expect(
        container.querySelector('.playback-stage[data-playback-state="waitingScene"]')
      ).toBeTruthy();
    });

    runtimeDeferred.resolve(createSceneRuntime("ready"));

    await waitFor(() => {
      expect(container.querySelector('[data-testid="playback-stats"]')).toBeTruthy();
    });
  });

  it("hides playback map markers without rendering the planned route overlay frame", async () => {
    window.location.hash = "#/low-altitude-screen?mode=playback&routeId=42";
    mountDashboardSceneMock.mockReset();
    getDetailMock.mockReset();
    getKmzMock.mockReset();
    hydrateRouteRecordMock.mockReset();
    const runtimeDeferred = createDeferred<ReturnType<typeof createSceneRuntime>>();
    mountDashboardSceneMock.mockImplementation((_container, _config, options) => {
      options?.createExtension?.(createPlaybackExtensionContextStub() as any);
      return runtimeDeferred.promise;
    });
    getDetailMock.mockResolvedValueOnce({
      id: 42,
      name: "娓尯宸℃鑸嚎",
      is_published: false,
      created_at: "2026-04-15T10:00:00",
      updated_at: "2026-04-15T10:00:00",
    });
    getKmzMock.mockResolvedValueOnce({ data: new Blob() });
    hydrateRouteRecordMock.mockResolvedValueOnce(createPlaybackRouteRecord());

    const { container, findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("专注回放")).toBeTruthy();
    runtimeDeferred.resolve(createSceneRuntime("ready"));

    await waitFor(() => {
      expect(container.querySelector('[data-testid="playback-stats"]')).toBeTruthy();
    });

    expect(container.querySelector(".low-altitude-scene-host__overlay")).toBeNull();
    expect(container.querySelector(".low-altitude-scene-host__marker")).toBeNull();
  });
});
