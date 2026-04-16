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
type SparkUniformValue<T> = { value: T };
type TerrainExternalTexture = THREE.Texture & { sourceTexture?: unknown };
type PagedSplatHandle = {
  numSplats?: number;
};

interface SparkTerrainUniformMap {
  terrainDepthBias?: SparkUniformValue<number>;
  terrainDepthEnable?: SparkUniformValue<boolean>;
  terrainDepthFar?: SparkUniformValue<number>;
  terrainDepthKeepOutClipToView?: SparkUniformValue<THREE.Matrix4>;
  terrainDepthKeepOutEnable?: SparkUniformValue<boolean>;
  terrainDepthKeepOutFootprintMax?: SparkUniformValue<THREE.Vector2>;
  terrainDepthKeepOutFootprintMin?: SparkUniformValue<THREE.Vector2>;
  terrainDepthKeepOutMaskTexture?: SparkUniformValue<THREE.Texture | null>;
  terrainDepthKeepOutViewToLocal?: SparkUniformValue<THREE.Matrix4>;
  terrainDepthLog2FarDepthFromNearPlusOne?: SparkUniformValue<number>;
  terrainDepthNear?: SparkUniformValue<number>;
  terrainDepthTexture?: SparkUniformValue<THREE.Texture | null>;
  terrainDepthViewport?: SparkUniformValue<THREE.Vector2>;
}

interface TerrainOcclusionState {
  active: boolean;
  biasMeters: number;
  enabled: boolean;
  externalTexture: TerrainExternalTexture | null;
  keepOutActive: boolean;
  keepOutBoundsMax: THREE.Vector3 | null;
  keepOutBoundsMin: THREE.Vector3 | null;
  keepOutEnabled: boolean;
  keepOutFootprintMax: THREE.Vector2 | null;
  keepOutFootprintMin: THREE.Vector2 | null;
  keepOutMaskCoverage: number;
  keepOutMaskHeight: number;
  keepOutMaskSplats: number;
  keepOutMaskTexture: THREE.DataTexture | null;
  keepOutMaskWidth: number;
  keepOutUniformsAvailable: boolean;
  lastFar: number | null;
  lastNear: number | null;
}

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

function getSparkTerrainUniforms(
  sparkRenderer: SparkRenderer
): SparkTerrainUniformMap | undefined {
  return (sparkRenderer as SparkRenderer & { uniforms?: SparkTerrainUniformMap }).uniforms;
}

function createTerrainDepthTextureBridge(): TerrainExternalTexture | null {
  const ExternalTextureCtor = (
    THREE as typeof THREE & {
      ExternalTexture?: new () => THREE.Texture;
    }
  ).ExternalTexture;
  if (typeof ExternalTextureCtor !== "function") {
    return null;
  }

  const externalTexture = new ExternalTextureCtor() as TerrainExternalTexture;
  externalTexture.generateMipmaps = false;
  externalTexture.flipY = false;
  externalTexture.minFilter = THREE.NearestFilter;
  externalTexture.magFilter = THREE.NearestFilter;
  return externalTexture;
}

function computeKeepOutMaskDimensions(spanX: number, spanZ: number) {
  const maxDimension = 384;
  const minDimension = 96;
  if (!(spanX > 0) || !(spanZ > 0)) {
    return { height: minDimension, width: minDimension };
  }
  if (spanX >= spanZ) {
    return {
      height: Math.max(minDimension, Math.round((maxDimension * spanZ) / spanX)),
      width: maxDimension,
    };
  }
  return {
    height: maxDimension,
    width: Math.max(minDimension, Math.round((maxDimension * spanX) / spanZ)),
  };
}

function dilateBinaryMask(source: Uint8Array, width: number, height: number, radius: number) {
  if (!(radius > 0)) {
    return source.slice();
  }

  const result = new Uint8Array(source.length);
  for (let y = 0; y < height; y += 1) {
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const minX = Math.max(0, x - radius);
      const maxX = Math.min(width - 1, x + radius);
      let filled = 0;
      for (let yy = minY; yy <= maxY && filled === 0; yy += 1) {
        const rowOffset = yy * width;
        for (let xx = minX; xx <= maxX; xx += 1) {
          if (source[rowOffset + xx] !== 0) {
            filled = 255;
            break;
          }
        }
      }
      result[y * width + x] = filled;
    }
  }
  return result;
}

function erodeBinaryMask(source: Uint8Array, width: number, height: number, radius: number) {
  if (!(radius > 0)) {
    return source.slice();
  }

  const result = new Uint8Array(source.length);
  for (let y = 0; y < height; y += 1) {
    const minY = y - radius;
    const maxY = y + radius;
    for (let x = 0; x < width; x += 1) {
      const minX = x - radius;
      const maxX = x + radius;
      let filled = 255;
      for (let yy = minY; yy <= maxY && filled !== 0; yy += 1) {
        if (yy < 0 || yy >= height) {
          filled = 0;
          break;
        }
        const rowOffset = yy * width;
        for (let xx = minX; xx <= maxX; xx += 1) {
          if (xx < 0 || xx >= width || source[rowOffset + xx] === 0) {
            filled = 0;
            break;
          }
        }
      }
      result[y * width + x] = filled;
    }
  }
  return result;
}

function buildKeepOutMaskTexture(
  splat: SceneSplatMesh,
  boundsMin: THREE.Vector3,
  boundsMax: THREE.Vector3
) {
  const spanX = Math.max(1e-3, boundsMax.x - boundsMin.x);
  const spanZ = Math.max(1e-3, boundsMax.z - boundsMin.z);
  const { height, width } = computeKeepOutMaskDimensions(spanX, spanZ);
  const worldToMaskX = width / spanX;
  const worldToMaskZ = height / spanZ;
  const raster = new Uint8Array(width * height);
  const axisX = new THREE.Vector3();
  const axisY = new THREE.Vector3();
  const axisZ = new THREE.Vector3();
  let contributingSplats = 0;

  splat.forEachSplat((_index, center, scales, quaternion, opacity) => {
    if (!(opacity >= 1 / 255)) {
      return;
    }

    const sigmaX = 3 * Math.max(0, scales.x);
    const sigmaY = 3 * Math.max(0, scales.y);
    const sigmaZ = 3 * Math.max(0, scales.z);
    if (sigmaX <= 0 && sigmaY <= 0 && sigmaZ <= 0) {
      return;
    }

    axisX.set(sigmaX, 0, 0).applyQuaternion(quaternion);
    axisY.set(0, sigmaY, 0).applyQuaternion(quaternion);
    axisZ.set(0, 0, sigmaZ).applyQuaternion(quaternion);

    const covXX = axisX.x * axisX.x + axisY.x * axisY.x + axisZ.x * axisZ.x;
    const covXZ = axisX.x * axisX.z + axisY.x * axisY.z + axisZ.x * axisZ.z;
    const covZZ = axisX.z * axisX.z + axisY.z * axisY.z + axisZ.z * axisZ.z;

    const centerPx = (center.x - boundsMin.x) * worldToMaskX;
    const centerPz = (center.z - boundsMin.z) * worldToMaskZ;
    const covPxXX = covXX * worldToMaskX * worldToMaskX;
    const covPxXZ = covXZ * worldToMaskX * worldToMaskZ;
    const covPxZZ = covZZ * worldToMaskZ * worldToMaskZ;
    const extentX = Math.sqrt(Math.max(covPxXX, 0.25));
    const extentZ = Math.sqrt(Math.max(covPxZZ, 0.25));
    const minPx = Math.max(0, Math.floor(centerPx - extentX - 1));
    const maxPx = Math.min(width - 1, Math.ceil(centerPx + extentX + 1));
    const minPz = Math.max(0, Math.floor(centerPz - extentZ - 1));
    const maxPz = Math.min(height - 1, Math.ceil(centerPz + extentZ + 1));
    if (minPx > maxPx || minPz > maxPz) {
      return;
    }

    const det = covPxXX * covPxZZ - covPxXZ * covPxXZ;
    contributingSplats += 1;

    if (!(det > 1e-6)) {
      const stampRadius = Math.max(0.75, Math.sqrt(Math.max(covPxXX, covPxZZ, 0.75)));
      const stampRadiusSq = stampRadius * stampRadius;
      for (let py = minPz; py <= maxPz; py += 1) {
        const dz = py + 0.5 - centerPz;
        const rowOffset = py * width;
        for (let px = minPx; px <= maxPx; px += 1) {
          const dx = px + 0.5 - centerPx;
          if (dx * dx + dz * dz <= stampRadiusSq) {
            raster[rowOffset + px] = 255;
          }
        }
      }
      return;
    }

    const invXX = covPxZZ / det;
    const invXZ = -covPxXZ / det;
    const invZZ = covPxXX / det;
    for (let py = minPz; py <= maxPz; py += 1) {
      const dz = py + 0.5 - centerPz;
      const rowOffset = py * width;
      for (let px = minPx; px <= maxPx; px += 1) {
        const dx = px + 0.5 - centerPx;
        const distSq = dx * dx * invXX + 2 * dx * dz * invXZ + dz * dz * invZZ;
        if (distSq <= 1) {
          raster[rowOffset + px] = 255;
        }
      }
    }
  });

  const closedMask = erodeBinaryMask(dilateBinaryMask(raster, width, height, 1), width, height, 1);
  const expandedMask = dilateBinaryMask(closedMask, width, height, 1);
  let coveredPixels = 0;
  for (let index = 0; index < expandedMask.length; index += 1) {
    if (expandedMask[index] !== 0) {
      coveredPixels += 1;
    }
  }

  const texture = new THREE.DataTexture(
    expandedMask,
    width,
    height,
    THREE.RedFormat,
    THREE.UnsignedByteType
  );
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return {
    coverage: coveredPixels / expandedMask.length,
    height,
    splats: contributingSplats,
    texture,
    width,
  };
}

function getPagedActiveSplatCount(splat: SceneSplatMesh) {
  return ((splat as SceneSplatMesh & { paged?: PagedSplatHandle }).paged?.numSplats ?? 0);
}

function createTerrainOcclusionState(
  sparkRenderer: SparkRenderer,
  splat: SceneSplatMesh
): TerrainOcclusionState {
  const uniforms = getSparkTerrainUniforms(sparkRenderer);
  const externalTexture = createTerrainDepthTextureBridge();
  if (!externalTexture) {
    console.warn(
      "[low-altitude-screen] Terrain occlusion bridge disabled: THREE.ExternalTexture is unavailable."
    );
  }

  const state: TerrainOcclusionState = {
    active: false,
    biasMeters: 0.75,
    enabled: Boolean(externalTexture),
    externalTexture,
    keepOutActive: false,
    keepOutBoundsMax: null,
    keepOutBoundsMin: null,
    keepOutEnabled: true,
    keepOutFootprintMax: null,
    keepOutFootprintMin: null,
    keepOutMaskCoverage: 0,
    keepOutMaskHeight: 0,
    keepOutMaskSplats: 0,
    keepOutMaskTexture: null,
    keepOutMaskWidth: 0,
    keepOutUniformsAvailable: false,
    lastFar: null,
    lastNear: null,
  };

  if (!uniforms?.terrainDepthBias) {
    state.enabled = false;
    return state;
  }

  uniforms.terrainDepthBias.value = state.biasMeters;
  state.keepOutUniformsAvailable = Boolean(
    uniforms.terrainDepthKeepOutEnable &&
      uniforms.terrainDepthKeepOutFootprintMin &&
      uniforms.terrainDepthKeepOutFootprintMax &&
      uniforms.terrainDepthKeepOutMaskTexture &&
      uniforms.terrainDepthKeepOutClipToView &&
      uniforms.terrainDepthKeepOutViewToLocal
  );

  if (!state.keepOutUniformsAvailable) {
    state.keepOutEnabled = false;
    console.warn(
      "[low-altitude-screen] Terrain footprint keep-out uniforms are unavailable in the loaded Spark module."
    );
    return state;
  }

  let splatLocalBounds: THREE.Box3;
  try {
    splatLocalBounds = splat.getBoundingBox(false);
  } catch (error) {
    state.keepOutEnabled = false;
    console.warn(
      "[low-altitude-screen] Terrain keep-out bounds are unavailable for the current splat source.",
      error
    );
    return state;
  }

  state.keepOutBoundsMin = splatLocalBounds.min.clone();
  state.keepOutBoundsMax = splatLocalBounds.max.clone();
  state.keepOutFootprintMin = new THREE.Vector2(
    state.keepOutBoundsMin.x,
    state.keepOutBoundsMin.z
  );
  state.keepOutFootprintMax = new THREE.Vector2(
    state.keepOutBoundsMax.x,
    state.keepOutBoundsMax.z
  );

  const keepOutMask = buildKeepOutMaskTexture(splat, state.keepOutBoundsMin, state.keepOutBoundsMax);
  if (!keepOutMask || keepOutMask.coverage <= 0) {
    state.keepOutEnabled = false;
    console.warn(
      "[low-altitude-screen] Terrain keep-out mask generation produced an empty mask."
    );
    return state;
  }

  state.keepOutMaskTexture = keepOutMask.texture;
  state.keepOutMaskWidth = keepOutMask.width;
  state.keepOutMaskHeight = keepOutMask.height;
  state.keepOutMaskCoverage = keepOutMask.coverage;
  state.keepOutMaskSplats = keepOutMask.splats;
  return state;
}

function disposeTerrainOcclusionState(state: TerrainOcclusionState | null) {
  state?.keepOutMaskTexture?.dispose();
}

function getCesiumTerrainFrustumInfo(viewer: Cesium.Viewer): {
  far: number;
  near: number;
  uniformState?: {
    currentFrustum?: { x?: number; y?: number } | number[];
    globeDepthTexture?: { _texture?: unknown };
  };
} | null {
  const uniformState = (
    viewer.scene as Cesium.Scene & {
      context?: {
        uniformState?: {
          currentFrustum?: { x?: number; y?: number } | number[];
          globeDepthTexture?: { _texture?: unknown };
        };
      };
    }
  ).context?.uniformState;
  const frustum = uniformState?.currentFrustum;
  const near = typeof (frustum as { x?: number } | undefined)?.x === "number"
    ? (frustum as { x: number }).x
    : Array.isArray(frustum)
      ? frustum[0]
      : undefined;
  const far = typeof (frustum as { y?: number } | undefined)?.y === "number"
    ? (frustum as { y: number }).y
    : Array.isArray(frustum)
      ? frustum[1]
      : undefined;

  if (
    typeof near !== "number" ||
    typeof far !== "number" ||
    !Number.isFinite(near) ||
    !Number.isFinite(far) ||
    far <= near
  ) {
    return null;
  }

  return { far, near, uniformState };
}

function syncTerrainOcclusionUniforms(
  state: TerrainOcclusionState,
  sparkRenderer: SparkRenderer,
  viewer: Cesium.Viewer,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  splat: SceneSplatMesh
) {
  const uniforms = getSparkTerrainUniforms(sparkRenderer);
  if (!uniforms) {
    return false;
  }

  const terrainDepthEnable = uniforms.terrainDepthEnable;
  const terrainDepthBias = uniforms.terrainDepthBias;
  const terrainDepthTexture = uniforms.terrainDepthTexture;
  const terrainDepthViewport = uniforms.terrainDepthViewport;
  const terrainDepthNear = uniforms.terrainDepthNear;
  const terrainDepthFar = uniforms.terrainDepthFar;
  const terrainDepthLog2FarDepthFromNearPlusOne = uniforms.terrainDepthLog2FarDepthFromNearPlusOne;
  const terrainDepthKeepOutEnable = uniforms.terrainDepthKeepOutEnable;
  const terrainDepthKeepOutFootprintMin = uniforms.terrainDepthKeepOutFootprintMin;
  const terrainDepthKeepOutFootprintMax = uniforms.terrainDepthKeepOutFootprintMax;
  const terrainDepthKeepOutMaskTexture = uniforms.terrainDepthKeepOutMaskTexture;
  const terrainDepthKeepOutClipToView = uniforms.terrainDepthKeepOutClipToView;
  const terrainDepthKeepOutViewToLocal = uniforms.terrainDepthKeepOutViewToLocal;

  if (
    !terrainDepthEnable ||
    !terrainDepthBias ||
    !terrainDepthTexture ||
    !terrainDepthViewport ||
    !terrainDepthNear ||
    !terrainDepthFar ||
    !terrainDepthLog2FarDepthFromNearPlusOne
  ) {
    return false;
  }

  terrainDepthEnable.value = false;
  if (terrainDepthKeepOutEnable) {
    terrainDepthKeepOutEnable.value = false;
  }
  state.active = false;
  state.keepOutActive = false;
  state.lastNear = null;
  state.lastFar = null;

  if (!state.enabled || !state.externalTexture) {
    return false;
  }

  const frustumInfo = getCesiumTerrainFrustumInfo(viewer);
  const globeGlTexture = frustumInfo?.uniformState?.globeDepthTexture?._texture;
  if (!globeGlTexture || canvas.width <= 0 || canvas.height <= 0) {
    return false;
  }

  state.externalTexture.sourceTexture = globeGlTexture;
  terrainDepthTexture.value = state.externalTexture;
  terrainDepthViewport.value.set(canvas.width, canvas.height);
  terrainDepthNear.value = frustumInfo.near;
  terrainDepthFar.value = frustumInfo.far;
  terrainDepthLog2FarDepthFromNearPlusOne.value = Math.log2(
    frustumInfo.far - frustumInfo.near + 1
  );
  terrainDepthBias.value = state.biasMeters;
  terrainDepthEnable.value = true;

  const keepOutMaskTexture = state.keepOutMaskTexture;
  const keepOutFootprintMin = state.keepOutFootprintMin;
  const keepOutFootprintMax = state.keepOutFootprintMax;
  const keepOutReady =
    state.keepOutUniformsAvailable &&
    state.keepOutEnabled &&
    Boolean(keepOutMaskTexture) &&
    Boolean(keepOutFootprintMin) &&
    Boolean(keepOutFootprintMax) &&
    Boolean(terrainDepthKeepOutFootprintMin) &&
    Boolean(terrainDepthKeepOutFootprintMax) &&
    Boolean(terrainDepthKeepOutMaskTexture) &&
    Boolean(terrainDepthKeepOutClipToView) &&
    Boolean(terrainDepthKeepOutViewToLocal) &&
    Boolean(terrainDepthKeepOutEnable);

  if (
    keepOutReady &&
    keepOutMaskTexture &&
    keepOutFootprintMin &&
    keepOutFootprintMax &&
    terrainDepthKeepOutFootprintMin &&
    terrainDepthKeepOutFootprintMax &&
    terrainDepthKeepOutMaskTexture &&
    terrainDepthKeepOutClipToView &&
    terrainDepthKeepOutViewToLocal &&
    terrainDepthKeepOutEnable
  ) {
    terrainDepthKeepOutFootprintMin.value.copy(keepOutFootprintMin);
    terrainDepthKeepOutFootprintMax.value.copy(keepOutFootprintMax);
    terrainDepthKeepOutMaskTexture.value = keepOutMaskTexture;
    terrainDepthKeepOutClipToView.value.copy(camera.projectionMatrixInverse);
    terrainDepthKeepOutViewToLocal.value
      .copy(splat.matrixWorld)
      .invert()
      .multiply(camera.matrixWorld);
    terrainDepthKeepOutEnable.value = true;
    state.keepOutActive = true;
  }

  state.active = true;
  state.lastNear = frustumInfo.near;
  state.lastFar = frustumInfo.far;
  return true;
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
  let terrainOcclusionState: TerrainOcclusionState | null = null;
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
      if (!renderer || !viewer || !sparkRenderer || !splat) return;
      syncSharedRendererSize(renderer, canvas);
      scene.updateMatrixWorld(true);
      const shouldRetryTerrainOcclusion =
        terrainOcclusionState &&
        !terrainOcclusionState.keepOutMaskTexture &&
        getPagedActiveSplatCount(splat) > 0;
      if (!terrainOcclusionState || shouldRetryTerrainOcclusion) {
        disposeTerrainOcclusionState(terrainOcclusionState);
        terrainOcclusionState = createTerrainOcclusionState(sparkRenderer, splat);
      }
      syncTerrainOcclusionUniforms(
        terrainOcclusionState,
        sparkRenderer,
        viewer,
        camera,
        canvas,
        splat
      );
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
      disposeTerrainOcclusionState(terrainOcclusionState);
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
      terrainOcclusionState = null;
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
    disposeTerrainOcclusionState(terrainOcclusionState);
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
