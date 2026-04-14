import * as THREE from "three";
import { SparkControls, SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import type { LowAltitudeSceneConfig } from "../types";

type SceneSplatMesh = SplatMesh & THREE.Object3D & { initialized: Promise<void> };
type DashboardSceneStatus = "ready" | "error" | "unsupported";

const SKYBOX_BASE_PATH = "/skybox/clouds1/";
const SKYBOX_EXT = "bmp";

export interface DashboardSceneRuntime {
  destroy(): void;
  resize(): void;
  status: DashboardSceneStatus;
  errorMessage: string;
}

export interface DashboardSceneExtensionContext {
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  config: LowAltitudeSceneConfig;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  sparkRenderer: SparkRenderer;
  splat: SceneSplatMesh;
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
}

function createRuntime(
  status: DashboardSceneStatus,
  errorMessage = "",
  destroy: () => void = () => {},
  resize: () => void = () => {}
): DashboardSceneRuntime {
  return {
    status,
    errorMessage,
    destroy,
    resize,
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
    throw new Error("3DGS 资源地址返回了 HTML 页面，请确认 .rad 文件已放入 public 或静态资源目录");
  }
}

function configureSkybox(scene: THREE.Scene, fallbackColor: string) {
  const urls = ["px", "nx", "py", "ny", "pz", "nz"].map(
    (name) => `${SKYBOX_BASE_PATH}${name}.${SKYBOX_EXT}`
  );

  const texture = new THREE.CubeTextureLoader().load(
    urls,
    (loadedTexture) => {
      scene.background = loadedTexture;
    },
    undefined,
    () => {
      scene.background = new THREE.Color(fallbackColor);
    }
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  scene.background = texture;
}

export async function mountDashboardScene(
  canvas: HTMLCanvasElement,
  config: LowAltitudeSceneConfig,
  options: DashboardSceneMountOptions = {}
): Promise<DashboardSceneRuntime> {
  // Spark handles camera gestures from the canvas element's native pointer events.
  // The page-level layout decides whether those gestures should reach the canvas.
  canvas.style.pointerEvents = config.interactive ? "auto" : "none";
  canvas.style.touchAction = config.interactive ? "none" : "auto";

  if (typeof canvas.getContext !== "function") {
    return createRuntime("unsupported", "当前环境不支持 WebGL，无法渲染 3DGS 场景");
  }

  const hasWebglContext = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  if (!hasWebglContext) {
    return createRuntime("unsupported", "当前环境不支持 WebGL，无法渲染 3DGS 场景");
  }

  let renderer: THREE.WebGLRenderer | null = null;
  let sparkRenderer: SparkRenderer | null = null;
  let sparkControls: SparkControls | null = null;
  let splat: SceneSplatMesh | null = null;
  let extension: DashboardSceneExtension | void = undefined;
  const clock = new THREE.Clock();

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    configureSkybox(scene, config.backgroundColor);
    scene.add(new THREE.AmbientLight("#ffffff", 1.4));

    const directionalLight = new THREE.DirectionalLight("#dfe8ff", 1.8);
    directionalLight.position.set(2, 4, 2);
    scene.add(directionalLight);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(...config.cameraPosition);
    camera.lookAt(...config.cameraTarget);
    camera.updateProjectionMatrix();

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.sortObjects = true;
    renderer.setPixelRatio(window.devicePixelRatio);

    sparkRenderer = new SparkRenderer({
      renderer,
      enableLod: true,
    });
    scene.add(sparkRenderer as unknown as THREE.Object3D);

    if (config.interactive) {
      sparkControls = new SparkControls({ canvas });
    }

    await validateSplatAsset(config.splatUrl);

    splat = new SplatMesh({
      url: config.splatUrl,
      paged: true,
    }) as SceneSplatMesh;
    splat.updateGenerator();
    splat.quaternion?.set?.(0, 0, 0, 1);
    scene.add(splat);

    await splat.initialized;

    const extensionContext: DashboardSceneExtensionContext = {
      camera,
      canvas,
      config,
      renderer,
      scene,
      sparkRenderer,
      splat,
    };
    extension = await options.createExtension?.(extensionContext);

    const resize = () => {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer?.setSize(width, height, false);
      extension?.onResize?.(extensionContext);
      renderer?.render(scene, camera);
    };

    renderer.setAnimationLoop(() => {
      const deltaTime = clock.getDelta();
      sparkControls?.update(camera, camera);
      extension?.onFrame?.({
        ...extensionContext,
        deltaTime,
        elapsedTime: clock.elapsedTime,
      });
      renderer?.render(scene, camera);
    });

    resize();

    return createRuntime(
      "ready",
      "",
      () => {
        renderer?.setAnimationLoop(null);
        extension?.dispose?.();
        splat?.dispose?.();
        sparkControls = null;
        sparkRenderer?.dispose?.();
        renderer?.dispose();
        splat = null;
        renderer = null;
        sparkRenderer = null;
        extension = undefined;
      },
      resize
    );
  } catch (error) {
    extension?.dispose?.();
    splat?.dispose?.();
    sparkControls = null;
    sparkRenderer?.dispose?.();
    renderer?.dispose();
    return createRuntime(
      "error",
      error instanceof Error ? error.message : "无法初始化 3DGS 场景",
      () => {},
      () => {}
    );
  }
}
