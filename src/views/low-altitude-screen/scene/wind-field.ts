import type { Ref } from "vue";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type {
  DashboardSceneExtension,
  DashboardSceneExtensionContext,
  DashboardSceneMountOptions,
} from "./runtime";

export type WindRenderMode = "arrow" | "particle";
export type WindFieldStatus = "idle" | "loading" | "ready" | "error";

export interface ProcessedWindMeta {
  sourceFile: string;
  startTime: string;
  durationSeconds: number;
  displayDurationSeconds: number;
  sampleIntervalSeconds: number;
  beamElevationDeg: number;
  layerCount: number;
  invalidValue: number;
  displayScale: number;
  maxHorizontalSpeed: number;
  maxAbsVerticalSpeed: number;
  directionConvention: string;
}

export interface ProcessedWindLayer {
  layerIndex: number;
  slantDistance: number;
  height: number;
  radius: number;
  displayHeight: number;
  displayRadius: number;
}

export interface ProcessedWindSample {
  layerIndex: number;
  valid: boolean;
  speed: number | null;
  directionDeg: number | null;
  flowDirectionDeg: number | null;
  vectorX: number | null;
  vectorZ: number | null;
  verticalSpeed: number | null;
  ti: number | null;
  snr: number | null;
}

export interface ProcessedWindFrame {
  index: number;
  timestamp: string;
  elapsedSeconds: number;
  samples: ProcessedWindSample[];
}

export interface ProcessedWindData {
  meta: ProcessedWindMeta;
  layers: ProcessedWindLayer[];
  frames: ProcessedWindFrame[];
}

export interface WindLegendStop {
  color: string;
  label: string;
  value: number;
  valueText: string;
}

export interface WindFieldStatusEvent {
  data?: ProcessedWindData;
  errorMessage: string;
  status: WindFieldStatus;
}

export interface WindFieldFrameEvent {
  layerCount: number;
  timeText: string;
}

export interface WindFieldSceneExtensionOptions {
  dataUrl?: string;
  occluderUrl?: string;
  onFrameChange?(event: WindFieldFrameEvent): void;
  onStatusChange?(event: WindFieldStatusEvent): void;
  renderMode: Ref<WindRenderMode>;
  showVerticalAirflow: Ref<boolean>;
  visible: Ref<boolean>;
}

interface WindLayerVisual {
  disk: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  layerIndex: number;
  ring: Line2;
}

interface WindParticleSeed {
  baseAngle: number;
  baseRadiusRatio: number;
  lateralJitter: number;
  layerIndex: number;
  phaseOffset: number;
  speedFactor: number;
  verticalJitter: number;
}

interface WindFieldState {
  arrowHeads?: THREE.InstancedMesh;
  arrowShafts?: THREE.InstancedMesh;
  data?: ProcessedWindData;
  layerMap: Map<number, ProcessedWindLayer>;
  layerVisuals: WindLayerVisual[];
  occluder?: THREE.Group;
  particleSeeds: WindParticleSeed[];
  particles?: THREE.Points;
  playbackTime: number;
  root?: THREE.Group;
}

const DEFAULT_WIND_DATA_URL = "/generated/secondWindSpeed_GHH234012_20260116.processed.json";
const DEFAULT_OCCLUDER_URL = "/video+xyz/JNU.obj";
const RADAR_GLYPH_MIN_PER_LAYER = 5;
const RADAR_GLYPH_MAX_PER_LAYER = 44;
const RADAR_GLYPH_DENSITY = 6.6;
const RADAR_PARTICLE_SIZE = 0.09;
const RADAR_FLOW_VISUAL_GAIN = 1.65;
const RADAR_VERTICAL_VISUAL_GAIN = 2.1;
const RADAR_VERTICAL_OFFSET_METERS = -20;
const RADAR_SENSOR_MARKER_RADIUS = 0.08;
const RADAR_SENSOR_STEM_RADIUS = 0.012;
const RADAR_SENSOR_STEM_BASE_RADIUS = 0.018;
const SCENE_OCCLUDER_RENDER_ORDER = 90;
const RADAR_RENDER_ORDER = 140;
const DEFAULT_RADAR_GPS_POSITION = Object.freeze({
  altitudeMeters: 86.885,
  latitude: 22.252818819444443,
  longitude: 113.52958706944445,
});
const SCENE_GPS_ORIGIN = Object.freeze({
  altitudeMeters: 86.885,
  latitude: 22.252818819444443,
  longitude: 113.52958706944445,
});
const RADAR_GPS_POSITION = Object.freeze({
  altitudeMeters: readEnvNumber(
    import.meta.env.VITE_RADAR_START_ALTITUDE_METERS,
    DEFAULT_RADAR_GPS_POSITION.altitudeMeters
  ),
  latitude: readEnvNumber(
    import.meta.env.VITE_RADAR_START_LATITUDE,
    DEFAULT_RADAR_GPS_POSITION.latitude
  ),
  longitude: readEnvNumber(
    import.meta.env.VITE_RADAR_START_LONGITUDE,
    DEFAULT_RADAR_GPS_POSITION.longitude
  ),
});
const SFM_TO_ENU_MATRIX = new THREE.Matrix4().set(
  23.32268437,
  23.71730027,
  -52.64161238,
  35.91473514,
  57.73477094,
  -10.15823258,
  21.00247195,
  52.1704996,
  -0.58814194,
  -56.67360295,
  -25.79445891,
  24.2211397,
  0,
  0,
  0,
  1
);
const SFM_TO_UNITY_MATRIX = new THREE.Matrix4().set(
  1,
  0,
  0,
  0,
  0,
  -0.9081,
  -0.4187,
  0,
  0,
  0.4187,
  -0.9081,
  0,
  0,
  0,
  0,
  1
);
const RIGHT_TO_LEFT_HAND_MATRIX = new THREE.Matrix4().makeScale(1, 1, -1);
const RADAR_LOCAL_TO_ENU_MATRIX = new THREE.Matrix4().set(
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  1
);
const radarLowColor = new THREE.Color("#4ca8ff");
const radarMidColor = new THREE.Color("#52ffd7");
const radarHighColor = new THREE.Color("#ffb36b");
const radarMutedColor = new THREE.Color("#395466");
const radarWorkingColor = new THREE.Color();
const radarPosition = new THREE.Vector3();
const radarFlowVector = new THREE.Vector3();
const radarArrowVector = new THREE.Vector3();
const radarArrowDirection = new THREE.Vector3();
const radarArrowUp = new THREE.Vector3(0, 1, 0);
const radarArrowCenter = new THREE.Vector3();
const radarArrowScale = new THREE.Vector3();
const radarArrowQuaternion = new THREE.Quaternion();
const radarArrowMatrixHelper = new THREE.Object3D();
const radarLocalToWorldMatrix = createRadarLocalToWorldMatrix();
const RADAR_LOCAL_UNIT_SCALE = getAverageMatrixScale(radarLocalToWorldMatrix);
const RADAR_WORLD_TO_LOCAL_SCALE = RADAR_LOCAL_UNIT_SCALE > 0 ? 1 / RADAR_LOCAL_UNIT_SCALE : 1;

export function buildWindLegendStops(maxHorizontalSpeed: number): WindLegendStop[] {
  const maxSpeed = Math.max(maxHorizontalSpeed, 0);
  if (maxSpeed <= 0) return [];

  return [1, 0.8, 0.6, 0.4, 0.2, 0].map((ratio, index) => {
    const value = maxSpeed * ratio;
    return {
      color: getRadarColorStyle(ratio),
      label:
        index === 0
          ? "强"
          : index === 1
            ? "较强"
            : index === 2
              ? "中等"
              : index === 3
                ? "较弱"
                : index === 4
                  ? "微风"
                  : "静风",
      value,
      valueText: value >= 10 ? value.toFixed(0) : value.toFixed(1),
    };
  });
}

export function createWindFieldSceneExtension(
  options: WindFieldSceneExtensionOptions
): DashboardSceneMountOptions["createExtension"] {
  return async (context) => {
    const state: WindFieldState = {
      layerMap: new Map(),
      layerVisuals: [],
      particleSeeds: [],
      playbackTime: 0,
    };

    options.onStatusChange?.({
      errorMessage: "",
      status: "loading",
    });

    try {
      const [data, occluderSource] = await Promise.all([
        fetchWindData(options.dataUrl ?? DEFAULT_WIND_DATA_URL),
        loadOccluderSource(options.occluderUrl ?? DEFAULT_OCCLUDER_URL),
      ]);

      state.data = data;
      state.root = createWindFieldRoot(context, data, state);
      context.scene.add(state.root);

      if (occluderSource) {
        state.occluder = createSceneOccluderMesh(occluderSource);
        context.scene.add(state.occluder);
      }

      applyWindVisibility(state, options.visible.value, options.renderMode.value);
      syncWindResolution(state, context);
      options.onStatusChange?.({
        data,
        errorMessage: "",
        status: "ready",
      });

      return {
        dispose() {
          if (state.root) {
            context.scene.remove(state.root);
            disposeObject3D(state.root);
            state.root = undefined;
          }
          if (state.occluder) {
            context.scene.remove(state.occluder);
            disposeObject3D(state.occluder);
            state.occluder = undefined;
          }
          state.layerVisuals = [];
          state.layerMap.clear();
          state.particleSeeds = [];
          state.particles = undefined;
          state.arrowShafts = undefined;
          state.arrowHeads = undefined;
        },
        onFrame(frameContext) {
          if (!state.data) return;
          const duration = Math.max(state.data.meta.durationSeconds, 1);
          state.playbackTime = (state.playbackTime + frameContext.deltaTime) % duration;
          applyWindVisibility(state, options.visible.value, options.renderMode.value);
          updateWindVisualization(state, state.playbackTime, options.showVerticalAirflow.value);
          options.onFrameChange?.({
            layerCount: state.data.meta.layerCount,
            timeText: formatDuration(Math.min(state.playbackTime, Math.max(duration - 1, 0))),
          });
        },
        onResize(resizeContext) {
          syncWindResolution(state, resizeContext);
        },
      } satisfies DashboardSceneExtension;
    } catch (error) {
      options.onStatusChange?.({
        errorMessage:
          error instanceof Error ? error.message : "无法初始化风场可视化",
        status: "error",
      });
      return undefined;
    }
  };
}

async function fetchWindData(url: string): Promise<ProcessedWindData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`无法加载风廓线文件: ${response.status}`);
  }
  return (await response.json()) as ProcessedWindData;
}

async function loadOccluderSource(url: string): Promise<THREE.Group | undefined> {
  try {
    return await new OBJLoader().loadAsync(url);
  } catch {
    return undefined;
  }
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function readEnvNumber(rawValue: string | number | undefined, fallbackValue: number): number {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }
  if (typeof rawValue === "string") {
    const parsed = Number(rawValue.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallbackValue;
}

function geodeticToEcef(
  latitude: number,
  longitude: number,
  altitudeMeters: number
): THREE.Vector3 {
  const semiMajorAxis = 6378137;
  const flattening = 1 / 298.257223563;
  const eccentricitySquared = 2 * flattening - flattening * flattening;
  const latitudeRad = degreesToRadians(latitude);
  const longitudeRad = degreesToRadians(longitude);
  const sinLatitude = Math.sin(latitudeRad);
  const cosLatitude = Math.cos(latitudeRad);
  const sinLongitude = Math.sin(longitudeRad);
  const cosLongitude = Math.cos(longitudeRad);
  const primeVerticalRadius =
    semiMajorAxis / Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);

  return new THREE.Vector3(
    (primeVerticalRadius + altitudeMeters) * cosLatitude * cosLongitude,
    (primeVerticalRadius + altitudeMeters) * cosLatitude * sinLongitude,
    (primeVerticalRadius * (1 - eccentricitySquared) + altitudeMeters) * sinLatitude
  );
}

function geodeticToEnu(
  latitude: number,
  longitude: number,
  altitudeMeters: number,
  originLatitude: number,
  originLongitude: number,
  originAltitudeMeters: number
): THREE.Vector3 {
  const ecef = geodeticToEcef(latitude, longitude, altitudeMeters);
  const originEcef = geodeticToEcef(originLatitude, originLongitude, originAltitudeMeters);
  const delta = ecef.sub(originEcef);
  const originLatitudeRad = degreesToRadians(originLatitude);
  const originLongitudeRad = degreesToRadians(originLongitude);
  const sinLatitude = Math.sin(originLatitudeRad);
  const cosLatitude = Math.cos(originLatitudeRad);
  const sinLongitude = Math.sin(originLongitudeRad);
  const cosLongitude = Math.cos(originLongitudeRad);

  return new THREE.Vector3(
    -sinLongitude * delta.x + cosLongitude * delta.y,
    -sinLatitude * cosLongitude * delta.x -
      sinLatitude * sinLongitude * delta.y +
      cosLatitude * delta.z,
    cosLatitude * cosLongitude * delta.x +
      cosLatitude * sinLongitude * delta.y +
      sinLatitude * delta.z
  );
}

function createRadarLocalToWorldMatrix(): THREE.Matrix4 {
  const radarEnuOrigin = geodeticToEnu(
    RADAR_GPS_POSITION.latitude,
    RADAR_GPS_POSITION.longitude,
    RADAR_GPS_POSITION.altitudeMeters,
    SCENE_GPS_ORIGIN.latitude,
    SCENE_GPS_ORIGIN.longitude,
    SCENE_GPS_ORIGIN.altitudeMeters
  );
  const enuToUnityMatrix = SFM_TO_UNITY_MATRIX.clone().multiply(SFM_TO_ENU_MATRIX.clone().invert());
  const radarOriginTranslation = new THREE.Matrix4().makeTranslation(
    radarEnuOrigin.x,
    radarEnuOrigin.y,
    radarEnuOrigin.z
  );
  const localVerticalOffset = new THREE.Matrix4().makeTranslation(
    0,
    RADAR_VERTICAL_OFFSET_METERS,
    0
  );

  return RIGHT_TO_LEFT_HAND_MATRIX.clone()
    .multiply(enuToUnityMatrix)
    .multiply(radarOriginTranslation)
    .multiply(localVerticalOffset)
    .multiply(RADAR_LOCAL_TO_ENU_MATRIX);
}

function getAverageMatrixScale(matrix: THREE.Matrix4): number {
  const xAxis = new THREE.Vector3().setFromMatrixColumn(matrix, 0).length();
  const yAxis = new THREE.Vector3().setFromMatrixColumn(matrix, 1).length();
  const zAxis = new THREE.Vector3().setFromMatrixColumn(matrix, 2).length();
  return (xAxis + yAxis + zAxis) / 3;
}

function mixRadarColor(normalizedSpeed: number): THREE.Color {
  if (normalizedSpeed <= 0.5) {
    return radarWorkingColor.lerpColors(radarLowColor, radarMidColor, normalizedSpeed / 0.5);
  }
  return radarWorkingColor.lerpColors(radarMidColor, radarHighColor, (normalizedSpeed - 0.5) / 0.5);
}

function getRadarColorStyle(normalizedSpeed: number): string {
  const clamped = Math.min(Math.max(normalizedSpeed, 0), 1);
  const color =
    clamped <= 0.5
      ? radarLowColor.clone().lerp(radarMidColor, clamped / 0.5)
      : radarMidColor.clone().lerp(radarHighColor, (clamped - 0.5) / 0.5);
  return color.getStyle();
}

function getRadarGlyphCountForLayer(layer: ProcessedWindLayer): number {
  const area = Math.PI * layer.radius * layer.radius;
  return Math.max(
    RADAR_GLYPH_MIN_PER_LAYER,
    Math.min(RADAR_GLYPH_MAX_PER_LAYER, Math.round(area * RADAR_GLYPH_DENSITY))
  );
}

function getRadarFrameIndexForTime(data: ProcessedWindData, timeSeconds: number): number {
  if (!data.frames.length) return 0;
  const sampleInterval = Math.max(data.meta.sampleIntervalSeconds, 1);
  const loopDuration = Math.max(data.frames.length * sampleInterval, sampleInterval);
  const wrappedTime = ((timeSeconds % loopDuration) + loopDuration) % loopDuration;
  return Math.min(Math.floor(wrappedTime / sampleInterval), data.frames.length - 1);
}

function setLineMaterialResolution(
  material: LineMaterial,
  context: DashboardSceneExtensionContext
): void {
  material.resolution.set(
    Math.max(context.canvas.clientWidth || 1, 1),
    Math.max(context.canvas.clientHeight || 1, 1)
  );
}

function createRadarRing(
  radius: number,
  context: DashboardSceneExtensionContext
): Line2 {
  const pointPositions: number[] = [];
  const segments = 48;
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    pointPositions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }

  const geometry = new LineGeometry();
  geometry.setPositions(pointPositions);
  const material = new LineMaterial({
    color: "#74d6ff",
    depthTest: true,
    depthWrite: false,
    linewidth: 1.5,
    opacity: 0.62,
    toneMapped: false,
    transparent: true,
  });
  setLineMaterialResolution(material, context);
  const ring = new Line2(geometry, material);
  ring.computeLineDistances();
  ring.renderOrder = RADAR_RENDER_ORDER + 1;
  return ring;
}

function getLayerDisplayHeight(data: ProcessedWindData, layer: ProcessedWindLayer): number {
  void data;
  return layer.height;
}

function getLayerDisplayRadius(data: ProcessedWindData, layer: ProcessedWindLayer): number {
  void data;
  return layer.radius;
}

function buildRadarGuideLines(
  displayHeight: number,
  displayRadius: number
): THREE.LineSegments | undefined {
  if (displayRadius <= 0) return undefined;

  const guidePositions: number[] = [];
  const y = displayHeight;
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    guidePositions.push(
      0,
      0,
      0,
      Math.cos(angle) * displayRadius,
      y,
      Math.sin(angle) * displayRadius
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(guidePositions, 3));
  const material = new THREE.LineBasicMaterial({
    color: "#4db0ff",
    depthTest: true,
    depthWrite: false,
    opacity: 0.28,
    transparent: true,
  });
  const guides = new THREE.LineSegments(geometry, material);
  guides.renderOrder = RADAR_RENDER_ORDER;
  return guides;
}

function createWindFieldRoot(
  context: DashboardSceneExtensionContext,
  data: ProcessedWindData,
  state: WindFieldState
): THREE.Group {
  const root = new THREE.Group();
  root.name = "LowAltitudeWindField";
  root.matrixAutoUpdate = false;
  root.matrix.copy(radarLocalToWorldMatrix);
  root.matrixWorldNeedsUpdate = true;

  state.layerMap.clear();
  state.layerVisuals = [];
  state.particleSeeds = [];

  data.layers.forEach((layer) => {
    state.layerMap.set(layer.layerIndex, layer);
  });

  const markerGroup = new THREE.Group();
  const sensorSphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADAR_SENSOR_MARKER_RADIUS * RADAR_WORLD_TO_LOCAL_SCALE, 24, 24),
    new THREE.MeshBasicMaterial({
      color: "#8fdcff",
      depthTest: true,
      depthWrite: true,
      opacity: 0.98,
      transparent: true,
    })
  );
  sensorSphere.renderOrder = RADAR_RENDER_ORDER + 2;
  markerGroup.add(sensorSphere);

  const topLayer = data.layers.at(-1);
  if (topLayer) {
    const topLayerHeight = getLayerDisplayHeight(data, topLayer);
    const topLayerRadius = getLayerDisplayRadius(data, topLayer);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(
        RADAR_SENSOR_STEM_RADIUS * RADAR_WORLD_TO_LOCAL_SCALE,
        RADAR_SENSOR_STEM_BASE_RADIUS * RADAR_WORLD_TO_LOCAL_SCALE,
        topLayerHeight,
        16
      ),
      new THREE.MeshBasicMaterial({
        color: "#2d5d79",
        depthTest: true,
        depthWrite: true,
        opacity: 0.55,
        transparent: true,
      })
    );
    stem.position.y = topLayerHeight / 2;
    stem.renderOrder = RADAR_RENDER_ORDER;
    markerGroup.add(stem);

    const guides = buildRadarGuideLines(topLayerHeight, topLayerRadius);
    if (guides) {
      markerGroup.add(guides);
    }
  }
  root.add(markerGroup);

  data.layers.forEach((layer, layerOffset) => {
    const layerHeight = getLayerDisplayHeight(data, layer);
    const layerRadius = getLayerDisplayRadius(data, layer);
    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(layerRadius, 48),
      new THREE.MeshBasicMaterial({
        color: "#21465e",
        depthTest: true,
        depthWrite: false,
        opacity: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
      })
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = layerHeight;
    disk.renderOrder = RADAR_RENDER_ORDER;
    root.add(disk);

    const ring = createRadarRing(layerRadius, context);
    ring.position.y = layerHeight;
    root.add(ring);

    state.layerVisuals.push({
      disk,
      layerIndex: layer.layerIndex,
      ring,
    });

    const glyphCount = getRadarGlyphCountForLayer(layer);
    for (let particleIndex = 0; particleIndex < glyphCount; particleIndex += 1) {
      const normalizedIndex = particleIndex / Math.max(glyphCount, 1);
      state.particleSeeds.push({
        baseAngle: normalizedIndex * Math.PI * 2 * 1.61803398875 + layerOffset * 0.21,
        baseRadiusRatio: Math.sqrt((particleIndex + 0.5) / glyphCount),
        lateralJitter: Math.random() * Math.PI * 2,
        layerIndex: layer.layerIndex,
        phaseOffset: Math.random(),
        speedFactor: 0.7 + Math.random() * 0.8,
        verticalJitter: Math.random() * 0.4 - 0.2,
      });
    }
  });

  const particlePositions = new Float32Array(state.particleSeeds.length * 3);
  const particleColors = new Float32Array(state.particleSeeds.length * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    opacity: 0.94,
    size: RADAR_PARTICLE_SIZE,
    sizeAttenuation: true,
    toneMapped: false,
    transparent: true,
    vertexColors: true,
  });
  state.particles = new THREE.Points(particleGeometry, particleMaterial);
  state.particles.frustumCulled = false;
  state.particles.renderOrder = RADAR_RENDER_ORDER + 2;
  root.add(state.particles);

  const shaftMaterial = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
    transparent: true,
  });
  state.arrowShafts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.78, 1, 1, 12),
    shaftMaterial,
    state.particleSeeds.length
  );
  state.arrowShafts.frustumCulled = false;
  state.arrowShafts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  state.arrowShafts.renderOrder = RADAR_RENDER_ORDER + 2;
  root.add(state.arrowShafts);

  const headMaterial = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
    transparent: true,
  });
  state.arrowHeads = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 1, 16),
    headMaterial,
    state.particleSeeds.length
  );
  state.arrowHeads.frustumCulled = false;
  state.arrowHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  state.arrowHeads.renderOrder = RADAR_RENDER_ORDER + 3;
  root.add(state.arrowHeads);

  updateWindVisualization(state, 0, false);
  return root;
}

function updateWindVisualization(
  state: WindFieldState,
  playbackTime: number,
  showVerticalAirflow: boolean
): void {
  const data = state.data;
  const particles = state.particles;
  const arrowShafts = state.arrowShafts;
  const arrowHeads = state.arrowHeads;
  if (!data?.frames.length || !particles || !arrowShafts || !arrowHeads) return;

  const frameIndex = getRadarFrameIndexForTime(data, playbackTime);
  const frame = data.frames[frameIndex];
  const layerSamples = new Map(frame.samples.map((sample) => [sample.layerIndex, sample]));
  const positions = particles.geometry.getAttribute("position") as
    | THREE.BufferAttribute
    | undefined;
  const colors = particles.geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!positions || !colors) return;

  state.layerVisuals.forEach((visual) => {
    const sample = layerSamples.get(visual.layerIndex);
    const diskMaterial = visual.disk.material;
    const ringMaterial = visual.ring.material as LineMaterial;
    if (!sample?.valid || sample.speed === null) {
      diskMaterial.color.copy(radarMutedColor);
      diskMaterial.opacity = 0.04;
      ringMaterial.color.copy(radarMutedColor);
      ringMaterial.opacity = 0.18;
      return;
    }

    const normalizedSpeed =
      data.meta.maxHorizontalSpeed > 0 ? sample.speed / data.meta.maxHorizontalSpeed : 0;
    const mixedColor = mixRadarColor(Math.min(Math.max(normalizedSpeed, 0), 1));
    diskMaterial.color.copy(mixedColor);
    diskMaterial.opacity = 0.07 + normalizedSpeed * 0.16;
    ringMaterial.color.copy(mixedColor);
    ringMaterial.opacity = 0.36 + normalizedSpeed * 0.42;
  });

  let cursor = 0;
  for (let index = 0; index < state.particleSeeds.length; index += 1) {
    const seed = state.particleSeeds[index];
    const layer = state.layerMap.get(seed.layerIndex);
    const sample = layerSamples.get(seed.layerIndex);

    if (
      !layer ||
      !sample?.valid ||
      sample.speed === null ||
      sample.vectorX === null ||
      sample.vectorZ === null
    ) {
      positions.array[cursor] = 0;
      positions.array[cursor + 1] = -999;
      positions.array[cursor + 2] = 0;
      colors.array[cursor] = radarMutedColor.r;
      colors.array[cursor + 1] = radarMutedColor.g;
      colors.array[cursor + 2] = radarMutedColor.b;
      radarArrowScale.set(0.0001, 0.0001, 0.0001);
      radarArrowCenter.set(0, -999, 0);
      radarArrowMatrixHelper.position.copy(radarArrowCenter);
      radarArrowMatrixHelper.quaternion.identity();
      radarArrowMatrixHelper.scale.copy(radarArrowScale);
      radarArrowMatrixHelper.updateMatrix();
      arrowShafts.setMatrixAt(index, radarArrowMatrixHelper.matrix);
      arrowHeads.setMatrixAt(index, radarArrowMatrixHelper.matrix);
      cursor += 3;
      continue;
    }

    const layerHeight = getLayerDisplayHeight(data, layer);
    const layerRadius = getLayerDisplayRadius(data, layer);
    const normalizedSpeed =
      data.meta.maxHorizontalSpeed > 0 ? sample.speed / data.meta.maxHorizontalSpeed : 0;
    const phase = (playbackTime * seed.speedFactor + seed.phaseOffset) % 1;
    const localRadius = layerRadius * seed.baseRadiusRatio;
    const baseX = Math.cos(seed.baseAngle) * localRadius;
    const baseZ = Math.sin(seed.baseAngle) * localRadius;
    const drift = (phase - 0.5) * 2;
    const jitter =
      Math.sin(playbackTime * 1.6 + seed.lateralJitter) * 0.03 * RADAR_WORLD_TO_LOCAL_SCALE;

    radarFlowVector.set(
      sample.vectorX * RADAR_FLOW_VISUAL_GAIN,
      0,
      sample.vectorZ * RADAR_FLOW_VISUAL_GAIN
    );
    radarPosition.set(baseX, layerHeight, baseZ).addScaledVector(radarFlowVector, drift);
    radarPosition.x += Math.cos(seed.lateralJitter) * jitter;
    radarPosition.z += Math.sin(seed.lateralJitter) * jitter;

    if (
      showVerticalAirflow &&
      sample.verticalSpeed !== null &&
      data.meta.maxAbsVerticalSpeed > 0
    ) {
      radarPosition.y +=
        sample.verticalSpeed *
        RADAR_VERTICAL_VISUAL_GAIN *
        drift *
        (0.7 + Math.abs(seed.verticalJitter));
    }

    const mixedColor = mixRadarColor(Math.min(Math.max(normalizedSpeed, 0), 1));
    positions.array[cursor] = radarPosition.x;
    positions.array[cursor + 1] = radarPosition.y;
    positions.array[cursor + 2] = radarPosition.z;
    colors.array[cursor] = mixedColor.r;
    colors.array[cursor + 1] = mixedColor.g;
    colors.array[cursor + 2] = mixedColor.b;

    radarArrowVector.copy(radarFlowVector);
    if (showVerticalAirflow && sample.verticalSpeed !== null) {
      radarArrowVector.y = sample.verticalSpeed * RADAR_VERTICAL_VISUAL_GAIN * 0.85;
    }
    if (radarArrowVector.lengthSq() < 0.0001) {
      radarArrowVector.set(0, 0.001, 0);
    }

    radarArrowDirection.copy(radarArrowVector).normalize();
    radarArrowQuaternion.setFromUnitVectors(radarArrowUp, radarArrowDirection);

    const maxArrowLength = Math.max(0.18, Math.min(layerRadius * 0.48, 0.44)) * 0.3;
    const arrowLength =
      Math.max(0.14, Math.min(maxArrowLength / 0.3, 0.16 + normalizedSpeed * 0.22)) *
      0.3 *
      RADAR_WORLD_TO_LOCAL_SCALE;
    const shaftLength = arrowLength * 0.56;
    const headLength = arrowLength * 0.44;
    const shaftRadius =
      Math.max(0.016, Math.min(layerRadius * 0.12, 0.04)) *
      0.3 *
      RADAR_WORLD_TO_LOCAL_SCALE;
    const headRadius = Math.max(shaftRadius * 2.25, 0.05 * 0.3 * RADAR_WORLD_TO_LOCAL_SCALE);

    radarArrowCenter.copy(radarPosition).addScaledVector(radarArrowDirection, shaftLength * 0.5);
    radarArrowMatrixHelper.position.copy(radarArrowCenter);
    radarArrowMatrixHelper.quaternion.copy(radarArrowQuaternion);
    radarArrowScale.set(shaftRadius, shaftLength, shaftRadius);
    radarArrowMatrixHelper.scale.copy(radarArrowScale);
    radarArrowMatrixHelper.updateMatrix();
    arrowShafts.setMatrixAt(index, radarArrowMatrixHelper.matrix);

    radarArrowCenter
      .copy(radarPosition)
      .addScaledVector(radarArrowDirection, shaftLength + headLength * 0.5);
    radarArrowMatrixHelper.position.copy(radarArrowCenter);
    radarArrowMatrixHelper.scale.set(headRadius, headLength, headRadius);
    radarArrowMatrixHelper.updateMatrix();
    arrowHeads.setMatrixAt(index, radarArrowMatrixHelper.matrix);
    cursor += 3;
  }

  positions.needsUpdate = true;
  colors.needsUpdate = true;
  arrowShafts.instanceMatrix.needsUpdate = true;
  arrowHeads.instanceMatrix.needsUpdate = true;
}

function applyWindVisibility(
  state: WindFieldState,
  visible: boolean,
  renderMode: WindRenderMode
): void {
  if (state.root) {
    state.root.visible = visible;
  }
  if (state.particles) {
    state.particles.visible = visible && renderMode === "particle";
  }
  if (state.arrowShafts) {
    state.arrowShafts.visible = visible && renderMode === "arrow";
  }
  if (state.arrowHeads) {
    state.arrowHeads.visible = visible && renderMode === "arrow";
  }
}

function syncWindResolution(
  state: WindFieldState,
  context: DashboardSceneExtensionContext
): void {
  state.layerVisuals.forEach((visual) => {
    const material = visual.ring.material as LineMaterial;
    setLineMaterialResolution(material, context);
  });
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry && !mesh.userData.skipGeometryDispose) {
      mesh.geometry.dispose?.();
    }
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose?.());
    } else {
      mesh.material?.dispose?.();
    }
  });
}

function createSceneOccluderMaterial(): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    opacity: 1,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  });
  material.colorWrite = false;
  material.depthTest = true;
  material.depthWrite = true;
  return material;
}

function createSceneOccluderMesh(source: THREE.Group): THREE.Group {
  const occluder = source.clone(true);
  occluder.name = "JNUSceneOccluder";
  occluder.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = createSceneOccluderMaterial();
    mesh.renderOrder = SCENE_OCCLUDER_RENDER_ORDER;
    mesh.frustumCulled = false;
    mesh.userData.skipGeometryDispose = true;
  });
  occluder.renderOrder = SCENE_OCCLUDER_RENDER_ORDER;
  return occluder;
}
