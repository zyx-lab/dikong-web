<template>
  <div class="app-container flight-record-detail-page">
    <template v-if="record">
      <RecordDetailHeader :record="record" @back="router.back()" />

      <div class="record-detail-grid">
        <div class="record-detail-grid__side">
          <InfoPanel title="飞行轨迹" class="detail-panel" body-class="detail-panel__body">
            <div class="map-panel" :style="{ background: record.mapTheme }">
              <div ref="trajectoryHostRef" class="map-panel__snapshot-host" />
              <img
                v-if="trajectorySnapshotUrl"
                :src="trajectorySnapshotUrl"
                alt=""
                class="map-panel__snapshot"
              />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="map-panel__trajectory">
                <polyline :points="trajectoryPolyline" class="map-panel__route-base" />
                <polyline :points="revealedTrajectoryPolyline" class="map-panel__route-live" />
                <circle
                  v-if="trajectoryStartPoint"
                  :cx="trajectoryStartPoint.x"
                  :cy="trajectoryStartPoint.y"
                  r="1.4"
                  class="map-panel__anchor map-panel__anchor--start"
                />
                <circle
                  v-if="trajectoryEndPoint"
                  :cx="trajectoryEndPoint.x"
                  :cy="trajectoryEndPoint.y"
                  r="1.4"
                  class="map-panel__anchor map-panel__anchor--end"
                />
                <circle
                  v-if="currentTrajectoryPoint"
                  :cx="currentTrajectoryPoint.x"
                  :cy="currentTrajectoryPoint.y"
                  r="2.6"
                  class="map-panel__drone-dot"
                />
              </svg>
              <div v-if="trajectoryViewerStatus !== 'ready'" class="map-panel__status">
                <div class="map-panel__status-card">
                  <div class="map-panel__status-title">
                    {{ trajectoryViewerStatus === "error" ? "轨迹视图加载失败" : "轨迹视图加载中" }}
                  </div>
                  <div class="map-panel__status-text">
                    {{
                      trajectoryViewerStatus === "error"
                        ? trajectoryViewerErrorMessage
                        : "正在加载 LoD 场景并生成俯视飞行轨迹..."
                    }}
                  </div>
                </div>
              </div>
              <RecordMapMetaBadges
                :location-label="record.locationLabel"
                :trajectory-point-count="trajectoryPointCount"
              />
            </div>
          </InfoPanel>

          <InfoPanel title="飞行日志" class="detail-log-panel" body-class="detail-panel__body">
            <template #header-extra>
              <Badge variant="outline">{{ record.flightLogs.length }} 条日志</Badge>
            </template>
            <RecordFlightLogList :logs="record.flightLogs" />
          </InfoPanel>
        </div>

        <div class="record-detail-grid__main">
          <InfoPanel title="无人机视频" body-class="detail-panel__body">
            <template #header-extra>
              <Badge variant="secondary">{{ record.flightDurationText }}</Badge>
              <Badge variant="outline">{{ record.videoCount }} 路视频</Badge>
            </template>
            <div class="video-stage">
              <div class="video-stage__media">
                <RecordVideoStatusBar
                  :drone-name="record.droneName"
                  :battery-percent="record.batteryPercent"
                  :current-frame-index="currentFrameIndex"
                  :pose-frame-count="poseFrameCount"
                  :radar-ready="radarStatus === 'ready'"
                  :radar-frame-index="radarFrameIndex"
                  :radar-frame-count="radarFrameCount"
                  :projector-fov="projectorFov"
                />

                <div ref="splatHostRef" class="video-stage__viewer" />
                <video
                  ref="videoPreviewRef"
                  class="video-stage__pip"
                  muted
                  loop
                  playsinline
                  preload="auto"
                />
                <div v-if="viewerStatus !== 'ready'" class="video-stage__status">
                  <div class="video-stage__status-card">
                    <div class="video-stage__status-title">
                      {{ viewerStatus === "error" ? "3DGS 场景加载失败" : "3DGS 场景加载中" }}
                    </div>
                    <div class="video-stage__status-text">
                      {{
                        viewerStatus === "error"
                          ? viewerErrorMessage
                          : "正在初始化 Spark 渲染器并加载高斯点云资源..."
                      }}
                    </div>
                  </div>
                </div>

                <div class="video-stage__overlay video-stage__overlay--bottom">
                  <button class="play-toggle" type="button" @click="togglePlayback">
                    <el-icon v-if="isPlaying"><VideoPause /></el-icon>
                    <el-icon v-else><VideoPlay /></el-icon>
                  </button>
                  <el-slider
                    v-model="currentTime"
                    class="video-slider"
                    :min="0"
                    :max="maxTime"
                    :show-tooltip="false"
                    @input="handleSliderInput"
                  />
                  <span class="video-time">{{ currentTimeText }} / {{ durationText }}</span>
                </div>
              </div>

              <div class="telemetry-section">
                <div class="telemetry-chart">
                  <div class="telemetry-chart__header">
                    <span>距地高度（m）</span>
                    <span>速度（m/s）</span>
                  </div>

                  <svg viewBox="0 0 900 220" preserveAspectRatio="none" class="telemetry-svg">
                    <g v-for="tick in 6" :key="tick">
                      <line
                        x1="40"
                        :y1="tickY(tick - 1)"
                        x2="820"
                        :y2="tickY(tick - 1)"
                        class="telemetry-grid"
                      />
                    </g>
                    <polyline
                      :points="altitudePolyline"
                      class="telemetry-line telemetry-line--altitude"
                    />
                    <polyline
                      :points="speedPolyline"
                      class="telemetry-line telemetry-line--speed"
                    />
                    <line
                      :x1="indicatorX"
                      y1="18"
                      :x2="indicatorX"
                      y2="194"
                      class="telemetry-indicator"
                    />
                    <circle
                      :cx="indicatorX"
                      :cy="altitudePointY"
                      r="4"
                      class="telemetry-point telemetry-point--altitude"
                    />
                    <circle
                      :cx="indicatorX"
                      :cy="speedPointY"
                      r="4"
                      class="telemetry-point telemetry-point--speed"
                    />
                  </svg>
                </div>

                <RecordTelemetryCards
                  v-model:projector-fov="projectorFov"
                  v-model:projection-opacity="projectionOpacity"
                  v-model:show-projection-mesh="showProjectionMesh"
                  v-model:debug-projection-mode="debugProjectionMode"
                  v-model:show-projector-helper="showProjectorHelper"
                  v-model:show-drone-model="showDroneModel"
                  v-model:debug-drone-model="debugDroneModel"
                  :current-altitude="currentAltitude"
                  :current-speed="currentSpeed"
                />
              </div>
            </div>
          </InfoPanel>
        </div>
      </div>
    </template>

    <FlightEmptyState
      v-else
      title="未找到对应的飞行记录"
      description="当前没有可展示的飞行记录，请返回列表重新选择。"
      action-label="返回列表"
      @action="router.back()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VideoPause, VideoPlay } from "@element-plus/icons-vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import FlightEmptyState from "@/components/flight/FlightEmptyState.vue";
import InfoPanel from "@/components/InfoPanel.vue";
import { Badge } from "@/components/ui/badge";
import { getFlightRecordById } from "@/views/flight/record/data";
import RecordDetailHeader from "@/views/flight/record/components/RecordDetailHeader.vue";
import RecordFlightLogList from "@/views/flight/record/components/RecordFlightLogList.vue";
import RecordMapMetaBadges from "@/views/flight/record/components/RecordMapMetaBadges.vue";
import RecordTelemetryCards from "@/views/flight/record/components/RecordTelemetryCards.vue";
import RecordVideoStatusBar from "@/views/flight/record/components/RecordVideoStatusBar.vue";

defineOptions({
  name: "FlightRecordDetail",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();
const SCENE_SPLAT_URL = "/JNUAerial-with_Park-y_up-lod.rad";
const SCENE_MESH_URL = "/video+xyz/JNU.obj";
const DRONE_MODEL_URL = "/video+xyz/dji-mavic-pro-for-element-3d.fbx";
const VIDEO_URL = "/simulated_data/5_DJI-Air_5.browser.mp4";
const POSE_JSON_URL = "/simulated_data/5_DJI-Air_5.json";
const DEFAULT_VIDEO_WIDTH = 1920;
const DEFAULT_VIDEO_HEIGHT = 1080;
type SceneSplatMesh = SplatMesh & THREE.Object3D;
interface TrajectoryPoint2D {
  x: number;
  y: number;
}
interface TrajectoryPoint3D {
  x: number;
  y: number;
  z: number;
}
interface CameraPoseFrame {
  quaternion: [number, number, number, number];
  translation: [number, number, number];
  euler_angles?: [number, number, number];
}
interface CameraPoseData {
  data: CameraPoseFrame[];
}
interface ProjectionUniforms {
  projectorMatrix: THREE.IUniform<THREE.Matrix4>;
  projectorMap: THREE.IUniform<THREE.Texture | null>;
  projectorOpacity: THREE.IUniform<number>;
  projectorEnabled: THREE.IUniform<number>;
  meshOpacity: THREE.IUniform<number>;
  debugMode: THREE.IUniform<number>;
}
interface ProcessedWindMeta {
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
interface ProcessedWindLayer {
  layerIndex: number;
  slantDistance: number;
  height: number;
  radius: number;
  displayHeight: number;
  displayRadius: number;
}
interface ProcessedWindSample {
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
interface ProcessedWindFrame {
  index: number;
  timestamp: string;
  elapsedSeconds: number;
  samples: ProcessedWindSample[];
}
interface ProcessedWindData {
  meta: ProcessedWindMeta;
  layers: ProcessedWindLayer[];
  frames: ProcessedWindFrame[];
}
interface RadarLayerVisual {
  layerIndex: number;
  disk: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  ring: Line2;
}
interface RadarParticleSeed {
  layerIndex: number;
  baseRadiusRatio: number;
  baseAngle: number;
  phaseOffset: number;
  lateralJitter: number;
  verticalJitter: number;
  speedFactor: number;
}
type RadarRenderMode = "arrow" | "particle";

const currentTime = ref(0);
const isPlaying = ref(false);
const splatHostRef = ref<HTMLDivElement>();
const trajectoryHostRef = ref<HTMLDivElement>();
const videoPreviewRef = ref<HTMLVideoElement>();
const viewerStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
const viewerErrorMessage = ref("");
const trajectoryViewerStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
const trajectoryViewerErrorMessage = ref("");
const trajectorySnapshotUrl = ref("");
const videoDuration = ref(0);
const videoFrameWidth = ref(DEFAULT_VIDEO_WIDTH);
const videoFrameHeight = ref(DEFAULT_VIDEO_HEIGHT);
const poseFrameCount = ref(0);
const poseFrames = ref<CameraPoseFrame[]>([]);
const projectorFov = ref(38);
const projectionOpacity = ref(1);
const showProjectorHelper = ref(true);
const showProjectionMesh = ref(false);
const debugProjectionMode = ref(false);
const showDroneModel = ref(true);
const debugDroneModel = ref(true);
const followViewerMode = ref(true);
/* eslint-disable @typescript-eslint/no-unused-vars */
const showRadarWind = ref(true);
const showVerticalAirflow = ref(false);
const radarRenderMode = ref<RadarRenderMode>("arrow");
const radarStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
const radarErrorMessage = ref("");
const radarPlaybackTime = ref(0);
const radarFrameIndex = ref(0);
const radarData = ref<ProcessedWindData>();
const radarIsPlaying = ref(true);
let viewerRenderer: THREE.WebGLRenderer | undefined;
let viewerScene: THREE.Scene | undefined;
let viewerCamera: THREE.PerspectiveCamera | undefined;
let viewerControls: OrbitControls | undefined;
let viewerSplat: SceneSplatMesh | undefined;
let viewerProjectionMesh: THREE.Group | undefined;
let viewerSceneOccluder: THREE.Group | undefined;
let viewerResizeObserver: ResizeObserver | undefined;
let viewerClock: THREE.Clock | undefined;
let viewerInitToken = 0;
let viewerVideoElement: HTMLVideoElement | undefined;
let viewerVideoTexture: THREE.VideoTexture | undefined;
let viewerVideoCleanup: (() => void) | undefined;
let viewerPoseData: CameraPoseData | undefined;
let viewerProjectorCamera: THREE.PerspectiveCamera | undefined;
let viewerProjectorHelper: THREE.CameraHelper | undefined;
let viewerDroneRoot: THREE.Group | undefined;
let viewerDroneModel: THREE.Group | undefined;
let viewerDroneDebugHelper: THREE.BoxHelper | undefined;
let viewerProjectionUniforms: ProjectionUniforms | undefined;
let viewerSparkRenderer: SparkRenderer | undefined;
let viewerRadarRoot: THREE.Group | undefined;
let viewerRadarLayerVisuals: RadarLayerVisual[] = [];
let viewerRadarParticles: THREE.Points | undefined;
let viewerRadarArrowShafts: THREE.InstancedMesh | undefined;
let viewerRadarArrowHeads: THREE.InstancedMesh | undefined;
let viewerRadarParticleSeeds: RadarParticleSeed[] = [];
let viewerSyncHandle: number | undefined;
let viewerHasAlignedUserCamera = false;
let trajectoryRenderer: THREE.WebGLRenderer | undefined;
let trajectorySparkRenderer: SparkRenderer | undefined;
let trajectorySplat: SceneSplatMesh | undefined;
let trajectoryInitToken = 0;
let trajectoryHalfSpanX = 1;
let trajectoryHalfSpanZ = 1;
let trajectoryHalfWidth = 1;
let trajectoryHalfHeight = 1;
let trajectoryCameraDistance = 10;
const projectorViewProjectionMatrix = new THREE.Matrix4();
const unityToSparkBasis = new THREE.Matrix4().makeScale(1, 1, -1);
const viewerMovementState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  boost: false,
};
const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveDelta = new THREE.Vector3();
const moveWorldUp = new THREE.Vector3(0, 1, 0);
const cameraDefaultOffset = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const cameraRotationMatrix = new THREE.Matrix4();
const trajectoryCenter = new THREE.Vector3();
const MOVEMENT_SPEED = 1.8;
const MOVEMENT_BOOST_MULTIPLIER = 2.5;
const DRONE_MODEL_TARGET_SIZE = 0.42;
const DRONE_MODEL_VERTICAL_OFFSET = 0.68;
const SPLAT_RENDER_ORDER = 0;
const SCENE_OCCLUDER_RENDER_ORDER = 90;
const PROJECTION_RENDER_ORDER = 100;
const DRONE_RENDER_ORDER = 120;
const RADAR_RENDER_ORDER = 140;
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
const USER_CAMERA_HEIGHT_OFFSET = 0.16;
const USER_CAMERA_XZ_OFFSET = new THREE.Vector3(0.16, 0, 0.28);
const DEFAULT_RADAR_GPS_POSITION = Object.freeze({
  latitude: 22.252818819444443,
  longitude: 113.52958706944445,
  altitudeMeters: 86.885,
});
const SCENE_GPS_ORIGIN = Object.freeze({
  latitude: 22.252818819444443,
  longitude: 113.52958706944445,
  altitudeMeters: 86.885,
});
// The repo currently has no separate lidar GPS source, so the radar origin defaults to the
// same geodetic anchor used by the scene transform.
const RADAR_GPS_POSITION = Object.freeze({
  latitude: readEnvNumber(
    import.meta.env.VITE_RADAR_START_LATITUDE,
    DEFAULT_RADAR_GPS_POSITION.latitude
  ),
  longitude: readEnvNumber(
    import.meta.env.VITE_RADAR_START_LONGITUDE,
    DEFAULT_RADAR_GPS_POSITION.longitude
  ),
  altitudeMeters: readEnvNumber(
    import.meta.env.VITE_RADAR_START_ALTITUDE_METERS,
    DEFAULT_RADAR_GPS_POSITION.altitudeMeters
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
const radarLayerMap = new Map<number, ProcessedWindLayer>();
const radarLocalToWorldMatrix = createRadarLocalToWorldMatrix();
const RADAR_LOCAL_UNIT_SCALE = getAverageMatrixScale(radarLocalToWorldMatrix);
const RADAR_WORLD_TO_LOCAL_SCALE = RADAR_LOCAL_UNIT_SCALE > 0 ? 1 / RADAR_LOCAL_UNIT_SCALE : 1;

const recordId = computed(() => Number(route.params.id));
const record = computed(() => getFlightRecordById(recordId.value));
const telemetryDuration = computed(() => {
  if (!record.value?.telemetry.length) return 0;
  return record.value.telemetry[record.value.telemetry.length - 1].time;
});

const maxTime = computed(() => {
  if (videoDuration.value > 0) return videoDuration.value;
  if (poseFrameCount.value > 1) return (poseFrameCount.value - 1) / 30;
  return telemetryDuration.value;
});
const currentFrameIndex = computed(() => {
  if (!poseFrames.value.length || maxTime.value <= 0) return 0;
  return Math.min(
    Math.max(Math.round((currentTime.value / maxTime.value) * (poseFrames.value.length - 1)), 0),
    poseFrames.value.length - 1
  );
});
const currentTelemetryTime = computed(() => {
  if (telemetryDuration.value <= 0 || maxTime.value <= 0) return currentTime.value;
  return (currentTime.value / maxTime.value) * telemetryDuration.value;
});

const currentTelemetry = computed(() => {
  if (!record.value) {
    return { altitude: 0, speed: 0, time: 0 };
  }

  const points = record.value.telemetry;
  if (points.length === 1 || currentTelemetryTime.value <= points[0].time) {
    return points[0];
  }

  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const next = points[index];
    if (currentTelemetryTime.value <= next.time) {
      const range = next.time - prev.time || 1;
      const ratio = (currentTelemetryTime.value - prev.time) / range;
      return {
        time: currentTelemetryTime.value,
        altitude: Math.round(prev.altitude + (next.altitude - prev.altitude) * ratio),
        speed: Math.round(prev.speed + (next.speed - prev.speed) * ratio),
      };
    }
  }

  return points[points.length - 1];
});

const currentAltitude = computed(() => currentTelemetry.value.altitude);
const currentSpeed = computed(() => currentTelemetry.value.speed);
const durationText = computed(() => formatDuration(maxTime.value));
const currentTimeText = computed(() => formatDuration(currentTime.value));
const videoProgressPercent = computed(() =>
  maxTime.value ? (currentTime.value / maxTime.value) * 100 : 0
);

const altitudeMax = computed(() => {
  if (!record.value) return 300;
  return Math.max(...record.value.telemetry.map((item) => item.altitude), 300);
});

const speedMax = computed(() => {
  if (!record.value) return 30;
  return Math.max(...record.value.telemetry.map((item) => item.speed), 30);
});

const altitudePolyline = computed(() => buildPolyline("altitude"));
const speedPolyline = computed(() => buildPolyline("speed"));
const indicatorX = computed(() => 40 + (780 * videoProgressPercent.value) / 100);
const altitudePointY = computed(() => getAltitudeY(currentAltitude.value));
const speedPointY = computed(() => getSpeedY(currentSpeed.value));
const trajectoryWorldPoints = computed<TrajectoryPoint3D[]>(() =>
  poseFrames.value.map((frame) => {
    const matrix = cameraToWorldMatrixFromPoseFrame(frame);
    const position = new THREE.Vector3().setFromMatrixPosition(matrix);
    return {
      x: position.x,
      y: position.y,
      z: position.z,
    };
  })
);
const trajectoryPointCount = computed(() => trajectoryWorldPoints.value.length);
const trajectoryPoints2D = computed<TrajectoryPoint2D[]>(() => {
  if (!trajectoryWorldPoints.value.length) return [];

  return trajectoryWorldPoints.value.map((point) => ({
    x: 50 + ((point.x - trajectoryCenter.x) / trajectoryHalfWidth) * 50,
    y: 50 - ((point.z - trajectoryCenter.z) / trajectoryHalfHeight) * 50,
  }));
});
const trajectoryPolyline = computed(() =>
  trajectoryPoints2D.value.map((point) => `${point.x},${point.y}`).join(" ")
);
const revealedTrajectoryPolyline = computed(() =>
  trajectoryPoints2D.value
    .slice(0, Math.min(currentFrameIndex.value + 1, trajectoryPoints2D.value.length))
    .map((point) => `${point.x},${point.y}`)
    .join(" ")
);
const currentTrajectoryPoint = computed(() => trajectoryPoints2D.value[currentFrameIndex.value]);
const trajectoryStartPoint = computed(() => trajectoryPoints2D.value[0]);
const trajectoryEndPoint = computed(() => trajectoryPoints2D.value.at(-1));
const radarFrameCount = computed(() => radarData.value?.frames.length ?? 0);
const radarDurationSeconds = computed(() => radarData.value?.meta.durationSeconds ?? 0);
const currentRadarFrame = computed(() => radarData.value?.frames[radarFrameIndex.value]);

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function tickY(index: number): number {
  return 30 + index * 32;
}

function getAltitudeY(value: number): number {
  return 194 - (value / altitudeMax.value) * 160;
}

function getSpeedY(value: number): number {
  return 194 - (value / speedMax.value) * 160;
}

function buildPolyline(type: "altitude" | "speed"): string {
  if (!record.value?.telemetry.length || telemetryDuration.value === 0) return "";

  return record.value.telemetry
    .map((item) => {
      const x = 40 + (item.time / telemetryDuration.value) * 780;
      const y = type === "altitude" ? getAltitudeY(item.altitude) : getSpeedY(item.speed);
      return `${x},${y}`;
    })
    .join(" ");
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

function getRadarFrameIndexForTime(timeSeconds: number): number {
  const data = radarData.value;
  if (!data?.frames.length) return 0;
  const sampleInterval = Math.max(data.meta.sampleIntervalSeconds, 1);
  const loopDuration = Math.max(data.frames.length * sampleInterval, sampleInterval);
  const wrappedTime = ((timeSeconds % loopDuration) + loopDuration) % loopDuration;
  return Math.min(Math.floor(wrappedTime / sampleInterval), data.frames.length - 1);
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

function setLineMaterialResolution(material: LineMaterial): void {
  material.resolution.set(
    Math.max(splatHostRef.value?.clientWidth ?? 1, 1),
    Math.max(splatHostRef.value?.clientHeight ?? 1, 1)
  );
}

function getRadarGlyphCountForLayer(layer: ProcessedWindLayer): number {
  const area = Math.PI * layer.displayRadius * layer.displayRadius;
  return Math.max(
    RADAR_GLYPH_MIN_PER_LAYER,
    Math.min(RADAR_GLYPH_MAX_PER_LAYER, Math.round(area * RADAR_GLYPH_DENSITY))
  );
}

function applyRadarVisibility(): void {
  const visible = showRadarWind.value;
  if (viewerRadarRoot) {
    viewerRadarRoot.visible = visible;
  }
  if (viewerRadarParticles) {
    viewerRadarParticles.visible = visible && radarRenderMode.value === "particle";
  }
  if (viewerRadarArrowShafts) {
    viewerRadarArrowShafts.visible = visible && radarRenderMode.value === "arrow";
  }
  if (viewerRadarArrowHeads) {
    viewerRadarArrowHeads.visible = visible && radarRenderMode.value === "arrow";
  }
}

function createRadarRing(radius: number): Line2 {
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
    transparent: true,
    opacity: 0.62,
    linewidth: 1.5,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  setLineMaterialResolution(material);
  const ring = new Line2(geometry, material);
  ring.computeLineDistances();
  ring.renderOrder = RADAR_RENDER_ORDER + 1;
  return ring;
}

function buildRadarGuideLines(outerLayer: ProcessedWindLayer): THREE.LineSegments | undefined {
  if (outerLayer.radius <= 0) return undefined;

  const guidePositions = [];
  const y = outerLayer.height;
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    guidePositions.push(
      0,
      0,
      0,
      Math.cos(angle) * outerLayer.radius,
      y,
      Math.sin(angle) * outerLayer.radius
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(guidePositions, 3));
  const material = new THREE.LineBasicMaterial({
    color: "#4db0ff",
    transparent: true,
    opacity: 0.28,
    depthTest: true,
    depthWrite: false,
  });
  const guides = new THREE.LineSegments(geometry, material);
  guides.renderOrder = RADAR_RENDER_ORDER;
  return guides;
}

/* eslint-enable @typescript-eslint/no-unused-vars */

function stopPlayback(): void {
  viewerVideoElement?.pause();
  isPlaying.value = false;
}

async function togglePlayback(): Promise<void> {
  if (!viewerVideoElement) return;
  if (isPlaying.value) {
    stopPlayback();
    return;
  }

  if (currentTime.value >= maxTime.value && maxTime.value > 0) {
    viewerVideoElement.currentTime = 0;
  }

  try {
    await viewerVideoElement.play();
    isPlaying.value = true;
  } catch (error) {
    isPlaying.value = false;
    viewerErrorMessage.value =
      error instanceof Error ? error.message : "浏览器阻止了视频播放，请再次点击播放按钮";
  }
}

async function autoplayVideoIfReady(): Promise<void> {
  if (!viewerVideoElement || viewerStatus.value !== "ready") return;
  try {
    await viewerVideoElement.play();
    isPlaying.value = true;
  } catch (error) {
    isPlaying.value = false;
    viewerErrorMessage.value =
      error instanceof Error ? error.message : "自动播放失败，请点击播放按钮继续";
  }
}

function handleSliderInput(): void {
  if (!viewerVideoElement) return;
  const targetTime = Math.min(Math.max(currentTime.value, 0), maxTime.value);
  viewerVideoElement.currentTime = targetTime;
  syncSceneToVideo(targetTime);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function updateMovementState(code: string, active: boolean): boolean {
  switch (code) {
    case "KeyW":
      viewerMovementState.forward = active;
      return true;
    case "KeyS":
      viewerMovementState.backward = active;
      return true;
    case "KeyA":
      viewerMovementState.left = active;
      return true;
    case "KeyD":
      viewerMovementState.right = active;
      return true;
    case "KeyR":
      viewerMovementState.up = active;
      return true;
    case "KeyF":
      viewerMovementState.down = active;
      return true;
    case "ShiftLeft":
    case "ShiftRight":
      viewerMovementState.boost = active;
      return true;
    default:
      return false;
  }
}

function handleViewerKeydown(event: KeyboardEvent): void {
  if (isTypingTarget(event.target)) return;
  if (event.code === "KeyC" && !event.repeat) {
    followViewerMode.value = !followViewerMode.value;
    if (followViewerMode.value) {
      viewerHasAlignedUserCamera = false;
      syncSceneToVideo();
    }
    event.preventDefault();
    return;
  }
  if (updateMovementState(event.code, true)) {
    event.preventDefault();
  }
}

function handleViewerKeyup(event: KeyboardEvent): void {
  if (updateMovementState(event.code, false)) {
    event.preventDefault();
  }
}

function applyKeyboardMovement(deltaTime: number): void {
  if (!viewerCamera || !viewerControls || followViewerMode.value) return;

  const directionZ = Number(viewerMovementState.forward) - Number(viewerMovementState.backward);
  const directionX = Number(viewerMovementState.right) - Number(viewerMovementState.left);
  const directionY = Number(viewerMovementState.up) - Number(viewerMovementState.down);

  if (directionZ === 0 && directionX === 0 && directionY === 0) return;

  viewerCamera.getWorldDirection(moveForward);
  moveForward.normalize();
  moveRight.crossVectors(moveForward, viewerCamera.up).normalize();
  moveDelta.set(0, 0, 0);

  if (directionZ !== 0) {
    moveDelta.addScaledVector(moveForward, directionZ);
  }
  if (directionX !== 0) {
    moveDelta.addScaledVector(moveRight, directionX);
  }
  if (directionY !== 0) {
    moveDelta.addScaledVector(moveWorldUp, directionY);
  }

  if (moveDelta.lengthSq() === 0) return;

  moveDelta
    .normalize()
    .multiplyScalar(
      deltaTime * MOVEMENT_SPEED * (viewerMovementState.boost ? MOVEMENT_BOOST_MULTIPLIER : 1)
    );

  viewerCamera.position.add(moveDelta);
  viewerControls.target.add(moveDelta);
}

function alignViewerCameraToDrone(cameraToWorldMatrix: THREE.Matrix4): void {
  if (!viewerCamera || !viewerControls) return;

  cameraPosition.setFromMatrixPosition(cameraToWorldMatrix);
  cameraRotationMatrix.extractRotation(cameraToWorldMatrix);
  cameraDefaultOffset.copy(USER_CAMERA_XZ_OFFSET);
  cameraDefaultOffset.applyMatrix4(cameraRotationMatrix);
  cameraDefaultOffset.y += USER_CAMERA_HEIGHT_OFFSET;

  cameraForward.set(0, 0, -1).transformDirection(cameraToWorldMatrix);
  cameraTarget.copy(cameraPosition).addScaledVector(cameraForward, 5);

  viewerCamera.position.copy(cameraPosition).add(cameraDefaultOffset);
  viewerCamera.up.set(0, 1, 0).normalize();
  viewerControls.target.copy(cameraTarget).add(cameraDefaultOffset);
  viewerControls.update();
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
    const debugMaterial = mesh.userData.droneDebugMaterial as THREE.Material | undefined;
    if (debugMaterial) {
      debugMaterial.dispose();
      delete mesh.userData.droneDebugMaterial;
    }
  });
}

function cleanupTrajectoryViewer(): void {
  if (trajectorySplat) {
    trajectorySplat.dispose();
    trajectorySplat = undefined;
  }

  if (trajectorySparkRenderer) {
    trajectorySparkRenderer.dispose();
    trajectorySparkRenderer = undefined;
  }

  trajectoryRenderer?.dispose();
  if (
    trajectoryHostRef.value &&
    trajectoryRenderer?.domElement.parentElement === trajectoryHostRef.value
  ) {
    trajectoryHostRef.value.removeChild(trajectoryRenderer.domElement);
  }

  trajectoryRenderer = undefined;
  trajectoryHalfSpanX = 1;
  trajectoryHalfSpanZ = 1;
  trajectoryHalfWidth = 1;
  trajectoryHalfHeight = 1;
  trajectoryCameraDistance = 10;
}

function cleanupViewer(): void {
  viewerResizeObserver?.disconnect();
  viewerResizeObserver = undefined;
  if (viewerSyncHandle !== undefined && viewerVideoElement?.cancelVideoFrameCallback) {
    viewerVideoElement.cancelVideoFrameCallback(viewerSyncHandle);
  }
  viewerSyncHandle = undefined;

  if (viewerRenderer) {
    viewerRenderer.setAnimationLoop(null);
  }

  viewerControls?.dispose();
  viewerControls = undefined;

  if (viewerSplat) {
    viewerScene?.remove(viewerSplat);
    viewerSplat.dispose();
    viewerSplat = undefined;
  }

  if (viewerSparkRenderer) {
    viewerScene?.remove(viewerSparkRenderer);
    viewerSparkRenderer.dispose();
    viewerSparkRenderer = undefined;
  }

  if (viewerProjectionMesh) {
    viewerScene?.remove(viewerProjectionMesh);
    disposeObject3D(viewerProjectionMesh);
    viewerProjectionMesh = undefined;
  }

  if (viewerSceneOccluder) {
    viewerScene?.remove(viewerSceneOccluder);
    disposeObject3D(viewerSceneOccluder);
    viewerSceneOccluder = undefined;
  }

  if (viewerProjectorHelper) {
    viewerScene?.remove(viewerProjectorHelper);
    viewerProjectorHelper.geometry.dispose();
    const helperMaterial = viewerProjectorHelper.material;
    if (Array.isArray(helperMaterial)) {
      helperMaterial.forEach((material) => material.dispose());
    } else {
      helperMaterial.dispose();
    }
    viewerProjectorHelper = undefined;
  }

  if (viewerDroneRoot) {
    viewerScene?.remove(viewerDroneRoot);
    disposeObject3D(viewerDroneRoot);
    viewerDroneRoot = undefined;
    viewerDroneModel = undefined;
  }

  if (viewerDroneDebugHelper) {
    viewerScene?.remove(viewerDroneDebugHelper);
    viewerDroneDebugHelper.geometry.dispose();
    const helperMaterial = viewerDroneDebugHelper.material;
    if (Array.isArray(helperMaterial)) {
      helperMaterial.forEach((material) => material.dispose());
    } else {
      helperMaterial.dispose();
    }
    viewerDroneDebugHelper = undefined;
  }

  if (viewerRadarRoot) {
    viewerScene?.remove(viewerRadarRoot);
    disposeObject3D(viewerRadarRoot);
    viewerRadarRoot = undefined;
    viewerRadarLayerVisuals = [];
    viewerRadarParticles = undefined;
    viewerRadarArrowShafts = undefined;
    viewerRadarArrowHeads = undefined;
    viewerRadarParticleSeeds = [];
  }

  viewerRenderer?.dispose();
  if (splatHostRef.value && viewerRenderer?.domElement.parentElement === splatHostRef.value) {
    splatHostRef.value.removeChild(viewerRenderer.domElement);
  }

  viewerRenderer = undefined;
  viewerScene = undefined;
  viewerCamera = undefined;
  viewerClock = undefined;
  viewerProjectorCamera = undefined;
  viewerProjectionUniforms = undefined;
  viewerPoseData = undefined;
  radarData.value = undefined;
  radarStatus.value = "idle";
  radarErrorMessage.value = "";
  radarPlaybackTime.value = 0;
  radarFrameIndex.value = 0;
  radarIsPlaying.value = true;
  poseFrames.value = [];
  viewerHasAlignedUserCamera = false;

  viewerVideoCleanup?.();
  viewerVideoCleanup = undefined;

  if (viewerVideoTexture) {
    viewerVideoTexture.dispose();
    viewerVideoTexture = undefined;
  }

  if (viewerVideoElement) {
    viewerVideoElement.pause();
    viewerVideoElement.currentTime = 0;
    viewerVideoElement = undefined;
  }

  viewerMovementState.forward = false;
  viewerMovementState.backward = false;
  viewerMovementState.left = false;
  viewerMovementState.right = false;
  viewerMovementState.up = false;
  viewerMovementState.down = false;
  viewerMovementState.boost = false;
}

function resizeViewer(): void {
  if (!splatHostRef.value || !viewerRenderer || !viewerCamera) return;

  const width = Math.max(splatHostRef.value.clientWidth, 1);
  const height = Math.max(splatHostRef.value.clientHeight, 1);
  viewerCamera.aspect = width / height;
  viewerCamera.updateProjectionMatrix();
  viewerRenderer.setSize(width, height, false);
  viewerRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  viewerRadarLayerVisuals.forEach((visual) => {
    const material = visual.ring.material as LineMaterial;
    setLineMaterialResolution(material);
  });
}

function getTrajectoryViewportSize(): { width: number; height: number } {
  const width = Math.max(trajectoryHostRef.value?.clientWidth ?? 0, 1);
  const height = Math.max(trajectoryHostRef.value?.clientHeight ?? 0, 1);
  return { width, height };
}

function updateTrajectoryProjectionBounds(points: TrajectoryPoint3D[]): void {
  const { width, height } = getTrajectoryViewportSize();
  const aspect = width / height;
  const averageX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const averageY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const averageZ = points.reduce((sum, point) => sum + point.z, 0) / points.length;
  trajectoryHalfSpanX = Math.max(...points.map((point) => Math.abs(point.x - averageX)), 0.35);
  trajectoryHalfSpanZ = Math.max(...points.map((point) => Math.abs(point.z - averageZ)), 0.35);
  trajectoryHalfHeight = Math.max(
    trajectoryHalfSpanZ * 1.18,
    (trajectoryHalfSpanX * 1.18) / aspect,
    0.4
  );
  trajectoryHalfWidth = trajectoryHalfHeight * aspect;
  trajectoryCenter.set(averageX, averageY, averageZ);
}

function cameraToWorldMatrixFromPoseFrame(frame: CameraPoseFrame): THREE.Matrix4 {
  const quaternion = new THREE.Quaternion(
    frame.quaternion[0],
    frame.quaternion[1],
    frame.quaternion[2],
    frame.quaternion[3]
  );
  const position = new THREE.Vector3(
    frame.translation[0],
    frame.translation[1],
    frame.translation[2]
  );
  const unityCameraToWorld = new THREE.Matrix4().compose(
    position,
    quaternion,
    new THREE.Vector3(1, 1, 1)
  );
  return unityToSparkBasis.clone().multiply(unityCameraToWorld).multiply(unityToSparkBasis);
}

function setDroneDebugAppearance(enabled: boolean): void {
  if (!viewerDroneModel) return;

  viewerDroneModel.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const originalMaterial = mesh.userData.droneOriginalMaterial as
      | THREE.Material
      | THREE.Material[]
      | undefined;
    if (!originalMaterial) return;

    if (enabled) {
      if (!mesh.userData.droneDebugMaterial) {
        mesh.userData.droneDebugMaterial = new THREE.MeshStandardMaterial({
          color: "#ff7a18",
          emissive: "#ff7a18",
          emissiveIntensity: 0.45,
          roughness: 0.4,
          metalness: 0.05,
          transparent: true,
          opacity: 0.98,
        });
      }
      mesh.material = mesh.userData.droneDebugMaterial as THREE.Material;
    } else {
      mesh.material = originalMaterial;
    }
  });

  if (viewerDroneDebugHelper) {
    viewerDroneDebugHelper.visible = enabled && showDroneModel.value;
  }
}

function createProjectionUniforms(videoTexture: THREE.Texture): ProjectionUniforms {
  return {
    projectorMatrix: { value: new THREE.Matrix4() },
    projectorMap: { value: videoTexture },
    projectorOpacity: { value: projectionOpacity.value },
    projectorEnabled: { value: 1 },
    meshOpacity: { value: showProjectionMesh.value ? 0.14 : 0 },
    debugMode: { value: debugProjectionMode.value ? 1 : 0 },
  };
}

function createProjectedMeshMaterial(uniforms: ProjectionUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      projectorMatrix: uniforms.projectorMatrix,
      projectorMap: uniforms.projectorMap,
      projectorOpacity: uniforms.projectorOpacity,
      projectorEnabled: uniforms.projectorEnabled,
      meshOpacity: uniforms.meshOpacity,
      debugMode: uniforms.debugMode,
      meshColor: { value: new THREE.Color("#67d6ff") },
      debugMeshColor: { value: new THREE.Color("#ff7a18") },
      debugProjectionColor: { value: new THREE.Color("#3cff8f") },
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform mat4 projectorMatrix;
      uniform sampler2D projectorMap;
      uniform float projectorOpacity;
      uniform float projectorEnabled;
      uniform float meshOpacity;
      uniform float debugMode;
      uniform vec3 meshColor;
      uniform vec3 debugMeshColor;
      uniform vec3 debugProjectionColor;
      varying vec3 vWorldPosition;

      void main() {
        vec3 color = debugMode > 0.5 ? debugMeshColor : meshColor;
        float alpha = debugMode > 0.5 ? max(meshOpacity, 0.22) : meshOpacity;

        if (projectorEnabled > 0.5) {
          vec4 projectorClip = projectorMatrix * vec4(vWorldPosition, 1.0);
          if (projectorClip.w > 0.0) {
            vec3 projectorNdc = projectorClip.xyz / projectorClip.w;
            bool insideFrustum =
              projectorNdc.x >= -1.0 && projectorNdc.x <= 1.0 &&
              projectorNdc.y >= -1.0 && projectorNdc.y <= 1.0 &&
              projectorNdc.z >= -1.0 && projectorNdc.z <= 1.0;

            if (insideFrustum) {
              vec2 uv = vec2(projectorNdc.x * 0.5 + 0.5, projectorNdc.y * 0.5 + 0.5);
              vec4 videoSample = texture2D(projectorMap, uv);
              float projectionAlpha = clamp(projectorOpacity * videoSample.a, 0.0, 1.0);
              if (debugMode > 0.5) {
                color = mix(color, debugProjectionColor, max(projectionAlpha, 0.75));
                alpha = max(alpha, 0.78);
              } else {
                color = mix(color, videoSample.rgb, projectionAlpha);
                alpha = max(alpha, projectionAlpha);
              }
            }
          }
        }

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

function createSceneOccluderMaterial(): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    toneMapped: false,
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

async function loadProjectionMesh(
  loader: OBJLoader,
  uniforms: ProjectionUniforms
): Promise<THREE.Group> {
  const projectionMesh = await loader.loadAsync(SCENE_MESH_URL);
  projectionMesh.name = "JNUProjectionMesh";
  projectionMesh.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.computeVertexNormals?.();
    mesh.material = createProjectedMeshMaterial(uniforms);
    mesh.renderOrder = PROJECTION_RENDER_ORDER;
    mesh.frustumCulled = false;
  });
  projectionMesh.renderOrder = PROJECTION_RENDER_ORDER;
  return projectionMesh;
}

function syncSceneToVideo(timeSeconds?: number): void {
  if (!viewerPoseData || !viewerProjectorCamera || !viewerProjectionUniforms) return;

  const effectiveTime = timeSeconds ?? viewerVideoElement?.currentTime ?? currentTime.value;
  currentTime.value = effectiveTime;

  const duration = videoDuration.value > 0 ? videoDuration.value : maxTime.value;
  const frameIndex =
    duration > 0
      ? Math.min(
          Math.max(Math.round((effectiveTime / duration) * (viewerPoseData.data.length - 1)), 0),
          viewerPoseData.data.length - 1
        )
      : 0;

  const pose = viewerPoseData.data[frameIndex];
  if (!pose) return;

  const cameraToWorldMatrix = cameraToWorldMatrixFromPoseFrame(pose);
  const worldToCameraMatrix = cameraToWorldMatrix.clone().invert();
  viewerProjectorCamera.matrixAutoUpdate = false;
  viewerProjectorCamera.matrix.copy(cameraToWorldMatrix);
  viewerProjectorCamera.matrixWorld.copy(cameraToWorldMatrix);
  viewerProjectorCamera.matrixWorldInverse.copy(worldToCameraMatrix);
  viewerProjectorCamera.updateMatrixWorld(true);

  if (viewerDroneRoot) {
    viewerDroneRoot.matrixAutoUpdate = false;
    viewerDroneRoot.matrix.copy(cameraToWorldMatrix);
    viewerDroneRoot.matrixWorld.copy(cameraToWorldMatrix);
    viewerDroneRoot.updateMatrixWorld(true);
    viewerDroneDebugHelper?.update();
  }

  if (followViewerMode.value || !viewerHasAlignedUserCamera) {
    alignViewerCameraToDrone(cameraToWorldMatrix);
    viewerHasAlignedUserCamera = true;
  }

  projectorViewProjectionMatrix
    .copy(viewerProjectorCamera.projectionMatrix)
    .multiply(viewerProjectorCamera.matrixWorldInverse);

  viewerProjectionUniforms.projectorMatrix.value.copy(projectorViewProjectionMatrix);
  viewerProjectorHelper?.update();
}

function updateProjectorLens(): void {
  if (!viewerProjectorCamera || !viewerPoseData) return;
  viewerProjectorCamera.fov = projectorFov.value;
  viewerProjectorCamera.aspect = videoFrameWidth.value / videoFrameHeight.value;
  viewerProjectorCamera.near = 0.01;
  viewerProjectorCamera.far = 20;
  viewerProjectorCamera.updateProjectionMatrix();
  syncSceneToVideo();
}

function startVideoSyncLoop(): void {
  if (!viewerVideoElement?.requestVideoFrameCallback) return;
  if (viewerSyncHandle !== undefined && viewerVideoElement.cancelVideoFrameCallback) {
    viewerVideoElement.cancelVideoFrameCallback(viewerSyncHandle);
    viewerSyncHandle = undefined;
  }

  const handleVideoFrame = (_now: number, metadata: VideoFrameCallbackMetadata) => {
    syncSceneToVideo(metadata.mediaTime);
    if (viewerVideoElement?.requestVideoFrameCallback) {
      viewerSyncHandle = viewerVideoElement.requestVideoFrameCallback(handleVideoFrame);
    }
  };

  viewerSyncHandle = viewerVideoElement.requestVideoFrameCallback(handleVideoFrame);
}

function bindPlaybackVideoElement(): HTMLVideoElement | undefined {
  const video = videoPreviewRef.value;
  if (!video) return undefined;

  if (video.src !== `${window.location.origin}${VIDEO_URL}`) {
    video.src = VIDEO_URL;
  }
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("webkit-playsinline", "true");
  video.currentTime = currentTime.value;
  return video;
}

function attachViewerVideoEvents(videoElement: HTMLVideoElement): void {
  viewerVideoCleanup?.();

  const handleLoadedMetadata = () => {
    videoDuration.value = Number.isFinite(videoElement.duration) ? videoElement.duration : 0;
    videoFrameWidth.value = videoElement.videoWidth || DEFAULT_VIDEO_WIDTH;
    videoFrameHeight.value = videoElement.videoHeight || DEFAULT_VIDEO_HEIGHT;
    updateProjectorLens();
    syncSceneToVideo(videoElement.currentTime);
    void autoplayVideoIfReady();
  };
  const handleTimeUpdate = () => {
    currentTime.value = videoElement.currentTime;
    syncSceneToVideo(videoElement.currentTime);
  };
  const handlePlay = () => {
    isPlaying.value = true;
    startVideoSyncLoop();
  };
  const handlePause = () => {
    isPlaying.value = false;
    syncSceneToVideo(videoElement.currentTime);
  };
  const handleEnded = () => {
    isPlaying.value = false;
    syncSceneToVideo(videoElement.currentTime);
  };

  videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
  videoElement.addEventListener("timeupdate", handleTimeUpdate);
  videoElement.addEventListener("play", handlePlay);
  videoElement.addEventListener("pause", handlePause);
  videoElement.addEventListener("ended", handleEnded);

  viewerVideoCleanup = () => {
    videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    videoElement.removeEventListener("play", handlePlay);
    videoElement.removeEventListener("pause", handlePause);
    videoElement.removeEventListener("ended", handleEnded);
  };

  if (videoElement.readyState >= 1) {
    handleLoadedMetadata();
  }
}

async function setupTrajectoryViewer(): Promise<void> {
  const token = ++trajectoryInitToken;

  cleanupTrajectoryViewer();
  trajectoryViewerErrorMessage.value = "";
  trajectorySnapshotUrl.value = "";

  if (!trajectoryHostRef.value || !record.value) {
    trajectoryViewerStatus.value = "idle";
    return;
  }

  trajectoryViewerStatus.value = "loading";

  const host = trajectoryHostRef.value;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.sortObjects = true;
  host.appendChild(renderer.domElement);
  trajectoryRenderer = renderer;

  try {
    const poseData =
      viewerPoseData ??
      (await fetch(POSE_JSON_URL).then(async (response) => {
        if (!response.ok) {
          throw new Error(`无法加载轨迹文件: ${response.status}`);
        }
        return (await response.json()) as CameraPoseData;
      }));
    if (token !== trajectoryInitToken) return;
    if (!poseData) {
      throw new Error("轨迹数据未就绪");
    }

    poseFrames.value = poseData.data;
    poseFrameCount.value = poseData.data.length;

    const points = poseData.data.map((frame) => {
      const matrix = cameraToWorldMatrixFromPoseFrame(frame);
      const position = new THREE.Vector3().setFromMatrixPosition(matrix);
      return {
        x: position.x,
        y: position.y,
        z: position.z,
      };
    });

    if (!points.length) {
      throw new Error("轨迹数据为空");
    }

    updateTrajectoryProjectionBounds(points);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#071018");
    const { width, height } = getTrajectoryViewportSize();
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const ySpan = Math.max(maxY - minY, 0.4);
    trajectoryCameraDistance = Math.max(
      8,
      Math.max(trajectoryHalfSpanX, trajectoryHalfSpanZ) * 4 + ySpan * 2
    );
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const camera = new THREE.OrthographicCamera(
      -trajectoryHalfWidth,
      trajectoryHalfWidth,
      trajectoryHalfHeight,
      -trajectoryHalfHeight,
      0.1,
      trajectoryCameraDistance + 40
    );
    camera.up.set(0, 0, -1);
    camera.position.set(trajectoryCenter.x, maxY + trajectoryCameraDistance, trajectoryCenter.z);
    camera.lookAt(trajectoryCenter);
    camera.updateProjectionMatrix();

    const sparkRenderer = new SparkRenderer({ renderer, enableLod: true });
    scene.add(sparkRenderer);
    trajectorySparkRenderer = sparkRenderer;

    const splat = new SplatMesh({ url: SCENE_SPLAT_URL, paged: true }) as SceneSplatMesh;
    splat.updateGenerator();
    splat.renderOrder = SPLAT_RENDER_ORDER;
    scene.add(splat);
    trajectorySplat = splat;

    await splat.initialized;
    if (token !== trajectoryInitToken) return;

    renderer.render(scene, camera);
    trajectorySnapshotUrl.value = renderer.domElement.toDataURL("image/png");
    trajectoryViewerStatus.value = "ready";
    cleanupTrajectoryViewer();
  } catch (error) {
    if (token !== trajectoryInitToken) return;
    trajectoryViewerStatus.value = "error";
    trajectoryViewerErrorMessage.value =
      error instanceof Error ? error.message : "无法初始化俯视飞行轨迹视图";
    cleanupTrajectoryViewer();
  }
}

async function loadDroneModel(loader: FBXLoader): Promise<THREE.Group> {
  const drone = await loader.loadAsync(DRONE_MODEL_URL);
  const box = new THREE.Box3().setFromObject(drone);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = DRONE_MODEL_TARGET_SIZE / maxDim;

  drone.position.sub(center);
  drone.position.y += DRONE_MODEL_VERTICAL_OFFSET;
  drone.scale.setScalar(scale);
  drone.rotation.x = -Math.PI / 2;
  drone.rotation.z = Math.PI;
  drone.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.userData.droneOriginalMaterial = mesh.material;
      materials.forEach((material) => {
        material.transparent = true;
        material.depthTest = true;
        material.depthWrite = true;
      });
    }
    mesh.renderOrder = DRONE_RENDER_ORDER;
  });
  drone.renderOrder = DRONE_RENDER_ORDER;
  return drone;
}

async function setupViewer(): Promise<void> {
  const token = ++viewerInitToken;

  cleanupViewer();
  viewerErrorMessage.value = "";

  if (!splatHostRef.value || !record.value) {
    viewerStatus.value = "idle";
    return;
  }

  viewerStatus.value = "loading";
  radarStatus.value = "idle";
  radarErrorMessage.value = "";
  radarPlaybackTime.value = 0;
  radarFrameIndex.value = 0;
  radarIsPlaying.value = false;

  const host = splatHostRef.value;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#09131d");
  scene.add(new THREE.AmbientLight("#ffffff", 1.4));
  const directionalLight = new THREE.DirectionalLight("#dfe8ff", 1.8);
  directionalLight.position.set(2, 4, 2);
  scene.add(directionalLight);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(1.8, 1.3, 2.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.sortObjects = true;
  host.appendChild(renderer.domElement);

  const sparkRenderer = new SparkRenderer({ renderer, enableLod: true });
  scene.add(sparkRenderer);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 0.6;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);
  controls.update();

  viewerScene = scene;
  viewerCamera = camera;
  viewerRenderer = renderer;
  viewerSparkRenderer = sparkRenderer;
  viewerControls = controls;
  viewerClock = new THREE.Clock();
  resizeViewer();

  viewerResizeObserver = new ResizeObserver(() => resizeViewer());
  viewerResizeObserver.observe(host);

  try {
    const videoElement = bindPlaybackVideoElement();
    if (!videoElement) {
      throw new Error("视频元素未就绪");
    }
    const videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.generateMipmaps = false;
    viewerVideoElement = videoElement;
    viewerVideoTexture = videoTexture;
    viewerProjectionUniforms = createProjectionUniforms(videoTexture);
    attachViewerVideoEvents(videoElement);

    const [poseData, droneModel, projectionMesh] = await Promise.all([
      fetch(POSE_JSON_URL).then(async (response) => {
        if (!response.ok) {
          throw new Error(`无法加载轨迹文件: ${response.status}`);
        }
        return (await response.json()) as CameraPoseData;
      }),
      loadDroneModel(new FBXLoader()),
      loadProjectionMesh(new OBJLoader(), viewerProjectionUniforms),
    ]);
    if (token !== viewerInitToken) return;

    viewerPoseData = poseData;
    poseFrames.value = poseData.data;
    poseFrameCount.value = poseData.data.length;

    const projectorCamera = new THREE.PerspectiveCamera(
      projectorFov.value,
      videoFrameWidth.value / videoFrameHeight.value,
      0.01,
      20
    );
    const projectorHelper = new THREE.CameraHelper(projectorCamera);
    projectorHelper.visible = showProjectorHelper.value;
    scene.add(projectorHelper);
    viewerProjectorCamera = projectorCamera;
    viewerProjectorHelper = projectorHelper;

    const droneRoot = new THREE.Group();
    droneRoot.add(droneModel);
    scene.add(droneRoot);
    viewerDroneRoot = droneRoot;
    viewerDroneModel = droneModel;
    viewerDroneRoot.visible = showDroneModel.value;

    const droneDebugHelper = new THREE.BoxHelper(droneModel, 0x3cff8f);
    droneDebugHelper.visible = debugDroneModel.value && showDroneModel.value;
    const helperMaterial = droneDebugHelper.material as THREE.Material;
    helperMaterial.depthTest = false;
    helperMaterial.transparent = true;
    helperMaterial.opacity = 1;
    droneDebugHelper.renderOrder = DRONE_RENDER_ORDER + 1;
    scene.add(droneDebugHelper);
    viewerDroneDebugHelper = droneDebugHelper;
    setDroneDebugAppearance(debugDroneModel.value);

    scene.add(projectionMesh);
    viewerProjectionMesh = projectionMesh;
    viewerProjectionMesh.visible = true;

    const sceneOccluder = createSceneOccluderMesh(projectionMesh);
    scene.add(sceneOccluder);
    viewerSceneOccluder = sceneOccluder;

    const splat = new SplatMesh({ url: SCENE_SPLAT_URL, paged: true }) as SceneSplatMesh;
    splat.updateGenerator();
    splat.quaternion.set(0, 0, 0, 1);
    splat.renderOrder = SPLAT_RENDER_ORDER;
    scene.add(splat);
    viewerSplat = splat;

    await splat.initialized;
    if (token !== viewerInitToken) return;

    updateProjectorLens();
    syncSceneToVideo(0);

    viewerStatus.value = "ready";
    void autoplayVideoIfReady();

    renderer.setAnimationLoop(() => {
      if (!viewerRenderer || !viewerScene || !viewerCamera || !viewerControls || !viewerClock)
        return;
      const deltaTime = viewerClock.getDelta();
      applyKeyboardMovement(deltaTime);
      viewerControls.update();
      if (viewerVideoElement && !viewerVideoElement.paused) {
        currentTime.value = viewerVideoElement.currentTime;
      }
      if (viewerProjectorHelper) {
        viewerProjectorHelper.visible = showProjectorHelper.value;
      }
      viewerRenderer.render(viewerScene, viewerCamera);
    });
  } catch (error) {
    if (token !== viewerInitToken) return;
    viewerStatus.value = "error";
    viewerErrorMessage.value =
      error instanceof Error ? error.message : "无法从远程资源初始化 Spark 3DGS 场景";
    cleanupViewer();
  }
}

watch(
  () => recordId.value,
  async () => {
    stopPlayback();
    currentTime.value = 0;
    videoDuration.value = 0;
    poseFrameCount.value = 0;
    await nextTick();
    void setupTrajectoryViewer();
    void setupViewer();
  },
  { immediate: true }
);

watch(projectorFov, () => {
  updateProjectorLens();
});

watch(projectionOpacity, (value) => {
  if (viewerProjectionUniforms) {
    viewerProjectionUniforms.projectorOpacity.value = value;
  }
});

watch(showProjectionMesh, (value) => {
  if (viewerProjectionUniforms) {
    viewerProjectionUniforms.meshOpacity.value = value ? 0.14 : 0;
  }
});

watch(debugProjectionMode, (value) => {
  if (viewerProjectionUniforms) {
    viewerProjectionUniforms.debugMode.value = value ? 1 : 0;
  }
});

watch(showProjectorHelper, (value) => {
  if (viewerProjectorHelper) {
    viewerProjectorHelper.visible = value;
  }
});

watch(showDroneModel, (value) => {
  if (viewerDroneRoot) {
    viewerDroneRoot.visible = value;
  }
  if (viewerDroneDebugHelper) {
    viewerDroneDebugHelper.visible = value && debugDroneModel.value;
  }
});

watch(debugDroneModel, (value) => {
  setDroneDebugAppearance(value);
});

watch(showRadarWind, () => {
  applyRadarVisibility();
});

watch(radarRenderMode, () => {
  applyRadarVisibility();
});

onMounted(() => {
  currentTime.value = 0;
  window.addEventListener("keydown", handleViewerKeydown);
  window.addEventListener("keyup", handleViewerKeyup);
});

onBeforeUnmount(() => {
  stopPlayback();
  window.removeEventListener("keydown", handleViewerKeydown);
  window.removeEventListener("keyup", handleViewerKeyup);
  viewerInitToken += 1;
  trajectoryInitToken += 1;
  cleanupTrajectoryViewer();
  cleanupViewer();
});
</script>

<style scoped lang="scss">
.flight-record-detail-page {
  min-height: calc(100vh - 84px);
  --record-surface-strong: rgba(9, 9, 11, 0.74);
  --record-surface-stronger: rgba(9, 9, 11, 0.82);
  --record-surface-soft: rgba(255, 255, 255, 0.08);
  --record-border-soft: rgba(255, 255, 255, 0.12);
  --record-border-strong: rgba(255, 255, 255, 0.16);
  --record-ink-on-dark: #fafafa;
  --record-ink-muted: rgba(244, 244, 245, 0.72);
  --record-route-base: color-mix(in srgb, var(--foreground) 26%, transparent);
  --record-route-live: var(--chart-2);
  --record-route-live-glow: color-mix(in srgb, var(--chart-2) 46%, transparent);
  --record-route-current: var(--chart-3);
  --record-route-start: var(--chart-2);
  --record-route-end: var(--chart-5);
  --record-chart-altitude: var(--chart-1);
  --record-chart-speed: var(--chart-2);
  --record-chart-indicator: color-mix(in srgb, var(--foreground) 40%, transparent);
  --record-chart-grid: color-mix(in srgb, var(--muted-foreground) 18%, transparent);
}

.detail-panel {
  margin-bottom: 16px;
}

.detail-panel + .detail-panel {
  margin-top: 8px;
}

.map-panel {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(9, 9, 11, 0.12);
}

.map-panel__snapshot-host {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
}

.map-panel__snapshot {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.map-panel__snapshot-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.map-panel__trajectory {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.map-panel__route-base {
  fill: none;
  stroke: var(--record-route-base);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map-panel__route-live {
  filter: drop-shadow(0 0 6px var(--record-route-live-glow));
  fill: none;
  stroke: var(--record-route-live);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map-panel__drone-dot {
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--record-route-current) 44%, transparent));
  fill: var(--record-route-current);
  stroke: rgba(13, 24, 35, 0.9);
  stroke-width: 1;
}

.map-panel__anchor {
  stroke-width: 0.5;
}

.map-panel__anchor--start {
  fill: var(--record-route-start);
  stroke: rgba(9, 28, 18, 0.9);
}

.map-panel__anchor--end {
  fill: var(--record-route-end);
  stroke: rgba(45, 18, 10, 0.9);
}

.map-panel__status {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 32%),
    linear-gradient(180deg, rgba(24, 24, 27, 0.2), rgba(9, 9, 11, 0.6));
  backdrop-filter: blur(10px);
}

.map-panel__status-card {
  max-width: 300px;
  padding: 18px 20px;
  text-align: center;
  background: var(--record-surface-stronger);
  border: 1px solid var(--record-border-soft);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(14px);
}

.map-panel__status-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--record-ink-on-dark);
}

.map-panel__status-text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--record-ink-muted);
}

.detail-log-panel :deep(.info-panel__body) {
  padding-top: 0;
}

.video-stage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-stage__media {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(39, 39, 42, 0.96), rgba(24, 24, 27, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 22px 46px rgba(9, 9, 11, 0.18);
}

.video-stage__viewer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.video-stage__viewer :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.video-stage__pip {
  position: absolute;
  top: 56px;
  right: 18px;
  z-index: 2;
  width: min(28%, 280px);
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: rgba(9, 9, 11, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.28);
  will-change: transform;
}

.video-stage__status {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 32%),
    linear-gradient(180deg, rgba(39, 39, 42, 0.22), rgba(9, 9, 11, 0.64));
  backdrop-filter: blur(10px);
}

.video-stage__status-card {
  max-width: 360px;
  padding: 18px 20px;
  text-align: center;
  background: var(--record-surface-stronger);
  border: 1px solid var(--record-border-soft);
  border-radius: 18px;
  box-shadow: 0 22px 42px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
}

.video-stage__status-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--record-ink-on-dark);
}

.video-stage__status-text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--record-ink-muted);
}

.video-stage__overlay {
  position: absolute;
  right: 16px;
  left: 16px;
  z-index: 2;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.video-stage__overlay--top {
  top: 14px;
}

.video-stage__overlay--bottom {
  right: 18px;
  bottom: 14px;
  left: 18px;
  gap: 16px;
  align-items: center;
  padding: 10px 12px;
  background: var(--record-surface-strong);
  border: 1px solid var(--record-border-soft);
  border-radius: 18px;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(16px);
}

.play-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: var(--record-ink-on-dark);
  background: var(--record-surface-soft);
  border: 1px solid var(--record-border-strong);
  border-radius: 50%;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.play-toggle:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.video-slider {
  flex: 1;
}

.video-slider :deep(.el-slider__runway) {
  height: 4px;
  background-color: rgba(255, 255, 255, 0.16);
}

.video-slider :deep(.el-slider__bar) {
  height: 4px;
  background-color: var(--record-chart-indicator);
}

.video-slider :deep(.el-slider__button) {
  width: 14px;
  height: 14px;
  background-color: var(--record-ink-on-dark);
  border: 3px solid var(--record-chart-indicator);
}

.video-time {
  min-width: 112px;
  font-size: 14px;
  font-weight: 600;
  color: var(--record-ink-on-dark);
  text-align: right;
}

.telemetry-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
}

.telemetry-chart {
  padding: 16px 18px 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  box-shadow: 0 12px 24px rgba(9, 9, 11, 0.06);
}

.telemetry-chart__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.telemetry-svg {
  width: 100%;
  height: 190px;
}

.telemetry-grid {
  stroke: var(--record-chart-grid);
  stroke-width: 1;
}

.telemetry-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.telemetry-line--altitude {
  stroke: var(--record-chart-altitude);
}

.telemetry-line--speed {
  stroke: var(--record-chart-speed);
}

.telemetry-indicator {
  stroke: var(--record-chart-indicator);
  stroke-width: 2;
}

.telemetry-point {
  stroke: var(--el-bg-color-overlay);
  stroke-width: 2;
}

.telemetry-point--altitude {
  fill: var(--record-chart-altitude);
}

.telemetry-point--speed {
  fill: var(--record-chart-speed);
}

.record-detail-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.85fr) minmax(0, 1.65fr);
  gap: 16px;
}

.record-detail-grid__side,
.record-detail-grid__main {
  min-width: 0;
}

.detail-empty-card__footer {
  display: flex;
  justify-content: center;
}

@media (max-width: 1200px) {
  .record-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .map-panel {
    min-height: 360px;
  }

  .video-stage__media {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .video-stage__overlay--bottom {
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-end;
  }

  .video-time {
    width: 100%;
    text-align: left;
  }

  .telemetry-section {
    grid-template-columns: 1fr;
  }
}
</style>
