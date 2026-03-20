<template>
  <div class="app-container flight-record-detail-page">
    <template v-if="record">
      <el-row :gutter="20">
        <el-col :lg="6" :xs="24" class="mb-[12px]">
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
                        : "正在加载 JNU.sog 并生成俯视飞行轨迹..."
                    }}
                  </div>
                </div>
              </div>
              <div class="map-panel__badge">{{ record.locationLabel }}</div>
              <div class="map-panel__switches">
                <el-tag size="small" effect="dark">Spark Snapshot</el-tag>
                <el-tag size="small" effect="plain">Fixed Camera</el-tag>
                <el-tag size="small" effect="plain">{{ trajectoryPointCount }} pts</el-tag>
              </div>
            </div>
          </InfoPanel>

          <InfoPanel title="飞行日志" class="detail-log-panel" body-class="detail-panel__body">
            <el-scrollbar max-height="360px">
              <div class="flight-log-list">
                <div v-for="item in record.flightLogs" :key="item.id" class="flight-log-list__item">
                  <span class="flight-log-list__time" :class="`is-${item.level}`">
                    {{ item.time }}
                  </span>
                  <span class="flight-log-list__content">{{ item.content }}</span>
                </div>
              </div>
            </el-scrollbar>
          </InfoPanel>
        </el-col>

        <el-col :lg="18" :xs="24">
          <InfoPanel title="无人机视频" body-class="detail-panel__body">
            <div class="video-stage">
              <div class="video-stage__media">
                <div class="video-stage__overlay video-stage__overlay--top">
                  <div class="video-stage__tag-group">
                    <el-tag effect="dark">{{ record.droneName }}</el-tag>
                    <el-tag effect="dark">{{ record.batteryPercent }}%</el-tag>
                    <el-tag effect="dark">
                      Frame {{ currentFrameIndex + 1 }} / {{ poseFrameCount }}
                    </el-tag>
                  </div>
                  <el-tag effect="dark">FoV {{ projectorFov.toFixed(1) }}°</el-tag>
                </div>

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

                <div class="telemetry-stats">
                  <el-card shadow="never" class="metric-card">
                    <el-statistic :value="currentAltitude">
                      <template #title>距地高度</template>
                      <template #suffix>m</template>
                    </el-statistic>
                  </el-card>

                  <el-card shadow="never" class="metric-card">
                    <el-statistic :value="currentSpeed">
                      <template #title>速度</template>
                      <template #suffix>m/s</template>
                    </el-statistic>
                  </el-card>

                  <el-card shadow="never" class="metric-card metric-card--control">
                    <div class="projection-control">
                      <div class="projection-control__header">
                        <span>视频 FoV</span>
                        <span>{{ projectorFov.toFixed(1) }}°</span>
                      </div>
                      <el-slider
                        v-model="projectorFov"
                        :min="20"
                        :max="80"
                        :step="0.5"
                        :show-tooltip="false"
                      />
                    </div>
                  </el-card>

                  <el-card shadow="never" class="metric-card metric-card--control">
                    <div class="projection-control">
                      <div class="projection-control__header">
                        <span>投影混合</span>
                        <span>{{ projectionOpacity.toFixed(2) }}</span>
                      </div>
                      <el-slider
                        v-model="projectionOpacity"
                        :min="0"
                        :max="1"
                        :step="0.01"
                        :show-tooltip="false"
                      />
                      <div class="projection-control__switch">
                        <span>显示 JNU.obj</span>
                        <el-switch v-model="showProjectionMesh" />
                      </div>
                      <div class="projection-control__switch">
                        <span>调试投影</span>
                        <el-switch v-model="debugProjectionMode" />
                      </div>
                      <div class="projection-control__switch">
                        <span>显示投影相机</span>
                        <el-switch v-model="showProjectorHelper" />
                      </div>
                      <div class="projection-control__switch">
                        <span>显示无人机</span>
                        <el-switch v-model="showDroneModel" />
                      </div>
                      <div class="projection-control__switch">
                        <span>无人机调试</span>
                        <el-switch v-model="debugDroneModel" />
                      </div>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </InfoPanel>
        </el-col>
      </el-row>
    </template>

    <el-card v-else shadow="hover" class="detail-empty-card">
      <el-empty description="未找到对应的飞行记录" />
      <div class="detail-empty-card__footer">
        <el-button type="primary" @click="router.back()">返回列表</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VideoPause, VideoPlay } from "@element-plus/icons-vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { SplatMesh } from "@sparkjsdev/spark";
import InfoPanel from "@/components/InfoPanel.vue";
import { getFlightRecordById } from "@/views/flight/record/data";

defineOptions({
  name: "FlightRecordDetail",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();
const SCENE_SPLAT_URL = "/video+xyz/JNU.sog";
const SCENE_MESH_URL = "/video+xyz/JNU.obj";
const DRONE_MODEL_URL = "/video+xyz/dji-mavic-pro-for-element-3d.fbx";
const VIDEO_URL = "/video+xyz/5_DJI-Air_5~1.mp4";
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
let viewerRenderer: THREE.WebGLRenderer | undefined;
let viewerScene: THREE.Scene | undefined;
let viewerCamera: THREE.PerspectiveCamera | undefined;
let viewerControls: OrbitControls | undefined;
let viewerSplat: SceneSplatMesh | undefined;
let viewerProjectionMesh: THREE.Group | undefined;
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
let viewerSyncHandle: number | undefined;
let viewerHasAlignedUserCamera = false;
let trajectoryRenderer: THREE.WebGLRenderer | undefined;
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
const PROJECTION_RENDER_ORDER = 100;
const DRONE_RENDER_ORDER = 120;
const USER_CAMERA_HEIGHT_OFFSET = 0.16;
const USER_CAMERA_XZ_OFFSET = new THREE.Vector3(0.16, 0, 0.28);

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
    if (mesh.geometry) {
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

  if (viewerProjectionMesh) {
    viewerScene?.remove(viewerProjectionMesh);
    disposeObject3D(viewerProjectionMesh);
    viewerProjectionMesh = undefined;
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

    const splat = new SplatMesh({ url: SCENE_SPLAT_URL }) as SceneSplatMesh;
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

    const splat = new SplatMesh({ url: SCENE_SPLAT_URL }) as SceneSplatMesh;
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
}

.detail-panel {
  margin-bottom: 12px;
}

.detail-panel + .detail-panel {
  margin-top: 4px;
}

.map-panel {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 4px;
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
  stroke: rgba(119, 207, 255, 0.42);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map-panel__route-live {
  filter: drop-shadow(0 0 6px rgba(76, 255, 213, 0.45));
  fill: none;
  stroke: rgba(76, 255, 213, 0.98);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map-panel__drone-dot {
  filter: drop-shadow(0 0 6px rgba(255, 224, 130, 0.42));
  fill: #ffe082;
  stroke: rgba(13, 24, 35, 0.9);
  stroke-width: 1;
}

.map-panel__anchor {
  stroke-width: 0.5;
}

.map-panel__anchor--start {
  fill: #7ee787;
  stroke: rgba(9, 28, 18, 0.9);
}

.map-panel__anchor--end {
  fill: #ff8a65;
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 36%),
    linear-gradient(180deg, rgba(49, 56, 67, 0.2), rgba(8, 14, 22, 0.54));
}

.map-panel__status-card {
  max-width: 300px;
  padding: 16px 18px;
  text-align: center;
  background: rgba(8, 15, 23, 0.72);
  border: 1px solid rgba(115, 186, 255, 0.28);
  border-radius: 12px;
  backdrop-filter: blur(12px);
}

.map-panel__status-title {
  font-size: 16px;
  font-weight: 700;
  color: #f4f8ff;
}

.map-panel__status-text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(231, 238, 250, 0.78);
}

.map-panel__badge {
  position: absolute;
  bottom: 52px;
  left: 16px;
  z-index: 4;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: rgba(15, 31, 58, 0.76);
  border: 1px solid rgba(10, 186, 255, 0.3);
  border-radius: 4px;
}

.map-panel__switches {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 4;
  display: flex;
  gap: 6px;
}

.detail-log-panel :deep(.info-panel__body) {
  padding-top: 0;
}

.flight-log-list {
  padding: 12px 0 0;
}

.flight-log-list__item {
  display: flex;
  gap: 8px;
  padding: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
}

.flight-log-list__time {
  flex: 0 0 auto;
  font-weight: 600;
}

.flight-log-list__time.is-danger {
  color: var(--el-color-danger);
}

.flight-log-list__time.is-warning {
  color: var(--el-color-warning);
}

.flight-log-list__time.is-info {
  color: var(--el-text-color-regular);
}

.flight-log-list__content {
  color: var(--el-text-color-primary);
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
  background: linear-gradient(180deg, rgba(66, 76, 90, 0.88), rgba(45, 55, 68, 0.96));
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
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
  background: rgba(4, 10, 17, 0.88);
  border: 1px solid rgba(130, 194, 255, 0.38);
  border-radius: 10px;
  box-shadow: 0 16px 28px rgba(2, 8, 15, 0.32);
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 36%),
    linear-gradient(180deg, rgba(49, 56, 67, 0.22), rgba(16, 22, 31, 0.58));
}

.video-stage__status-card {
  max-width: 360px;
  padding: 16px 18px;
  text-align: center;
  background: rgba(8, 15, 23, 0.72);
  border: 1px solid rgba(115, 186, 255, 0.28);
  border-radius: 12px;
  backdrop-filter: blur(12px);
}

.video-stage__status-title {
  font-size: 16px;
  font-weight: 700;
  color: #f4f8ff;
}

.video-stage__status-text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(231, 238, 250, 0.78);
}

.video-stage__overlay {
  position: absolute;
  right: 16px;
  left: 16px;
  z-index: 2;
  display: flex;
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
}

.play-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--el-text-color-primary);
  background: rgba(15, 31, 58, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.video-slider {
  flex: 1;
}

.video-slider :deep(.el-slider__runway) {
  height: 4px;
}

.video-slider :deep(.el-slider__bar) {
  height: 4px;
}

.video-time {
  min-width: 112px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: right;
}

.telemetry-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 12px;
}

.telemetry-chart {
  padding: 14px 16px 8px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
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
  stroke: rgba(120, 172, 240, 0.18);
  stroke-width: 1;
}

.telemetry-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.telemetry-line--altitude {
  stroke: var(--el-color-primary);
}

.telemetry-line--speed {
  stroke: #51f4f3;
}

.telemetry-indicator {
  stroke: #6c76f4;
  stroke-width: 2;
}

.telemetry-point {
  stroke: var(--el-bg-color-overlay);
  stroke-width: 2;
}

.telemetry-point--altitude {
  fill: var(--el-color-primary);
}

.telemetry-point--speed {
  fill: #51f4f3;
}

.telemetry-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-card {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-light);
}

.metric-card :deep(.el-card__body) {
  padding: 18px 16px;
}

.metric-card :deep(.el-statistic__head) {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.metric-card :deep(.el-statistic__content) {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.metric-card :deep(.el-statistic__suffix) {
  margin-left: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.detail-empty-card__footer {
  display: flex;
  justify-content: center;
}

@media (max-width: 1200px) {
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
