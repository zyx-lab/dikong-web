import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import * as Cesium from "cesium";
import type { LowAltitudeSceneConfig, SceneHomeViewConfig, SceneSplatPlacement } from "../types";
import {
  RADAR_LOCAL_TO_ENU_MATRIX,
  applyCameraStateToThreeCamera,
  applyStaticMatrix,
  cloneSceneSplatPlacement,
  createRadarTransformMatrix,
  createSplatTransformMatrix,
  enuToRenderVector,
  geodeticToEnu,
  readEnvNumber,
  type ThreeCameraState,
} from "./geospatial";
import {
  createLowAltitudeCesiumViewer,
  getSceneHomeViewSnapshot,
  syncThreeCameraFromCesiumViewer,
} from "./cesium-base-layer";

type SceneSplatMesh = SplatMesh & THREE.Object3D & { initialized: Promise<void> };
export type DashboardSceneStatus = "ready" | "error" | "unsupported";

export interface DashboardSceneRuntime {
  destroy(): void;
  resize(): void;
  updateConfig(config: LowAltitudeSceneConfig): void;
  status: DashboardSceneStatus;
  errorMessage: string;
}

export interface DashboardSceneGeospatialContext {
  sceneOrigin: LowAltitudeSceneConfig["sceneOrigin"];
  geodeticToEnu: typeof geodeticToEnu;
  enuToRenderVector: typeof enuToRenderVector;
  createSplatTransformMatrix(
    splatPlacement: SceneSplatPlacement,
    anchorHeightMeters?: number
  ): THREE.Matrix4;
  createRadarTransformMatrix(
    sensorOrigin: LowAltitudeSceneConfig["sceneOrigin"],
    localVerticalOffsetMeters?: number
  ): THREE.Matrix4;
  readEnvNumber: typeof readEnvNumber;
  sceneLocalToEnuMatrix: THREE.Matrix4;
  radarLocalToEnuMatrix: THREE.Matrix4;
}

export interface DashboardSceneExtensionContext {
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  config: LowAltitudeSceneConfig;
  mapContainer: HTMLElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  sceneRoot: THREE.Group;
  modelRoot: THREE.Group;
  sparkRenderer: SparkRenderer;
  splat: SceneSplatMesh;
  viewer: Cesium.Viewer;
  geospatial: DashboardSceneGeospatialContext;
}

export interface DashboardSceneFrameContext extends DashboardSceneExtensionContext {
  deltaTime: number;
  elapsedTime: number;
}

export interface DashboardSceneExtension {
  dispose?(): void;
  onFrame?(context: DashboardSceneFrameContext): void;
  onResize?(context: DashboardSceneExtensionContext): void;
}

export interface DashboardSceneMountOptions {
  createExtension?(
    context: DashboardSceneExtensionContext
  ): DashboardSceneExtension | void | Promise<DashboardSceneExtension | void>;
  onCameraViewChange?(snapshot: SceneHomeViewConfig): void;
}

function createRuntime(
  status: DashboardSceneStatus,
  errorMessage = "",
  destroy: () => void = () => {},
  resize: () => void = () => {},
  updateConfig: (config: LowAltitudeSceneConfig) => void = () => {}
): DashboardSceneRuntime {
  return {
    destroy,
    errorMessage,
    resize,
    status,
    updateConfig,
  };
}

async function validateSplatAsset(url: string): Promise<void> {
  if (typeof fetch !== "function") {
    return;
  }

  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`3DGS 资源加载失败，请求状态 ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) {
    throw new Error("3DGS 资源地址返回了 HTML 页面，请确认 .rad 文件已经放到 public 静态目录");
  }
}

function createGeospatialContext(config: LowAltitudeSceneConfig): DashboardSceneGeospatialContext {
  const geospatial: DashboardSceneGeospatialContext = {
    createRadarTransformMatrix(sensorOrigin, localVerticalOffsetMeters = 0) {
      return createRadarTransformMatrix({
        localVerticalOffsetMeters,
        radarLocalToEnuMatrix: RADAR_LOCAL_TO_ENU_MATRIX,
        sceneOrigin: geospatial.sceneOrigin,
        sensorOrigin,
      });
    },
    createSplatTransformMatrix(splatPlacement, anchorHeightMeters) {
      return createSplatTransformMatrix({
        anchorHeightMeters,
        sceneOrigin: geospatial.sceneOrigin,
        splatPlacement,
      });
    },
    enuToRenderVector,
    geodeticToEnu,
    radarLocalToEnuMatrix: RADAR_LOCAL_TO_ENU_MATRIX.clone(),
    readEnvNumber,
    sceneLocalToEnuMatrix: new THREE.Matrix4().identity(),
    sceneOrigin: config.sceneOrigin,
  };
  return geospatial;
}

function applySplatPlacement(
  modelRoot: THREE.Group,
  geospatial: DashboardSceneGeospatialContext,
  splatPlacement: SceneSplatPlacement,
  anchorHeightMeters?: number
) {
  applyStaticMatrix(
    modelRoot,
    geospatial.createSplatTransformMatrix(splatPlacement, anchorHeightMeters)
  );
  modelRoot.updateMatrixWorld(true);
}

function resetRendererState(renderer: THREE.WebGLRenderer) {
  if (typeof renderer.resetState === "function") {
    renderer.resetState();
    return;
  }

  const rendererWithState = renderer as THREE.WebGLRenderer & {
    state?: { reset?: () => void };
  };
  rendererWithState.state?.reset?.();
}

function syncSharedRendererSize(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement) {
  const width = canvas.width || canvas.clientWidth || 1;
  const height = canvas.height || canvas.clientHeight || 1;
  renderer.setSize(width, height, false);
  renderer.setViewport(0, 0, width, height);
}

function resolveSplatAnchorHeight(
  viewer: Cesium.Viewer,
  config: LowAltitudeSceneConfig,
  lastKnownHeightMeters: number
): number {
  const globe = viewer.scene.globe;
  if (typeof globe?.getHeight !== "function") {
    return lastKnownHeightMeters;
  }

  const cartographic = new Cesium.Cartographic(
    Cesium.Math.toRadians(config.splatPlacement.anchorLng),
    Cesium.Math.toRadians(config.splatPlacement.anchorLat),
    0
  );
  const terrainHeight = globe.getHeight(cartographic);
  if (typeof terrainHeight === "number" && Number.isFinite(terrainHeight)) {
    return terrainHeight + config.splatPlacement.heightOffsetMeters;
  }

  return lastKnownHeightMeters;
}

export { applyCameraStateToThreeCamera };
export type { ThreeCameraState };

export async function mountDashboardScene(
  mapContainer: HTMLElement,
  config: LowAltitudeSceneConfig,
  options: DashboardSceneMountOptions = {}
): Promise<DashboardSceneRuntime> {
  let currentConfig = {
    ...config,
    splatPlacement: cloneSceneSplatPlacement(config.splatPlacement),
  };
  const geospatial = createGeospatialContext(currentConfig);
  let viewer: Cesium.Viewer | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let sparkRenderer: SparkRenderer | null = null;
  let extension: DashboardSceneExtension | void = undefined;
  let splat: SceneSplatMesh | null = null;
  let extensionContext: DashboardSceneExtensionContext | null = null;
  let preRenderHandler: (() => void) | null = null;
  let postRenderHandler: (() => void) | null = null;
  let lastCameraViewSnapshotJson = "";
  let currentAnchorHeightMeters =
    currentConfig.sceneOrigin.altitudeMeters + currentConfig.splatPlacement.heightOffsetMeters;

  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight("#ffffff", 1.25));

  const directionalLight = new THREE.DirectionalLight("#dfe8ff", 1.8);
  directionalLight.position.set(2, 4, 2);
  scene.add(directionalLight);

  const sceneRoot = new THREE.Group();
  sceneRoot.name = "LowAltitudeSceneRoot";
  scene.add(sceneRoot);

  const modelRoot = new THREE.Group();
  modelRoot.name = "LowAltitudeModelRoot";
  sceneRoot.add(modelRoot);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100000);

  const cleanupRenderHooks = () => {
    if (!viewer) return;
    if (preRenderHandler) {
      viewer.scene.preRender.removeEventListener(preRenderHandler);
      preRenderHandler = null;
    }
    if (postRenderHandler) {
      viewer.scene.postRender.removeEventListener(postRenderHandler);
      postRenderHandler = null;
    }
  };

  try {
    viewer = await createLowAltitudeCesiumViewer(mapContainer, currentConfig);

    const canvas = viewer.scene.canvas as HTMLCanvasElement | undefined;
    const sharedGl = (
      viewer.scene as Cesium.Scene & {
        context?: { _gl?: WebGLRenderingContext | WebGL2RenderingContext };
      }
    ).context?._gl;

    if (!canvas || !sharedGl) {
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      return createRuntime(
        "unsupported",
        "当前环境不支持共享 WebGL 上下文，无法渲染 Cesium + 3DGS 场景"
      );
    }

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      canvas,
      context: sharedGl,
      powerPreference: "high-performance",
    });
    renderer.autoClear = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.sortObjects = true;
    renderer.setPixelRatio(1);

    sparkRenderer = new SparkRenderer({
      enableLod: true,
      originDistance: 0,
      preUpdate: true,
      renderer,
      syncAutoViewpoints: true,
    });
    scene.add(sparkRenderer as unknown as THREE.Object3D);

    await validateSplatAsset(currentConfig.splatUrl);

    splat = new SplatMesh({
      paged: true,
      url: currentConfig.splatUrl,
    }) as SceneSplatMesh;
    splat.updateGenerator();
    modelRoot.add(splat);
    await splat.initialized;

    currentAnchorHeightMeters = resolveSplatAnchorHeight(
      viewer,
      currentConfig,
      currentAnchorHeightMeters
    );
    applySplatPlacement(
      modelRoot,
      geospatial,
      currentConfig.splatPlacement,
      currentAnchorHeightMeters
    );

    extensionContext = {
      camera,
      canvas,
      config: currentConfig,
      geospatial,
      mapContainer,
      modelRoot,
      renderer,
      scene,
      sceneRoot,
      sparkRenderer,
      splat,
      viewer,
    };
    extension = await options.createExtension?.(extensionContext);

    const resize = () => {
      if (!viewer || !renderer || !extensionContext) return;
      viewer.resize();
      syncThreeCameraFromCesiumViewer(viewer, camera, currentConfig.sceneOrigin);
      syncSharedRendererSize(renderer, canvas);
      extension?.onResize?.(extensionContext);
      viewer.scene.requestRender();
    };

    preRenderHandler = () => {
      if (!viewer || !renderer || !extensionContext) return;
      const deltaTime = clock.getDelta();
      currentAnchorHeightMeters = resolveSplatAnchorHeight(
        viewer,
        currentConfig,
        currentAnchorHeightMeters
      );
      applySplatPlacement(
        modelRoot,
        geospatial,
        currentConfig.splatPlacement,
        currentAnchorHeightMeters
      );
      extension?.onFrame?.({
        ...extensionContext,
        deltaTime,
        elapsedTime: clock.elapsedTime,
      });
      syncThreeCameraFromCesiumViewer(viewer, camera, currentConfig.sceneOrigin);
      const cameraViewSnapshot = getSceneHomeViewSnapshot(viewer);
      const nextSnapshotJson = JSON.stringify(cameraViewSnapshot);
      if (nextSnapshotJson !== lastCameraViewSnapshotJson) {
        lastCameraViewSnapshotJson = nextSnapshotJson;
        options.onCameraViewChange?.(cameraViewSnapshot);
      }
    };

    postRenderHandler = () => {
      if (!renderer) return;
      syncSharedRendererSize(renderer, canvas);
      resetRendererState(renderer);
      renderer.render(scene, camera);
      resetRendererState(renderer);
    };

    viewer.scene.preRender.addEventListener(preRenderHandler);
    viewer.scene.postRender.addEventListener(postRenderHandler);

    resize();

    const destroy = () => {
      cleanupRenderHooks();
      extension?.dispose?.();
      splat?.removeFromParent();
      splat?.dispose?.();
      sparkRenderer?.dispose?.();
      renderer?.dispose();
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      extension = undefined;
      extensionContext = null;
      splat = null;
      sparkRenderer = null;
      renderer = null;
      viewer = null;
    };

    const updateConfig = (nextConfig: LowAltitudeSceneConfig) => {
      currentConfig = {
        ...nextConfig,
        splatPlacement: cloneSceneSplatPlacement(nextConfig.splatPlacement),
      };
      geospatial.sceneOrigin = currentConfig.sceneOrigin;
      currentAnchorHeightMeters =
        currentConfig.sceneOrigin.altitudeMeters + currentConfig.splatPlacement.heightOffsetMeters;
      if (extensionContext) {
        extensionContext.config = currentConfig;
      }
      applySplatPlacement(
        modelRoot,
        geospatial,
        currentConfig.splatPlacement,
        currentAnchorHeightMeters
      );
      viewer?.scene.requestRender();
    };

    return createRuntime("ready", "", destroy, resize, updateConfig);
  } catch (error) {
    cleanupRenderHooks();
    extension?.dispose?.();
    splat?.removeFromParent();
    splat?.dispose?.();
    sparkRenderer?.dispose?.();
    renderer?.dispose();
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
    }
    return createRuntime(
      "error",
      error instanceof Error ? error.message : "无法初始化 Cesium + 3DGS 场景"
    );
  }
}
