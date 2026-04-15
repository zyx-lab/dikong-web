<template>
  <section class="panel-block wind-field-panel">
    <div class="panel-heading">
      <span class="panel-heading__dot"></span>
      <h3>风场监测</h3>
    </div>

    <div class="wind-field-panel__body">
      <div class="wind-field-panel__header">
        <div>
          <div class="wind-field-panel__eyebrow">实时分层风廓线</div>
          <div class="wind-field-panel__time">{{ currentTimeText }}</div>
        </div>
        <span :class="['status-pill', `is-${statusTone}`]">{{ statusText }}</span>
      </div>

      <div class="wind-field-panel__meta">
        <span>仰角 {{ beamElevationText }}</span>
        <span>{{ layerCount }} layers</span>
      </div>

      <div class="wind-field-panel__controls">
        <button
          type="button"
          class="wind-toggle"
          :class="{ 'is-active': visible }"
          @click="$emit('toggleVisible')"
        >
          {{ visible ? "隐藏风场" : "显示风场" }}
        </button>

        <button
          type="button"
          class="wind-toggle"
          :class="{ 'is-active': renderMode === 'arrow' }"
          @click="$emit('setRenderMode', 'arrow')"
        >
          箭头
        </button>

        <button
          type="button"
          class="wind-toggle"
          :class="{ 'is-active': renderMode === 'particle' }"
          @click="$emit('setRenderMode', 'particle')"
        >
          粒子
        </button>

        <button
          type="button"
          class="wind-toggle"
          :class="{ 'is-active': showVerticalAirflow }"
          @click="$emit('toggleVerticalAirflow')"
        >
          垂直气流
        </button>
      </div>

      <p class="wind-field-panel__hint">
        {{
          status === "error"
            ? errorMessage
            : "风场会按真实高度比例叠加到 3DGS 覆盖层，并通过 JNU.obj 的深度代理参与遮挡。"
        }}
      </p>

      <div v-if="legendStops.length" class="wind-field-panel__legend">
        <div class="wind-field-panel__legend-title">颜色与水平风速对应</div>
        <div class="wind-field-panel__legend-content">
          <div class="wind-field-panel__legend-bar" :style="{ background: legendGradient }" />
          <div class="wind-field-panel__legend-list">
            <div
              v-for="item in legendStops"
              :key="item.label"
              class="wind-field-panel__legend-item"
            >
              <span class="wind-field-panel__legend-swatch" :style="{ background: item.color }" />
              <span class="wind-field-panel__legend-label">{{ item.label }}</span>
              <span class="wind-field-panel__legend-value">{{ item.valueText }} m/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WindFieldStatus, WindLegendStop, WindRenderMode } from "../scene/wind-field";

const props = defineProps<{
  beamElevationDeg?: number;
  currentTimeText: string;
  errorMessage: string;
  layerCount: number;
  legendStops: WindLegendStop[];
  renderMode: WindRenderMode;
  showVerticalAirflow: boolean;
  status: WindFieldStatus;
  visible: boolean;
}>();

defineEmits<{
  setRenderMode: [value: WindRenderMode];
  toggleVerticalAirflow: [];
  toggleVisible: [];
}>();

const statusText = computed(() => {
  switch (props.status) {
    case "loading":
      return "加载中";
    case "error":
      return "加载失败";
    case "ready":
      return "运行中";
    default:
      return "未就绪";
  }
});

const statusTone = computed(() => {
  switch (props.status) {
    case "ready":
      return "green";
    case "error":
      return "red";
    case "loading":
      return "amber";
    default:
      return "cyan";
  }
});

const beamElevationText = computed(() =>
  typeof props.beamElevationDeg === "number" ? `${props.beamElevationDeg.toFixed(0)}°` : "--"
);

const legendGradient = computed(() => {
  if (!props.legendStops.length) return "none";
  return `linear-gradient(to top, ${props.legendStops.at(-1)?.color ?? "#4ca8ff"} 0%, ${
    props.legendStops[Math.floor(props.legendStops.length / 2)]?.color ?? "#52ffd7"
  } 50%, ${props.legendStops[0]?.color ?? "#ffb36b"} 100%)`;
});
</script>
