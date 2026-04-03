<template>
  <div class="app-container">
    <section class="low-altitude-screen-page">
      <LowAltitudeSceneHost :model="sceneModel">
        <TaskSituationPanel class="low-altitude-screen-page__left" :model="taskPanel" />
        <div class="low-altitude-screen-page__right">
          <DroneOnlinePanel :model="dronePanel" />
          <AlertBroadcastPanel :model="alertPanel" />
        </div>
      </LowAltitudeSceneHost>
    </section>
  </div>
</template>

<script setup lang="ts">
import "./styles.scss";
import LowAltitudeSceneHost from "./components/LowAltitudeSceneHost.vue";
import TaskSituationPanel from "./components/TaskSituationPanel.vue";
import DroneOnlinePanel from "./components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "./components/AlertBroadcastPanel.vue";
import {
  LOW_ALTITUDE_ALERT_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_SCENE_MARKERS,
  LOW_ALTITUDE_SCENE_ROUTES,
  LOW_ALTITUDE_TASK_PANEL,
} from "./static-data";
import { buildSceneModel } from "./scene-model";

defineOptions({ name: "LowAltitudeScreenPage" });

const taskPanel = LOW_ALTITUDE_TASK_PANEL;
const dronePanel = LOW_ALTITUDE_DRONE_PANEL;
const alertPanel = LOW_ALTITUDE_ALERT_PANEL;
const sceneModel = buildSceneModel({
  routes: LOW_ALTITUDE_SCENE_ROUTES,
  markers: LOW_ALTITUDE_SCENE_MARKERS,
  selectedMarkerId: null,
});
</script>
