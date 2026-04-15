<template>
  <section ref="screenRef" class="low-altitude-screen-page">
    <LowAltitudeSceneHost
      :model="sceneModel"
      :scene-config="sceneConfig"
      :scene-options="sceneOptions"
    >
      <div class="dashboard-stage">
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
                    {{ windPanelExpanded ? "▲" : "▼" }}
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
import { computed, ref } from "vue";
import { useDateFormat, useFullscreen, useNow } from "@vueuse/core";
import "./styles.scss";
import LowAltitudeSceneHost from "./components/LowAltitudeSceneHost.vue";
import TaskSituationPanel from "./components/TaskSituationPanel.vue";
import DroneOnlinePanel from "./components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "./components/AlertBroadcastPanel.vue";
import FlightClosurePanel from "./components/FlightClosurePanel.vue";
import WindFieldPanel from "./components/WindFieldPanel.vue";
import SceneCalibrationPanel from "./components/SceneCalibrationPanel.vue";
import {
  LOW_ALTITUDE_ALERT_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_FLIGHT_PANEL,
  LOW_ALTITUDE_SCENE_CONFIG,
  LOW_ALTITUDE_TASK_PANEL,
} from "./static-data";
import { buildSceneModel } from "./scene-model";
import {
  buildWindLegendStops,
  createWindFieldSceneExtension,
  type WindFieldStatus,
  type WindLegendStop,
  type WindRenderMode,
} from "./scene/wind-field";
import { cloneSceneSplatPlacement } from "./scene/geospatial";
import type { LowAltitudeSceneConfig, SceneHomeViewConfig } from "./types";
import router from "@/router";

defineOptions({ name: "LowAltitudeScreenPage" });

function shouldEnableCalibrationPanel() {
  return (
    LOW_ALTITUDE_SCENE_CONFIG.showCalibrationPanel ||
    window.location.hash.includes("calibrate=1") ||
    window.location.search.includes("calibrate=1")
  );
}

const screenRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(screenRef);
const now = useNow({ interval: 1000 });
const currentTimestamp = useDateFormat(now, "YYYY.MM.DD HH:mm:ss");

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
const sceneModel = buildSceneModel({
  routes: [],
  markers: [],
  selectedMarkerId: null,
});

const sceneConfig = computed<LowAltitudeSceneConfig>(() => ({
  ...LOW_ALTITUDE_SCENE_CONFIG,
  splatPlacement: cloneSceneSplatPlacement(scenePlacement.value),
  showCalibrationPanel: shouldEnableCalibrationPanel(),
}));

const sceneOptions = {
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

function returnToSystem() {
  if (window.opener && !window.opener.closed) {
    window.close();
    return;
  }

  router.push("/dashboard");
}
</script>
