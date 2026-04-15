<template>
  <div ref="hostRef" class="low-altitude-scene-host">
    <div ref="mapRef" class="low-altitude-scene-host__map" />

    <div v-if="sceneStatus !== 'ready'" class="low-altitude-scene-host__status">
      <div class="low-altitude-scene-host__status-card">
        <div class="low-altitude-scene-host__status-title">
          {{
            sceneStatus === "loading"
              ? "Cesium + 3DGS 场景加载中"
              : sceneStatus === "unsupported"
                ? "当前环境不支持 Cesium + 3DGS 场景"
                : "Cesium + 3DGS 场景加载失败"
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
  type DashboardSceneStatus,
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
  sceneEnabled?: boolean;
  sceneOptions?: DashboardSceneMountOptions;
}>();

const emit = defineEmits<{
  (
    event: "scene-status-change",
    payload: {
      status: "loading" | DashboardSceneStatus;
      errorMessage: string;
    }
  ): void;
}>();

const hostRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<HTMLDivElement | null>(null);
const runtimeRef = shallowRef<DashboardSceneRuntime | null>(null);
const selectedMarkerId = ref<string | null>(props.model.selectedMarkerId);
const sceneStatus = ref<"loading" | DashboardSceneRuntime["status"]>("loading");
const sceneErrorMessage = ref("正在初始化 Cesium 主场景并挂载 3DGS 覆盖层...");
const DEFAULT_LOADING_MESSAGE = sceneErrorMessage.value;
const handleResize = () => runtimeRef.value?.resize();
let resizeObserver: ResizeObserver | undefined;
let mountPromise: Promise<void> | null = null;

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

function applySceneStatus(status: "loading" | DashboardSceneRuntime["status"], errorMessage = "") {
  sceneStatus.value = status;
  sceneErrorMessage.value = errorMessage;
  emit("scene-status-change", {
    status,
    errorMessage,
  });
}

function destroyRuntime() {
  runtimeRef.value?.destroy();
  runtimeRef.value = null;
}

async function ensureSceneMounted() {
  if (!mapRef.value || props.sceneEnabled === false || runtimeRef.value || mountPromise) {
    return;
  }

  applySceneStatus("loading", DEFAULT_LOADING_MESSAGE);
  mountPromise = (async () => {
    const runtime = await mountDashboardScene(
      mapRef.value as HTMLElement,
      props.sceneConfig,
      props.sceneOptions
    );
    if (props.sceneEnabled === false) {
      runtime.destroy();
      return;
    }

    runtimeRef.value = runtime;
    applySceneStatus(runtime.status, runtime.errorMessage);
  })().finally(() => {
    mountPromise = null;
  });

  await mountPromise;
}

watch(
  () => props.model,
  () => {
    selectedMarkerId.value = props.model.selectedMarkerId;
    syncModel();
  },
  { deep: true }
);

watch(
  () => props.sceneConfig,
  (nextConfig) => {
    runtimeRef.value?.updateConfig(nextConfig);
  },
  { deep: true }
);

watch(
  () => props.sceneEnabled,
  (enabled) => {
    if (enabled === false) {
      destroyRuntime();
      applySceneStatus("loading", DEFAULT_LOADING_MESSAGE);
      return;
    }

    void ensureSceneMounted();
  }
);

onMounted(async () => {
  await nextTick();
  if (props.sceneEnabled !== false) {
    await ensureSceneMounted();
  } else {
    applySceneStatus("loading", DEFAULT_LOADING_MESSAGE);
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
  destroyRuntime();
});
</script>
