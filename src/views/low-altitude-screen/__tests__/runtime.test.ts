import * as THREE from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SPLAT_URL = "/JNUAerial-with_Park-y_up-lod.rad";

const rendererCtor = vi.fn();
const rendererSetPixelRatio = vi.fn();
const rendererSetSize = vi.fn();
const rendererRender = vi.fn();
const rendererSetClearColor = vi.fn();
const rendererResetState = vi.fn();
const rendererSetViewport = vi.fn();
const rendererDispose = vi.fn();
const sparkRendererDispose = vi.fn();
const splatUpdateGenerator = vi.fn();
const splatDispose = vi.fn();
const sparkRendererCtor = vi.fn();
const splatCtor = vi.fn();
const fetchMock = vi.fn();
const createLowAltitudeCesiumViewerMock = vi.fn();
const getSceneHomeViewSnapshotMock = vi.fn();
const syncThreeCameraFromCesiumViewerMock = vi.fn();
const preRenderAddEventListener = vi.fn();
const preRenderRemoveEventListener = vi.fn();
const postRenderAddEventListener = vi.fn();
const postRenderRemoveEventListener = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("../scene/cesium-base-layer", () => ({
  createLowAltitudeCesiumViewer: createLowAltitudeCesiumViewerMock,
  getSceneHomeViewSnapshot: getSceneHomeViewSnapshotMock,
  syncThreeCameraFromCesiumViewer: syncThreeCameraFromCesiumViewerMock,
}));

vi.mock("cesium", () => ({
  Cartographic: class MockCartographic {
    constructor(
      public longitude = 0,
      public latitude = 0,
      public height = 0
    ) {}
  },
  Math: {
    toRadians(value: number) {
      return (value * Math.PI) / 180;
    },
  },
}));

vi.mock("three", async () => {
  const actual = await vi.importActual<typeof import("three")>("three");

  class MockWebGLRenderer {
    domElement = document.createElement("canvas");
    outputColorSpace: unknown;
    sortObjects = true;
    setPixelRatio = rendererSetPixelRatio;
    setSize = rendererSetSize;
    setViewport = rendererSetViewport;
    render = rendererRender;
    setClearColor = rendererSetClearColor;
    resetState = rendererResetState;
    dispose = rendererDispose;

    constructor(options: unknown) {
      rendererCtor(options);
    }
  }

  class MockCubeTextureLoader {
    load() {
      return { colorSpace: undefined };
    }
  }

  return {
    ...actual,
    CubeTextureLoader: MockCubeTextureLoader,
    WebGLRenderer: MockWebGLRenderer,
  };
});

class MockSparkRenderer extends THREE.Object3D {
  dispose = sparkRendererDispose;

  constructor(options: unknown) {
    super();
    sparkRendererCtor(options);
  }
}

class MockSplatMesh extends THREE.Object3D {
  initialized = Promise.resolve();
  updateGenerator = splatUpdateGenerator;
  dispose = splatDispose;

  constructor(options: { url: string; paged: boolean }) {
    super();
    splatCtor(options);
  }
}

vi.mock("@sparkjsdev/spark", () => ({
  SparkRenderer: MockSparkRenderer,
  SplatMesh: MockSplatMesh,
}));

function createSceneConfig() {
  return {
    splatUrl: TEST_SPLAT_URL,
    backgroundColor: "#09131d",
    baseMapMode: "satellite" as const,
    sceneOrigin: {
      longitude: 113.52958706944445,
      latitude: 22.252818819444443,
      altitudeMeters: 86.885,
    },
    homeView: {
      longitude: 113.52958706944445,
      latitude: 22.252818819444443,
      height: 1200,
      headingDeg: 0,
      pitchDeg: -40,
      rollDeg: 0,
    },
    splatPlacement: {
      anchorLng: 113.52964,
      anchorLat: 22.25333,
      heightOffsetMeters: 90,
      eastMeters: 0,
      northMeters: 0,
      upMeters: 0,
      headingDeg: 290,
      pitchDeg: 0,
      rollDeg: 90,
      scale: 57,
    },
    showCalibrationPanel: false,
  };
}

function createViewerStub() {
  const sceneCanvas = document.createElement("canvas");
  Object.defineProperty(sceneCanvas, "clientWidth", { configurable: true, value: 1280 });
  Object.defineProperty(sceneCanvas, "clientHeight", { configurable: true, value: 720 });
  Object.defineProperty(sceneCanvas, "width", { configurable: true, value: 1280 });
  Object.defineProperty(sceneCanvas, "height", { configurable: true, value: 720 });

  return {
    destroy: vi.fn(),
    isDestroyed: vi.fn(() => false),
    resize: vi.fn(),
    scene: {
      canvas: sceneCanvas,
      context: {
        _gl: {},
      },
      frameState: {
        frameNumber: 1,
      },
      globe: {
        getHeight: vi.fn(() => 12),
      },
      postRender: {
        addEventListener: postRenderAddEventListener,
        removeEventListener: postRenderRemoveEventListener,
      },
      preRender: {
        addEventListener: preRenderAddEventListener,
        removeEventListener: preRenderRemoveEventListener,
      },
      requestRender: vi.fn(),
    },
    camera: {
      positionWC: {},
      directionWC: {},
      frustum: {
        projectionMatrix: {},
        near: 0.5,
        far: 5000,
      },
      upWC: {},
      viewMatrix: {},
    },
  };
}

describe("mountDashboardScene", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/octet-stream",
      },
    });
    createLowAltitudeCesiumViewerMock.mockResolvedValue(createViewerStub());
    getSceneHomeViewSnapshotMock.mockReturnValue({
      longitude: 113.52961,
      latitude: 22.25331,
      height: 1450,
      headingDeg: 286,
      pitchDeg: -42,
      rollDeg: 0,
    });
  });

  it("returns a noop runtime when webgl is unavailable", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const mapContainer = document.createElement("div");
    const unsupportedViewer = createViewerStub();
    (unsupportedViewer.scene as { context?: { _gl?: {} } }).context = undefined;
    createLowAltitudeCesiumViewerMock.mockResolvedValueOnce(unsupportedViewer);

    const runtime = await mountDashboardScene(mapContainer, createSceneConfig());

    expect(createLowAltitudeCesiumViewerMock).toHaveBeenCalledTimes(1);
    expect(sparkRendererCtor).not.toHaveBeenCalled();
    expect(typeof runtime.destroy).toBe("function");
    expect(typeof runtime.resize).toBe("function");
  });

  it("creates a Cesium-backed scene host using the shared Cesium canvas and render hooks", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const mapContainer = document.createElement("div");
    const createExtension = vi.fn();

    await mountDashboardScene(mapContainer, createSceneConfig(), {
      createExtension,
    });

    expect(createLowAltitudeCesiumViewerMock).toHaveBeenCalledTimes(1);
    expect(preRenderAddEventListener).toHaveBeenCalledTimes(1);
    expect(postRenderAddEventListener).toHaveBeenCalledTimes(1);
    expect(rendererCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        alpha: true,
        antialias: false,
        canvas: expect.any(HTMLCanvasElement),
        context: {},
      })
    );
    expect(sparkRendererCtor).toHaveBeenCalledTimes(1);
    expect(sparkRendererCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        enableLod: true,
        originDistance: 0,
        preUpdate: true,
        syncAutoViewpoints: true,
      })
    );
    expect(splatCtor).toHaveBeenCalledWith({
      url: TEST_SPLAT_URL,
      paged: true,
    });
    expect(createExtension).toHaveBeenCalledTimes(1);
    expect(createExtension.mock.calls[0]?.[0]).toMatchObject({
      canvas: expect.any(HTMLCanvasElement),
      geospatial: expect.objectContaining({
        sceneOrigin: expect.objectContaining({
          longitude: 113.52958706944445,
        }),
      }),
      modelRoot: expect.any(THREE.Group),
      sceneRoot: expect.any(THREE.Group),
    });
  });

  it("removes Cesium render hooks during destroy", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const mapContainer = document.createElement("div");

    const runtime = await mountDashboardScene(mapContainer, createSceneConfig());

    runtime.destroy();

    expect(preRenderRemoveEventListener).toHaveBeenCalledTimes(1);
    expect(postRenderRemoveEventListener).toHaveBeenCalledTimes(1);
    expect(rendererDispose).toHaveBeenCalledTimes(1);
  });

  it("publishes the current Cesium camera snapshot through scene options", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const mapContainer = document.createElement("div");
    const onCameraViewChange = vi.fn();

    await mountDashboardScene(mapContainer, createSceneConfig(), {
      onCameraViewChange,
    });

    const preRenderHandler = preRenderAddEventListener.mock.calls[0]?.[0] as
      | (() => void)
      | undefined;
    expect(preRenderHandler).toBeTypeOf("function");

    preRenderHandler?.();

    expect(getSceneHomeViewSnapshotMock).toHaveBeenCalledTimes(1);
    expect(onCameraViewChange).toHaveBeenCalledWith({
      longitude: 113.52961,
      latitude: 22.25331,
      height: 1450,
      headingDeg: 286,
      pitchDeg: -42,
      rollDeg: 0,
    });
  });

  it("applies camera state updates onto the Three camera", async () => {
    const { applyCameraStateToThreeCamera } = await import("../scene/runtime");
    const camera = new THREE.PerspectiveCamera();

    applyCameraStateToThreeCamera(camera, {
      position: { x: 120, y: 80, z: -40 },
      direction: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
      aspect: 1.8,
      fovDeg: 52,
      near: 0.5,
      far: 25000,
    });

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    expect(camera.position.x).toBeCloseTo(120, 6);
    expect(camera.position.y).toBeCloseTo(80, 6);
    expect(camera.position.z).toBeCloseTo(-40, 6);
    expect(camera.aspect).toBeCloseTo(1.8, 6);
    expect(camera.fov).toBeCloseTo(52, 6);
    expect(camera.near).toBeCloseTo(0.5, 6);
    expect(camera.far).toBeCloseTo(25000, 6);
    expect(direction.z).toBeLessThan(-0.9);
  });
});
