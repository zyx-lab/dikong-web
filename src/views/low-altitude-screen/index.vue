<template>
  <section
    ref="screenRef"
    class="low-altitude-screen-page"
    :class="{ 'is-playback-mode': isPlaybackMode }"
  >
    <LowAltitudeSceneHost
      :key="sceneHostKey"
      :model="sceneModel"
      :scene-config="sceneConfig"
      :scene-enabled="sceneEnabled"
      :scene-options="sceneOptions"
      @scene-status-change="handleSceneStatusChange"
    >
      <div v-if="isPlaybackMode" class="playback-stage" :data-playback-state="playbackLoadState">
        <header class="playback-stage__header">
          <div class="playback-stage__title-block">
            <span class="playback-stage__eyebrow">专注回放</span>
            <h1 class="playback-stage__title">
              {{ playbackMission?.routeName || "模拟飞行" }}
            </h1>
          </div>
          <div class="screen-actions playback-stage__actions">
            <div class="screen-actions">
              <button type="button" class="screen-action" @click="returnToSystem">返回系统</button>
              <button type="button" class="screen-action" @click="toggleFullscreen">
                {{ isFullscreen ? "退出浏览器全屏" : "进入浏览器全屏" }}
              </button>
            </div>
          </div>
        </header>

        <section class="playback-stage__panel">
          <div v-if="playbackLoadState === 'loading'" class="playback-stage__state-card">
            <h2>专注回放</h2>
            <p>正在加载已保存航线并生成飞行时间线...</p>
          </div>
          <div
            v-else-if="playbackLoadState === 'waitingScene'"
            data-testid="playback-waiting-scene"
            class="playback-stage__state-card"
          >
            <h2>等待 3DGS 场景加载完成</h2>
            <p>航线已准备完成，模拟飞行将在 3DGS 场景 ready 后自动开始。</p>
          </div>
          <div
            v-else-if="playbackLoadState === 'error'"
            class="playback-stage__state-card is-error"
          >
            <h2>无法加载模拟飞行航线</h2>
            <p>{{ playbackErrorMessage }}</p>
          </div>
          <div
            v-else-if="playbackMission && playbackState"
            data-testid="playback-stats"
            class="playback-stage__state-card playback-stage__state-card--stats"
          >
            <div class="playback-stage__stat-grid">
              <article class="playback-stage__stat">
                <span>当前阶段</span>
                <strong>{{ playbackPhaseText }}</strong>
              </article>
              <article class="playback-stage__stat">
                <span>当前航点</span>
                <strong>
                  {{ playbackState.currentWaypointIndex }}/{{ playbackState.totalWaypointCount }}
                </strong>
              </article>
              <article class="playback-stage__stat">
                <span>当前高度</span>
                <strong>{{ playbackAltitudeText }}</strong>
              </article>
              <article class="playback-stage__stat">
                <span>当前速度</span>
                <strong>{{ playbackSpeedText }}</strong>
              </article>
              <article class="playback-stage__stat">
                <span>返航状态</span>
                <strong>{{ playbackReturnText }}</strong>
              </article>
              <article class="playback-stage__stat">
                <span>完成状态</span>
                <strong>{{ playbackCompletionText }}</strong>
              </article>
            </div>
            <div class="playback-stage__progress">
              <div class="playback-stage__progress-row">
                <span>飞行进度</span>
                <strong>{{ playbackProgressText }}</strong>
              </div>
              <div class="progress-card__bar">
                <div
                  class="progress-card__fill"
                  :style="{ width: `${Math.round((playbackState.progressRatio || 0) * 100)}%` }"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="dashboard-stage">
        <header class="screen-header">
          <div class="screen-header__meta screen-header__meta--left">
            <span class="screen-header__meta-label">当前时间</span>
            <strong class="screen-header__meta-value">{{ currentTimestamp }}</strong>
          </div>

          <div class="screen-title-wrap">
            <div class="screen-title__glow" />
            <h1 class="screen-title">低空智能巡检平台</h1>
          </div>

          <div class="screen-header__meta screen-header__meta--right">
            <div class="screen-weather">
              <span class="screen-weather__main">8-27°C 晴转多云</span>
            </div>
            <div class="screen-actions">
              <button type="button" class="screen-action" @click="returnToSystem">返回系统</button>
              <button type="button" class="screen-action" @click="toggleFullscreen">
                {{ isFullscreen ? "退出浏览器全屏" : "进入浏览器全屏" }}
              </button>
            </div>
          </div>
        </header>

        <div class="screen-content">
          <aside class="side-panel side-panel--left">
            <div class="side-panel__body side-panel__body--left">
              <TaskSituationPanel :model="taskPanel" />
              <DroneOnlinePanel :model="dronePanel" />
            </div>
          </aside>

          <section class="screen-center">
            <div class="screen-center__viewer-shell">
              <div class="center-stage">
                <div class="center-stage__halo" />
                <button
                  type="button"
                  class="center-stage__wind-toggle"
                  :class="{ 'is-expanded': windPanelExpanded }"
                  @click="windPanelExpanded = !windPanelExpanded"
                >
                  <span>风场监测</span>
                  <span class="center-stage__wind-toggle-icon">
                    {{ windPanelExpanded ? "−" : "+" }}
                  </span>
                </button>
                <WindFieldPanel
                  v-if="windPanelExpanded"
                  class="center-stage__wind-panel"
                  :beam-elevation-deg="windBeamElevationDeg"
                  :current-time-text="windCurrentTimeText"
                  :error-message="windErrorMessage"
                  :layer-count="windLayerCount"
                  :legend-stops="windLegendStops"
                  :render-mode="windRenderMode"
                  :show-vertical-airflow="showWindVerticalAirflow"
                  :status="windStatus"
                  :visible="showWindField"
                  @set-render-mode="windRenderMode = $event"
                  @toggle-visible="showWindField = !showWindField"
                  @toggle-vertical-airflow="showWindVerticalAirflow = !showWindVerticalAirflow"
                />

                <SceneCalibrationPanel
                  v-if="sceneConfig.showCalibrationPanel"
                  v-model="scenePlacement"
                  :camera-view-snapshot="currentCameraViewSnapshot"
                  class="center-stage__calibration-panel"
                  :default-placement="defaultPlacement"
                />
              </div>
            </div>
          </section>

          <aside class="side-panel side-panel--right">
            <div class="side-panel__body side-panel__body--right">
              <AlertBroadcastPanel :model="alertPanel" />
              <FlightClosurePanel :model="flightPanel" />
            </div>
          </aside>
        </div>
      </div>
    </LowAltitudeSceneHost>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from "vue";
import { useDateFormat, useFullscreen, useNow } from "@vueuse/core";
import "./styles.scss";
import LowAltitudeSceneHost from "./components/LowAltitudeSceneHost.vue";
import TaskSituationPanel from "./components/TaskSituationPanel.vue";
import DroneOnlinePanel from "./components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "./components/AlertBroadcastPanel.vue";
import FlightClosurePanel from "./components/FlightClosurePanel.vue";
import WindFieldPanel from "./components/WindFieldPanel.vue";
import SceneCalibrationPanel from "./components/SceneCalibrationPanel.vue";
import { resolvePlaybackAltitudeContext } from "./playback-altitude";
import { shouldShowSceneCalibrationPanel } from "./query";
import {
  LOW_ALTITUDE_ALERT_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_FLIGHT_PANEL,
  LOW_ALTITUDE_SCENE_CONFIG,
  LOW_ALTITUDE_TASK_PANEL,
} from "./static-data";
import { buildPlaybackSceneModel, createPlaybackMission } from "./playback";
import { buildSceneModel } from "./scene-model";
import { createPlaybackSceneExtension } from "./scene/playback-extension";
import {
  buildWindLegendStops,
  createWindFieldSceneExtension,
  type WindFieldStatus,
  type WindLegendStop,
  type WindRenderMode,
} from "./scene/wind-field";
import { cloneSceneSplatPlacement } from "./scene/geospatial";
import type {
  LowAltitudeSceneConfig,
  PlaybackMission,
  PlaybackState,
  SceneHomeViewConfig,
} from "./types";
import RouteAPI from "@/api/flight/route";
import { hydrateRouteRecord } from "@/views/route/route-xml";
import router from "@/router";

defineOptions({ name: "LowAltitudeScreenPage" });

function shouldEnableCalibrationPanel() {
  return shouldShowSceneCalibrationPanel(window.location);
}

function resolveLocationQuery() {
  const hashQueryIndex = window.location.hash.indexOf("?");
  const hashQuery = hashQueryIndex >= 0 ? window.location.hash.slice(hashQueryIndex + 1) : "";
  const searchQuery = window.location.search.replace(/^\?/, "");
  return new URLSearchParams(hashQuery || searchQuery);
}

type PlaybackLoadState = "idle" | "loading" | "waitingScene" | "ready" | "error";
type SceneStatusChange = {
  status: "loading" | "ready" | "error" | "unsupported";
  errorMessage: string;
};

const screenRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(screenRef);
const now = useNow({ interval: 1000 });
const currentTimestamp = useDateFormat(now, "YYYY.MM.DD HH:mm:ss");
const locationQuery = resolveLocationQuery();
const isPlaybackMode = ref(locationQuery.get("mode") === "playback");
const playbackRouteId = ref(locationQuery.get("routeId")?.trim() || "");

const taskPanel = LOW_ALTITUDE_TASK_PANEL;
const dronePanel = LOW_ALTITUDE_DRONE_PANEL;
const alertPanel = LOW_ALTITUDE_ALERT_PANEL;
const flightPanel = LOW_ALTITUDE_FLIGHT_PANEL;
const defaultPlacement = cloneSceneSplatPlacement(LOW_ALTITUDE_SCENE_CONFIG.splatPlacement);
const scenePlacement = ref(cloneSceneSplatPlacement(defaultPlacement));
const currentCameraViewSnapshot = ref<SceneHomeViewConfig>({
  ...LOW_ALTITUDE_SCENE_CONFIG.homeView,
});
const showWindField = ref(true);
const showWindVerticalAirflow = ref(false);
const windPanelExpanded = ref(false);
const windRenderMode = ref<WindRenderMode>("arrow");
const windStatus = ref<WindFieldStatus>("idle");
const windErrorMessage = ref("");
const windCurrentTimeText = ref("--:--");
const windLayerCount = ref(0);
const windBeamElevationDeg = ref<number>();
const windLegendStops = ref<WindLegendStop[]>([]);
const playbackLoadState = ref<PlaybackLoadState>(isPlaybackMode.value ? "loading" : "idle");
const playbackMission = shallowRef<PlaybackMission | null>(null);
const playbackState = ref<PlaybackState | null>(null);
const playbackErrorMessage = ref("");

const sceneConfig = computed<LowAltitudeSceneConfig>(() => ({
  ...LOW_ALTITUDE_SCENE_CONFIG,
  splatPlacement: cloneSceneSplatPlacement(scenePlacement.value),
  showCalibrationPanel: isPlaybackMode.value ? false : shouldEnableCalibrationPanel(),
}));

const sceneEnabled = computed(() => !isPlaybackMode.value || Boolean(playbackMission.value));

const sceneModel = computed(() => {
  if (isPlaybackMode.value && playbackMission.value && playbackState.value) {
    return buildPlaybackSceneModel(playbackMission.value, playbackState.value);
  }

  return buildSceneModel({
    routes: [],
    markers: [],
    selectedMarkerId: null,
  });
});

const sceneHostKey = computed(() => {
  if (!isPlaybackMode.value) {
    return "dashboard";
  }

  return `playback-${playbackRouteId.value || playbackMission.value?.routeId || "pending"}`;
});

const sceneOptions = computed(() => {
  if (isPlaybackMode.value) {
    if (playbackMission.value) {
      return {
        createExtension: createPlaybackSceneExtension({
          mission: playbackMission.value,
          onStateChange(state) {
            playbackState.value = state;
          },
        }),
      };
    }

    return {};
  }

  return {
    createExtension: createWindFieldSceneExtension({
      onFrameChange(event) {
        windCurrentTimeText.value = event.timeText;
        windLayerCount.value = event.layerCount;
      },
      onStatusChange(event) {
        windStatus.value = event.status;
        windErrorMessage.value = event.errorMessage;
        windBeamElevationDeg.value = event.data?.meta.beamElevationDeg;
        windLegendStops.value = event.data
          ? buildWindLegendStops(event.data.meta.maxHorizontalSpeed)
          : [];
        if (event.status !== "ready") {
          windCurrentTimeText.value = "--:--";
          windLayerCount.value = event.data?.meta.layerCount ?? 0;
        }
      },
      renderMode: windRenderMode,
      showVerticalAirflow: showWindVerticalAirflow,
      visible: showWindField,
    }),
    onCameraViewChange(snapshot: SceneHomeViewConfig) {
      currentCameraViewSnapshot.value = snapshot;
    },
  };
});

const playbackPhaseText = computed(() => {
  switch (playbackState.value?.phase) {
    case "takeoff":
      return "起飞爬升";
    case "cruise":
      return "航线巡飞";
    case "hover":
      return "航点悬停";
    case "turn":
      return "航点转向";
    case "landing":
      return "降落中";
    case "returnHome":
      return "返航中";
    case "completed":
      return "已完成";
    default:
      return "--";
  }
});
const playbackAltitudeText = computed(() =>
  playbackState.value ? `${Math.round(playbackState.value.displayAltitudeMeters)}m` : "--"
);
const playbackSpeedText = computed(() =>
  playbackState.value ? `${playbackState.value.speedMetersPerSecond.toFixed(1)}m/s` : "--"
);
const playbackReturnText = computed(() =>
  playbackState.value?.returning ? "返航中" : playbackState.value?.completed ? "已返航" : "未返航"
);
const playbackCompletionText = computed(() =>
  playbackState.value?.completed ? "已完成" : "执行中"
);
const playbackProgressText = computed(() => {
  if (!playbackState.value) {
    return "--";
  }

  return `${Math.round(playbackState.value.progressRatio * 100)}%`;
});

function handleSceneStatusChange(event: SceneStatusChange) {
  if (!isPlaybackMode.value || !playbackMission.value) {
    return;
  }

  if (event.status === "ready") {
    playbackLoadState.value = "ready";
    return;
  }

  if (event.status === "error" || event.status === "unsupported") {
    playbackLoadState.value = "error";
    playbackErrorMessage.value = event.errorMessage;
    return;
  }

  if (playbackLoadState.value !== "ready") {
    playbackLoadState.value = "waitingScene";
  }
}

async function loadPlaybackMission() {
  if (!isPlaybackMode.value) {
    return;
  }

  if (!playbackRouteId.value) {
    playbackLoadState.value = "error";
    playbackErrorMessage.value = "缺少 routeId，无法加载已保存航线。";
    return;
  }

  playbackLoadState.value = "loading";
  playbackErrorMessage.value = "";
  playbackState.value = null;

  try {
    const routeDetail = await RouteAPI.getDetail(playbackRouteId.value);
    const kmzResponse = await RouteAPI.getKmz(playbackRouteId.value).catch(() => null);
    const routeRecord = await hydrateRouteRecord(routeDetail, kmzResponse?.data);
    const altitudeContext = await resolvePlaybackAltitudeContext(
      routeRecord,
      sceneConfig.value.sceneOrigin
    );
    const mission = createPlaybackMission(routeRecord, altitudeContext);
    playbackMission.value = mission;
    playbackLoadState.value = "waitingScene";
  } catch (error) {
    playbackMission.value = null;
    playbackState.value = null;
    playbackLoadState.value = "error";
    playbackErrorMessage.value =
      error instanceof Error ? error.message : "无法还原已保存航线，请稍后重试。";
  }
}

onMounted(() => {
  if (isPlaybackMode.value) {
    void loadPlaybackMission();
  }
});

function returnToSystem() {
  if (window.opener && !window.opener.closed) {
    window.close();
    return;
  }

  if (isPlaybackMode.value && window.history.length > 1) {
    router.back();
    return;
  }

  router.push("/dashboard");
}
</script>
