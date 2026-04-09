import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SPLAT_URL = "/model/JNUAerial-with_Park-y_up-lod.rad";

const rendererSetPixelRatio = vi.fn();
const rendererSetSize = vi.fn();
const rendererRender = vi.fn();
const rendererSetAnimationLoop = vi.fn();
const rendererDispose = vi.fn();
const sparkRendererDispose = vi.fn();
const splatUpdateGenerator = vi.fn();
const splatDispose = vi.fn();
const sparkRendererCtor = vi.fn();
const sparkControlsCtor = vi.fn();
const sparkControlsUpdate = vi.fn();
const splatCtor = vi.fn();
const cubeTextureLoaderLoad = vi.fn();
const fetchMock = vi.fn();
const mockSceneInstances: Array<{ add: ReturnType<typeof vi.fn>; background: unknown }> = [];

vi.stubGlobal("fetch", fetchMock);

class MockSparkRenderer {
  dispose = sparkRendererDispose;

  constructor(options: unknown) {
    sparkRendererCtor(options);
  }
}

class MockSplatMesh {
  initialized = Promise.resolve();
  updateGenerator = splatUpdateGenerator;
  quaternion = {
    set: vi.fn(),
  };
  renderOrder = 0;
  dispose = splatDispose;

  constructor(options: { url: string; paged: boolean }) {
    splatCtor(options);
  }
}

class MockSparkControls {
  update = sparkControlsUpdate;

  constructor(options: unknown) {
    sparkControlsCtor(options);
  }
}

vi.mock("three", () => ({
  Scene: class {
    add = vi.fn();
    background: unknown;

    constructor() {
      mockSceneInstances.push(this);
    }
  },
  PerspectiveCamera: class {
    aspect = 1;
    position = { set: vi.fn() };
    lookAt = vi.fn();
    updateProjectionMatrix = vi.fn();
    constructor(
      public fov: number,
      public aspectArg: number,
      public near: number,
      public far: number
    ) {}
  },
  WebGLRenderer: class {
    domElement = document.createElement("canvas");
    outputColorSpace: unknown;
    sortObjects = true;
    setPixelRatio = rendererSetPixelRatio;
    setSize = rendererSetSize;
    render = rendererRender;
    setAnimationLoop = rendererSetAnimationLoop;
    dispose = rendererDispose;
    constructor() {}
  },
  Color: class {
    constructor(public value: string) {}
  },
  CubeTextureLoader: class {
    load = cubeTextureLoaderLoad;
  },
  AmbientLight: class {
    constructor() {}
  },
  DirectionalLight: class {
    position = { set: vi.fn() };
    constructor() {}
  },
  SRGBColorSpace: "srgb",
}));

vi.mock("@sparkjsdev/spark", () => ({
  SparkRenderer: MockSparkRenderer,
  SparkControls: MockSparkControls,
  SplatMesh: MockSplatMesh,
}));

describe("mountDashboardScene", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    mockSceneInstances.length = 0;
    cubeTextureLoaderLoad.mockReset();
    cubeTextureLoaderLoad.mockImplementation(() => ({ colorSpace: undefined }));
    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/octet-stream",
      },
    });
  });

  it("returns a noop runtime when webgl is unavailable", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);

    const runtime = await mountDashboardScene(canvas, {
      splatUrl: TEST_SPLAT_URL,
      backgroundColor: "#09131d",
      cameraPosition: [1.8, 1.3, 2.2],
      cameraTarget: [0, 0, 0],
      interactive: false,
    });

    expect(sparkRendererCtor).not.toHaveBeenCalled();
    expect(splatCtor).not.toHaveBeenCalled();
    expect(typeof runtime.destroy).toBe("function");
    expect(typeof runtime.resize).toBe("function");
  });

  it("initializes SparkRenderer and SplatMesh with the configured splat url", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockImplementation((contextId: string) => {
      if (contextId === "webgl2" || contextId === "webgl") {
        return {} as RenderingContext;
      }
      return null;
    });

    await mountDashboardScene(canvas, {
      splatUrl: TEST_SPLAT_URL,
      backgroundColor: "#09131d",
      cameraPosition: [1.8, 1.3, 2.2],
      cameraTarget: [0, 0, 0],
      interactive: false,
    });

    expect(sparkRendererCtor).toHaveBeenCalledTimes(1);
    expect(splatCtor).toHaveBeenCalledWith({
      url: TEST_SPLAT_URL,
      paged: true,
    });
    expect(splatUpdateGenerator).toHaveBeenCalledTimes(1);
    expect(rendererSetAnimationLoop).toHaveBeenCalledTimes(1);
  });

  it("treats the interactive flag as the canvas pointer-event contract", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockImplementation((contextId: string) => {
      if (contextId === "webgl2" || contextId === "webgl") {
        return {} as RenderingContext;
      }
      return null;
    });

    await mountDashboardScene(canvas, {
      splatUrl: TEST_SPLAT_URL,
      backgroundColor: "#09131d",
      cameraPosition: [1.8, 1.3, 2.2],
      cameraTarget: [0, 0, 0],
      interactive: true,
    });

    expect(canvas.style.pointerEvents).toBe("auto");
    expect(canvas.style.touchAction).toBe("none");
  });

  it("wires SparkControls into the animation loop when the scene is interactive", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockImplementation((contextId: string) => {
      if (contextId === "webgl2" || contextId === "webgl") {
        return {} as RenderingContext;
      }
      return null;
    });

    await mountDashboardScene(canvas, {
      splatUrl: TEST_SPLAT_URL,
      backgroundColor: "#09131d",
      cameraPosition: [1.8, 1.3, 2.2],
      cameraTarget: [0, 0, 0],
      interactive: true,
    });

    expect(sparkControlsCtor).toHaveBeenCalledWith({ canvas });
    expect(rendererSetAnimationLoop).toHaveBeenCalledTimes(1);

    const animate = rendererSetAnimationLoop.mock.calls[0]?.[0] as (() => void) | undefined;
    expect(animate).toBeTypeOf("function");

    animate?.();

    expect(sparkControlsUpdate).toHaveBeenCalledTimes(1);
  });

  it("loads the clouds1 skybox into the three scene background", async () => {
    const skyboxTexture = { kind: "skybox" };
    cubeTextureLoaderLoad.mockImplementation(
      (urls: string[], onLoad?: (texture: typeof skyboxTexture) => void) => {
        onLoad?.(skyboxTexture);
        return skyboxTexture;
      }
    );

    const { mountDashboardScene } = await import("../scene/runtime");
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockImplementation((contextId: string) => {
      if (contextId === "webgl2" || contextId === "webgl") {
        return {} as RenderingContext;
      }
      return null;
    });

    await mountDashboardScene(canvas, {
      splatUrl: TEST_SPLAT_URL,
      backgroundColor: "#09131d",
      cameraPosition: [1.8, 1.3, 2.2],
      cameraTarget: [0, 0, 0],
      interactive: false,
    });

    expect(cubeTextureLoaderLoad).toHaveBeenCalledWith(
      [
        "/skybox/clouds1/px.bmp",
        "/skybox/clouds1/nx.bmp",
        "/skybox/clouds1/py.bmp",
        "/skybox/clouds1/ny.bmp",
        "/skybox/clouds1/pz.bmp",
        "/skybox/clouds1/nz.bmp",
      ],
      expect.any(Function),
      undefined,
      expect.any(Function)
    );
    expect(mockSceneInstances[0]?.background).toBe(skyboxTexture);
  });

  it("returns an error runtime when the configured splat url resolves to html", async () => {
    const { mountDashboardScene } = await import("../scene/runtime");
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockImplementation((contextId: string) => {
      if (contextId === "webgl2" || contextId === "webgl") {
        return {} as RenderingContext;
      }
      return null;
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => "text/html",
      },
    });

    const runtime = await mountDashboardScene(canvas, {
      splatUrl: TEST_SPLAT_URL,
      backgroundColor: "#09131d",
      cameraPosition: [1.8, 1.3, 2.2],
      cameraTarget: [0, 0, 0],
      interactive: false,
    });

    expect(splatCtor).not.toHaveBeenCalled();
    expect(runtime.status).toBe("error");
    expect(runtime.errorMessage).toContain("HTML");
  });
});
