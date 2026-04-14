<template>
  <div ref="hostRef" class="low-altitude-scene-host">
    <canvas ref="canvasRef" class="low-altitude-scene-host__canvas" />

    <div v-if="sceneStatus !== 'ready'" class="low-altitude-scene-host__status">
      <div class="low-altitude-scene-host__status-card">
        <div class="low-altitude-scene-host__status-title">
          {{
            sceneStatus === "loading"
              ? "3DGS 场景加载中"
              : sceneStatus === "unsupported"
                ? "当前环境不支持 3DGS 场景"
                : "3DGS 场景加载失败"
          }}
        </div>
        <div class="low-altitude-scene-host__status-text">{{ sceneErrorMessage }}</div>
      </div>
    </div>

    <svg
      v-if="model.routes.length"
      class="low-altitude-scene-host__overlay"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        v-for="route in model.routes"
        :key="route.id"
        :points="route.points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')"
        class="low-altitude-scene-host__route"
      />
    </svg>

    <button
      v-for="marker in model.markers"
      :key="marker.id"
      type="button"
      class="low-altitude-scene-host__marker"
      :class="[`is-${marker.kind}`, `is-${marker.tone}`, { 'is-expanded': marker.expanded }]"
      :style="{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }"
      @click="toggleMarker(marker.id)"
    >
      <span v-if="marker.expanded" class="low-altitude-scene-host__label">{{ marker.label }}</span>
    </button>

    <div class="low-altitude-scene-host__slot">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import {
  mountDashboardScene,
  type DashboardSceneMountOptions,
  type DashboardSceneRuntime,
} from "../scene/runtime";
import { buildSceneModel } from "../scene-model";
import type { LowAltitudeSceneConfig, SceneMarker, SceneRouteLine } from "../types";

interface SceneDisplayModel {
  routes: SceneRouteLine[];
  markers: Array<SceneMarker & { expanded: boolean }>;
  selectedMarkerId: string | null;
}

const props = defineProps<{
  model: SceneDisplayModel;
  sceneConfig: LowAltitudeSceneConfig;
  sceneOptions?: DashboardSceneMountOptions;
}>();

const hostRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const runtimeRef = shallowRef<DashboardSceneRuntime | null>(null);
const selectedMarkerId = ref<string | null>(props.model.selectedMarkerId);
const sceneStatus = ref<"loading" | DashboardSceneRuntime["status"]>("loading");
const sceneErrorMessage = ref("正在初始化 Spark 渲染器并加载 3DGS 资源...");
const handleResize = () => runtimeRef.value?.resize();
let resizeObserver: ResizeObserver | undefined;

const model = ref(buildSceneModel(props.model));

function syncModel() {
  model.value = buildSceneModel({
    routes: props.model.routes,
    markers: props.model.markers,
    selectedMarkerId: selectedMarkerId.value,
  });
}

function toggleMarker(markerId: string) {
  selectedMarkerId.value = selectedMarkerId.value === markerId ? null : markerId;
  syncModel();
}

watch(
  () => props.model,
  () => {
    selectedMarkerId.value = props.model.selectedMarkerId;
    syncModel();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  if (canvasRef.value) {
    runtimeRef.value = await mountDashboardScene(
      canvasRef.value,
      props.sceneConfig,
      props.sceneOptions
    );
    sceneStatus.value = runtimeRef.value.status;
    sceneErrorMessage.value = runtimeRef.value.errorMessage;
  }
  if (hostRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(hostRef.value);
  }
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  window.removeEventListener("resize", handleResize);
  runtimeRef.value?.destroy();
});
</script>
