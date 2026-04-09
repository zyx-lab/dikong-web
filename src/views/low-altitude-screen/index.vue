<template>
  <section ref="screenRef" class="low-altitude-screen-page">
    <LowAltitudeSceneHost :model="sceneModel" :scene-config="sceneConfig">
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
              <span class="screen-weather__main">8-27℃ 晴转多云</span>
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
import { ref } from "vue";
import { useDateFormat, useFullscreen, useNow } from "@vueuse/core";
import "./styles.scss";
import LowAltitudeSceneHost from "./components/LowAltitudeSceneHost.vue";
import TaskSituationPanel from "./components/TaskSituationPanel.vue";
import DroneOnlinePanel from "./components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "./components/AlertBroadcastPanel.vue";
import FlightClosurePanel from "./components/FlightClosurePanel.vue";
import {
  LOW_ALTITUDE_ALERT_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_FLIGHT_PANEL,
  LOW_ALTITUDE_SCENE_CONFIG,
  LOW_ALTITUDE_TASK_PANEL,
} from "./static-data";
import { buildSceneModel } from "./scene-model";
import router from "@/router";

defineOptions({ name: "LowAltitudeScreenPage" });

const screenRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(screenRef);
const now = useNow({ interval: 1000 });
const currentTimestamp = useDateFormat(now, "YYYY.MM.DD HH:mm:ss");

const taskPanel = LOW_ALTITUDE_TASK_PANEL;
const dronePanel = LOW_ALTITUDE_DRONE_PANEL;
const alertPanel = LOW_ALTITUDE_ALERT_PANEL;
const flightPanel = LOW_ALTITUDE_FLIGHT_PANEL;
const sceneConfig = LOW_ALTITUDE_SCENE_CONFIG;
const sceneModel = buildSceneModel({
  routes: [],
  markers: [],
  selectedMarkerId: null,
});

function returnToSystem() {
  if (window.opener && !window.opener.closed) {
    window.close();
    return;
  }

  router.push("/dashboard");
}
</script>
