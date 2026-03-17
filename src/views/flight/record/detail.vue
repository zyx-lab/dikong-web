<template>
  <div class="app-container flight-record-detail-page">
    <template v-if="record">
      <el-row :gutter="20">
        <el-col :lg="6" :xs="24" class="mb-[12px]">
          <InfoPanel title="飞行轨迹" class="detail-panel" body-class="detail-panel__body">
            <div class="map-panel" :style="{ background: record.mapTheme }">
              <div class="map-panel__grid" />
              <div class="map-panel__route">
                <span class="route-path route-path--main" />
                <span class="route-path route-path--branch" />
                <span class="route-drone" :style="droneMarkerStyle" />
              </div>
              <div class="map-panel__badge">{{ record.locationLabel }}</div>
              <div class="map-panel__switches">
                <el-tag size="small" effect="dark">卫星地图</el-tag>
                <el-tag size="small" effect="plain">标准地图</el-tag>
                <el-tag size="small" effect="plain">地形图</el-tag>
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
                  <el-tag effect="dark">{{ record.droneName }}</el-tag>
                  <el-tag effect="dark">{{ record.batteryPercent }}%</el-tag>
                </div>

                <div class="video-stage__placeholder">
                  <div class="video-stage__terrain video-stage__terrain--far" />
                  <div class="video-stage__terrain video-stage__terrain--mid" />
                  <div class="video-stage__terrain video-stage__terrain--near" />
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VideoPause, VideoPlay } from "@element-plus/icons-vue";
import InfoPanel from "@/components/InfoPanel.vue";
import { getFlightRecordById } from "@/views/flight/record/data";

defineOptions({
  name: "FlightRecordDetail",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

const currentTime = ref(0);
const isPlaying = ref(false);
let playbackTimer: ReturnType<typeof setInterval> | undefined;

const recordId = computed(() => Number(route.params.id));
const record = computed(() => getFlightRecordById(recordId.value));

const maxTime = computed(() => {
  if (!record.value?.telemetry.length) return 0;
  return record.value.telemetry[record.value.telemetry.length - 1].time;
});

const currentTelemetry = computed(() => {
  if (!record.value) {
    return { altitude: 0, speed: 0, time: 0 };
  }

  const points = record.value.telemetry;
  if (points.length === 1 || currentTime.value <= points[0].time) {
    return points[0];
  }

  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const next = points[index];
    if (currentTime.value <= next.time) {
      const range = next.time - prev.time || 1;
      const ratio = (currentTime.value - prev.time) / range;
      return {
        time: currentTime.value,
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

const droneMarkerStyle = computed(() => ({
  left: `${18 + videoProgressPercent.value * 0.58}%`,
  top: `${56 - Math.min(currentAltitude.value / 8, 28)}%`,
}));

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
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
  if (!record.value?.telemetry.length || maxTime.value === 0) return "";

  return record.value.telemetry
    .map((item) => {
      const x = 40 + (item.time / maxTime.value) * 780;
      const y = type === "altitude" ? getAltitudeY(item.altitude) : getSpeedY(item.speed);
      return `${x},${y}`;
    })
    .join(" ");
}

function stopPlayback(): void {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = undefined;
  }
  isPlaying.value = false;
}

function startPlayback(): void {
  if (!record.value) return;

  stopPlayback();
  isPlaying.value = true;
  playbackTimer = setInterval(() => {
    if (currentTime.value >= maxTime.value) {
      stopPlayback();
      return;
    }
    currentTime.value = Math.min(currentTime.value + 1, maxTime.value);
  }, 1000);
}

function togglePlayback(): void {
  if (isPlaying.value) {
    stopPlayback();
    return;
  }

  if (currentTime.value >= maxTime.value) {
    currentTime.value = 0;
  }

  startPlayback();
}

function handleSliderInput(): void {
  if (currentTime.value >= maxTime.value) {
    stopPlayback();
  }
}

watch(
  () => recordId.value,
  () => {
    stopPlayback();
    currentTime.value = 0;
  },
  { immediate: true }
);

onMounted(() => {
  currentTime.value = Math.min(181, maxTime.value);
});

onBeforeUnmount(() => {
  stopPlayback();
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

.map-panel__grid {
  position: absolute;
  inset: 14px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 44px 44px;
}

.map-panel__route {
  position: absolute;
  inset: 0;
}

.route-path {
  position: absolute;
  background: rgba(81, 244, 243, 0.18);
  border: 1px solid rgba(81, 244, 243, 0.72);
  clip-path: polygon(0 50%, 100% 0, 100% 100%);
}

.route-path--main {
  top: 142px;
  left: 132px;
  width: 94px;
  height: 88px;
}

.route-path--branch {
  top: 180px;
  left: 132px;
  width: 72px;
  height: 58px;
  transform: rotate(-18deg);
}

.route-drone {
  position: absolute;
  width: 16px;
  height: 16px;
  background: var(--el-color-primary);
  clip-path: polygon(50% 0, 100% 100%, 50% 72%, 0 100%);
  transition:
    left 0.35s linear,
    top 0.35s ease-out;
}

.map-panel__badge {
  position: absolute;
  bottom: 52px;
  left: 16px;
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

.video-stage__placeholder {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 36%),
    linear-gradient(180deg, rgba(49, 56, 67, 0.8), rgba(34, 40, 48, 0.95));
}

.video-stage__terrain {
  position: absolute;
  inset-inline: 0;
  transform-origin: center;
}

.video-stage__terrain--far {
  top: 16%;
  height: 18%;
  background:
    linear-gradient(180deg, rgba(87, 88, 75, 0.55), rgba(67, 69, 58, 0.82)),
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(24, 26, 21, 0.18) 46px 48px);
  transform: perspective(900px) rotateX(66deg);
}

.video-stage__terrain--mid {
  top: 42%;
  height: 20%;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(117, 108, 87, 0.62) 0 22px,
      rgba(70, 65, 53, 0.42) 22px 28px
    ),
    linear-gradient(180deg, rgba(126, 115, 92, 0.58), rgba(89, 79, 62, 0.88));
  transform: perspective(900px) rotateX(72deg);
}

.video-stage__terrain--near {
  bottom: -3%;
  height: 34%;
  background:
    linear-gradient(180deg, rgba(129, 111, 80, 0.28), rgba(87, 73, 50, 0.92)),
    repeating-linear-gradient(90deg, transparent 0 68px, rgba(255, 255, 255, 0.04) 68px 70px);
  transform: perspective(760px) rotateX(74deg);
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
