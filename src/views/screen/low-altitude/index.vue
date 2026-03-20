<template>
  <div ref="screenRef" class="low-altitude-screen command-page">
    <div class="low-altitude-screen__shell">
      <header class="low-altitude-screen__header">
        <div class="low-altitude-screen__header-top">
          <div class="low-altitude-screen__heading">
            <p class="command-page__eyebrow">Low-Altitude Command Screen</p>
            <h1 class="low-altitude-screen__title">低空平台数据大屏</h1>
            <p class="low-altitude-screen__description">
              以 GIS
              底图承载无人机、飞手与航线三类关键资源，保持现有指挥中枢视觉语言，同时把值守所需的核心统计压缩到一屏内完成判读。
            </p>
          </div>

          <div class="low-altitude-screen__meta">
            <div class="low-altitude-screen__clock">{{ currentTime }}</div>
            <div class="low-altitude-screen__meta-row">
              <span class="low-altitude-screen__meta-chip">30 秒自动刷新</span>
              <span class="low-altitude-screen__meta-chip">GIS 底图 / 航线覆盖物</span>
              <span class="low-altitude-screen__meta-chip">{{ refreshText }}</span>
            </div>
            <div class="low-altitude-screen__actions">
              <el-button text class="low-altitude-screen__action-btn" @click="handleRefresh">
                <el-icon><RefreshRight /></el-icon>
                刷新
              </el-button>
              <el-button text class="low-altitude-screen__action-btn" @click="toggleFullscreen">
                <el-icon><FullScreen /></el-icon>
                {{ isFullscreen ? "退出全屏" : "进入全屏" }}
              </el-button>
              <el-button text class="low-altitude-screen__action-btn" @click="goBack">
                <el-icon><ArrowLeft /></el-icon>
                返回首页
              </el-button>
            </div>
          </div>
        </div>

        <div class="low-altitude-screen__hero-metrics">
          <article
            v-for="item in screenState.topMetrics"
            :key="item.label"
            :class="[
              'low-altitude-screen__hero-metric',
              `low-altitude-screen__hero-metric--${item.tone}`,
            ]"
          >
            <div class="low-altitude-screen__hero-metric-label">{{ item.label }}</div>
            <div class="low-altitude-screen__hero-metric-value">{{ item.value }}</div>
            <div class="low-altitude-screen__hero-metric-note">{{ item.note }}</div>
          </article>
        </div>
      </header>

      <main class="low-altitude-screen__layout">
        <aside class="low-altitude-screen__aside low-altitude-screen__aside--left">
          <section class="screen-panel">
            <div class="screen-panel__header">
              <div>
                <p class="screen-panel__eyebrow">Aircraft</p>
                <h2 class="screen-panel__title">无人机统计</h2>
              </div>
            </div>

            <div class="screen-panel__metric-grid">
              <article
                v-for="item in screenState.droneMetrics"
                :key="item.label"
                :class="['screen-panel__metric-card', `screen-panel__metric-card--${item.tone}`]"
              >
                <div class="screen-panel__metric-label">{{ item.label }}</div>
                <div class="screen-panel__metric-value">{{ item.value }}</div>
                <div class="screen-panel__metric-note">{{ item.note }}</div>
              </article>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">组织分布</div>
              <div class="screen-panel__pill-list">
                <span
                  v-for="item in screenState.droneBreakdown"
                  :key="item.label"
                  class="screen-panel__pill"
                >
                  {{ item.label }}
                  <strong>{{ item.value }}</strong>
                </span>
              </div>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">机队编组</div>
              <div class="screen-panel__roster">
                <article
                  v-for="item in screenState.droneRoster"
                  :key="item.id"
                  :class="['screen-panel__roster-item', `screen-panel__roster-item--${item.tone}`]"
                >
                  <div class="screen-panel__roster-head">
                    <strong>{{ item.title }}</strong>
                    <span class="screen-panel__status">{{ item.status }}</span>
                  </div>
                  <div class="screen-panel__roster-subtitle">{{ item.subtitle }}</div>
                  <div class="screen-panel__roster-meta">{{ item.meta }}</div>
                </article>
              </div>
            </div>
          </section>

          <section class="screen-panel">
            <div class="screen-panel__header">
              <div>
                <p class="screen-panel__eyebrow">Pilot</p>
                <h2 class="screen-panel__title">飞手统计</h2>
              </div>
            </div>

            <div class="screen-panel__metric-grid">
              <article
                v-for="item in screenState.pilotMetrics"
                :key="item.label"
                :class="['screen-panel__metric-card', `screen-panel__metric-card--${item.tone}`]"
              >
                <div class="screen-panel__metric-label">{{ item.label }}</div>
                <div class="screen-panel__metric-value">{{ item.value }}</div>
                <div class="screen-panel__metric-note">{{ item.note }}</div>
              </article>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">值守组织</div>
              <div class="screen-panel__pill-list">
                <span
                  v-for="item in screenState.pilotBreakdown"
                  :key="item.label"
                  class="screen-panel__pill"
                >
                  {{ item.label }}
                  <strong>{{ item.value }}</strong>
                </span>
              </div>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">飞手编组</div>
              <div class="screen-panel__roster">
                <article
                  v-for="item in screenState.pilotRoster"
                  :key="item.id"
                  :class="['screen-panel__roster-item', `screen-panel__roster-item--${item.tone}`]"
                >
                  <div class="screen-panel__roster-head">
                    <strong>{{ item.title }}</strong>
                    <span class="screen-panel__status">{{ item.status }}</span>
                  </div>
                  <div class="screen-panel__roster-subtitle">{{ item.subtitle }}</div>
                  <div class="screen-panel__roster-meta">{{ item.meta }}</div>
                </article>
              </div>
            </div>
          </section>
        </aside>

        <section class="low-altitude-screen__map-stage">
          <div class="low-altitude-screen__map-toolbar">
            <div class="low-altitude-screen__map-toolbar-main">
              <span class="low-altitude-screen__map-tag">GIS 底图</span>
              <span class="low-altitude-screen__map-summary">
                已渲染 {{ screenState.routeOverlays.length }} 条持久化航线
              </span>
            </div>

            <div class="low-altitude-screen__map-switch">
              <button
                v-for="item in baseMapModes"
                :key="item.value"
                type="button"
                :class="[
                  'low-altitude-screen__map-switch-btn',
                  { 'is-active': baseMapMode === item.value },
                ]"
                @click="baseMapMode = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <LowAltitudeGisMap
            class="low-altitude-screen__map"
            :overlays="screenState.routeOverlays"
            :base-map-mode="baseMapMode"
          />
        </section>

        <aside class="low-altitude-screen__aside low-altitude-screen__aside--right">
          <section class="screen-panel">
            <div class="screen-panel__header">
              <div>
                <p class="screen-panel__eyebrow">Route</p>
                <h2 class="screen-panel__title">航线统计</h2>
              </div>
            </div>

            <div class="screen-panel__metric-grid">
              <article
                v-for="item in screenState.routeMetrics"
                :key="item.label"
                :class="['screen-panel__metric-card', `screen-panel__metric-card--${item.tone}`]"
              >
                <div class="screen-panel__metric-label">{{ item.label }}</div>
                <div class="screen-panel__metric-value">{{ item.value }}</div>
                <div class="screen-panel__metric-note">{{ item.note }}</div>
              </article>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">累计摘要</div>
              <div class="screen-panel__summary-grid">
                <div
                  v-for="item in screenState.routeSummary"
                  :key="item.label"
                  class="screen-panel__summary-card"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                </div>
              </div>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">图例</div>
              <div class="screen-panel__legend">
                <span
                  v-for="item in screenState.routeLegend"
                  :key="item.label"
                  class="screen-panel__legend-item"
                >
                  <i :style="{ backgroundColor: item.color }" />
                  {{ item.label }}
                </span>
              </div>
            </div>

            <div class="screen-panel__section">
              <div class="screen-panel__section-title">重点航线</div>
              <div class="screen-panel__route-list">
                <article
                  v-for="item in screenState.routeHighlights"
                  :key="item.id"
                  class="screen-panel__route-item"
                >
                  <div class="screen-panel__route-head">
                    <strong>{{ item.routeName }}</strong>
                    <span :style="{ color: item.color }">{{ item.routeTypeLabel }}</span>
                  </div>
                  <div class="screen-panel__route-meta">{{ item.department }}</div>
                  <div class="screen-panel__route-meta">{{ item.metricsLabel }}</div>
                </article>
              </div>
            </div>
          </section>

          <section class="screen-panel screen-panel--compact">
            <div class="screen-panel__header">
              <div>
                <p class="screen-panel__eyebrow">Screen Notes</p>
                <h2 class="screen-panel__title">图层摘要</h2>
              </div>
            </div>

            <div class="screen-panel__notes">
              <p>大屏首版仅展示无人机、飞手与已持久化航线三类核心数据，不渲染草稿航线。</p>
              <p>
                地图首屏会自动适配到当前持久化航线范围；若无航线，则回退到航线规划模块默认中心点。
              </p>
              <p>飞手数据当前不上图，继续在侧栏中以值守编组方式呈现。</p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, FullScreen, RefreshRight } from "@element-plus/icons-vue";

import { buildDroneMockData, buildPilotMockData } from "@/views/resource/shared/mock-data";
import { loadPersistedRouteRecords } from "@/views/route/storage";
import type { BaseMapMode } from "@/views/route/types";
import LowAltitudeGisMap from "./LowAltitudeGisMap.vue";
import { buildLowAltitudeScreenState, type LowAltitudeScreenState } from "./screen-state";

defineOptions({
  name: "LowAltitudeScreen",
  inheritAttrs: false,
});

const router = useRouter();
const screenRef = ref<HTMLElement | null>(null);
const baseMapMode = ref<BaseMapMode>("satellite");
const isFullscreen = ref(false);
const currentTime = ref("");
const lastRefreshTime = ref("");
const screenState = ref<LowAltitudeScreenState>(
  buildLowAltitudeScreenState({
    drones: buildDroneMockData(),
    pilots: buildPilotMockData(),
    routes: loadPersistedRouteRecords(),
  })
);

const baseMapModes = [
  { label: "标准", value: "standard" },
  { label: "卫星", value: "satellite" },
  { label: "地形", value: "terrain" },
] as const;

const refreshText = computed(() =>
  lastRefreshTime.value ? `上次刷新 ${lastRefreshTime.value}` : "等待首屏刷新"
);

let refreshTimer: number | null = null;
let clockTimer: number | null = null;

function refreshScreenState() {
  screenState.value = buildLowAltitudeScreenState({
    drones: buildDroneMockData(),
    pilots: buildPilotMockData(),
    routes: loadPersistedRouteRecords(),
  });
  lastRefreshTime.value = currentTime.value;
}

function formatNow(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}

function syncClock() {
  currentTime.value = formatNow(new Date());
}

function syncFullscreen() {
  isFullscreen.value = Boolean(document.fullscreenElement);
}

async function toggleFullscreen() {
  if (!screenRef.value) {
    return;
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await screenRef.value.requestFullscreen?.();
    }
  } catch {
    // Ignore fullscreen failures in environments without permission or support.
  } finally {
    syncFullscreen();
  }
}

function handleRefresh() {
  syncClock();
  refreshScreenState();
}

function goBack() {
  router.push("/dashboard");
}

onMounted(() => {
  syncClock();
  refreshScreenState();
  syncFullscreen();
  document.addEventListener("fullscreenchange", syncFullscreen);

  clockTimer = window.setInterval(syncClock, 1000);
  refreshTimer = window.setInterval(refreshScreenState, 30000);
});

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", syncFullscreen);

  if (clockTimer) {
    window.clearInterval(clockTimer);
  }

  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }
});
</script>

<style scoped lang="scss">
.low-altitude-screen {
  --screen-bg: #06101a;
  --screen-panel-bg: rgba(8, 19, 31, 0.82);
  --screen-panel-border: rgba(103, 182, 255, 0.14);
  --screen-text-main: #eef6ff;
  --screen-text-subtle: rgba(214, 229, 247, 0.7);
  --screen-accent: #72b8ff;
  --screen-emerald: #71d7b8;
  --screen-gold: #f0c96a;
  --screen-danger: #ee8c7d;

  position: relative;
  min-height: 100vh;
  padding: 18px;
  overflow: hidden;
  color: var(--screen-text-main);
  background:
    radial-gradient(circle at top left, rgba(44, 104, 180, 0.2), transparent 26%),
    radial-gradient(circle at 85% 12%, rgba(22, 133, 148, 0.18), transparent 24%),
    linear-gradient(180deg, #07111b 0%, #040b13 100%);

  &::before,
  &::after {
    position: absolute;
    pointer-events: none;
    content: "";
  }

  &::before {
    inset: 10px;
    border: 1px solid rgba(103, 182, 255, 0.08);
    border-radius: 28px;
  }

  &::after {
    inset: 0;
    background:
      linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.035) 0,
        rgba(255, 255, 255, 0.035) 1px,
        transparent 1px,
        transparent 96px
      ),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.03) 0,
        rgba(255, 255, 255, 0.03) 1px,
        transparent 1px,
        transparent 96px
      );
    opacity: 0.12;
  }
}

.low-altitude-screen__shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 36px);
}

.low-altitude-screen__header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px 18px;
  background: linear-gradient(180deg, rgba(13, 28, 44, 0.9), rgba(6, 15, 25, 0.76));
  border: 1px solid var(--screen-panel-border);
  border-radius: 30px;
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(18px);
}

.low-altitude-screen__header-top {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
}

.low-altitude-screen__heading {
  max-width: 70ch;
}

.low-altitude-screen__title {
  margin: 0;
  font-family: var(--command-font-display);
  font-size: clamp(2rem, 2.9vw, 3rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.low-altitude-screen__description {
  max-width: 72ch;
  margin: 12px 0 0;
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--screen-text-subtle);
}

.low-altitude-screen__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  min-width: 360px;
}

.low-altitude-screen__clock {
  font-family: var(--command-font-display);
  font-size: clamp(1.15rem, 1.5vw, 1.45rem);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.low-altitude-screen__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.low-altitude-screen__meta-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(221, 235, 252, 0.82);
  letter-spacing: 0.04em;
  background: rgba(103, 182, 255, 0.08);
  border: 1px solid rgba(103, 182, 255, 0.14);
  border-radius: 999px;
}

.low-altitude-screen__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.low-altitude-screen__action-btn {
  color: rgba(236, 244, 255, 0.84);
  background: rgba(103, 182, 255, 0.06);
  border: 1px solid rgba(103, 182, 255, 0.14);
  border-radius: 999px;

  &:hover {
    color: #fff;
    background: rgba(103, 182, 255, 0.12);
  }
}

.low-altitude-screen__hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.low-altitude-screen__hero-metric {
  position: relative;
  padding: 16px 18px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;

  &::after {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 9px;
    height: 9px;
    content: "";
    background: rgba(255, 255, 255, 0.26);
    border-radius: 50%;
  }

  &--accent {
    border-color: rgba(114, 184, 255, 0.26);
  }

  &--warning {
    border-color: rgba(240, 201, 106, 0.26);
  }
}

.low-altitude-screen__hero-metric-label,
.screen-panel__metric-label {
  font-size: 0.76rem;
  font-weight: 600;
  color: rgba(214, 229, 247, 0.68);
  letter-spacing: 0.08em;
}

.low-altitude-screen__hero-metric-value,
.screen-panel__metric-value {
  margin-top: 10px;
  font-family: var(--command-font-display);
  font-size: clamp(1.9rem, 2vw, 2.35rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.04em;
}

.low-altitude-screen__hero-metric-note,
.screen-panel__metric-note {
  margin-top: 9px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--screen-text-subtle);
}

.low-altitude-screen__layout {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(300px, 340px) minmax(0, 1fr) minmax(320px, 380px);
  gap: 16px;
  min-height: 0;
}

.low-altitude-screen__aside {
  display: grid;
  gap: 16px;
  min-height: 0;
}

.low-altitude-screen__aside--left {
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.low-altitude-screen__aside--right {
  grid-template-rows: minmax(0, 1fr) auto;
}

.low-altitude-screen__map-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.low-altitude-screen__map-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(7, 17, 29, 0.76);
  border: 1px solid var(--screen-panel-border);
  border-radius: 20px;
  backdrop-filter: blur(16px);
}

.low-altitude-screen__map-toolbar-main {
  display: flex;
  gap: 10px;
  align-items: center;
}

.low-altitude-screen__map-tag {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--screen-accent);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: rgba(103, 182, 255, 0.08);
  border-radius: 999px;
}

.low-altitude-screen__map-summary {
  font-size: 0.8125rem;
  color: var(--screen-text-subtle);
}

.low-altitude-screen__map-switch {
  display: inline-flex;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(103, 182, 255, 0.1);
  border-radius: 999px;
}

.low-altitude-screen__map-switch-btn {
  min-width: 74px;
  height: 32px;
  padding: 0 14px;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(214, 229, 247, 0.72);
  letter-spacing: 0.04em;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 999px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;

  &.is-active {
    color: #fff;
    background: linear-gradient(135deg, rgba(62, 126, 214, 0.82), rgba(22, 147, 150, 0.82));
  }
}

.low-altitude-screen__map {
  flex: 1;
  min-height: 0;
}

.screen-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 18px 18px 16px;
  background: var(--screen-panel-bg);
  border: 1px solid var(--screen-panel-border);
  border-radius: 26px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(18px);
}

.screen-panel--compact {
  gap: 12px;
}

.screen-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.screen-panel__eyebrow {
  margin: 0 0 8px;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(214, 229, 247, 0.62);
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.screen-panel__title {
  margin: 0;
  font-family: var(--command-font-display);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.screen-panel__metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.screen-panel__metric-card {
  padding: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;

  &--accent {
    border-color: rgba(114, 184, 255, 0.18);
  }

  &--warning {
    border-color: rgba(240, 201, 106, 0.18);
  }

  &--danger {
    border-color: rgba(238, 140, 125, 0.18);
  }
}

.screen-panel__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.screen-panel__section-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: rgba(214, 229, 247, 0.62);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.screen-panel__pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.screen-panel__pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  font-size: 0.78rem;
  color: rgba(214, 229, 247, 0.78);
  background: rgba(103, 182, 255, 0.06);
  border: 1px solid rgba(103, 182, 255, 0.1);
  border-radius: 999px;

  strong {
    font-family: var(--command-font-display);
    color: #fff;
  }
}

.screen-panel__roster,
.screen-panel__route-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.screen-panel__roster-item,
.screen-panel__route-item {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
}

.screen-panel__roster-item--accent {
  border-color: rgba(114, 184, 255, 0.18);
}

.screen-panel__roster-item--warning {
  border-color: rgba(240, 201, 106, 0.18);
}

.screen-panel__roster-item--danger {
  border-color: rgba(238, 140, 125, 0.18);
}

.screen-panel__roster-head,
.screen-panel__route-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;

  strong {
    font-size: 0.95rem;
    font-weight: 650;
    line-height: 1.45;
  }
}

.screen-panel__status {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(214, 229, 247, 0.64);
  letter-spacing: 0.08em;
}

.screen-panel__roster-subtitle,
.screen-panel__route-meta,
.screen-panel__roster-meta,
.screen-panel__notes p {
  font-size: 0.8125rem;
  line-height: 1.65;
  color: var(--screen-text-subtle);
}

.screen-panel__roster-subtitle,
.screen-panel__route-meta {
  margin-top: 6px;
}

.screen-panel__roster-meta {
  margin-top: 4px;
}

.screen-panel__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.screen-panel__summary-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: baseline;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;

  span,
  em {
    font-size: 0.78rem;
    color: var(--screen-text-subtle);
  }

  strong {
    font-family: var(--command-font-display);
    font-size: 1.4rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  em {
    font-style: normal;
  }
}

.screen-panel__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.screen-panel__legend-item {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8125rem;
  color: rgba(214, 229, 247, 0.78);

  i {
    display: block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.04);
  }
}

.screen-panel__notes {
  display: flex;
  flex-direction: column;
  gap: 10px;

  p {
    margin: 0;
  }
}

@media (max-width: 1480px) {
  .low-altitude-screen__layout {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr) minmax(280px, 330px);
  }
}

@media (max-width: 1280px) {
  .low-altitude-screen {
    overflow: auto;
  }

  .low-altitude-screen__shell {
    min-height: auto;
  }

  .low-altitude-screen__header-top {
    flex-direction: column;
  }

  .low-altitude-screen__meta {
    align-items: flex-start;
    min-width: 0;
  }

  .low-altitude-screen__meta-row,
  .low-altitude-screen__actions {
    justify-content: flex-start;
  }

  .low-altitude-screen__hero-metrics,
  .low-altitude-screen__layout {
    grid-template-columns: 1fr;
  }

  .low-altitude-screen__aside--left,
  .low-altitude-screen__aside--right {
    grid-template-rows: none;
  }

  .low-altitude-screen__map {
    min-height: 520px;
  }
}

@media (max-width: 1024px) {
  .low-altitude-screen {
    padding: 14px;
  }

  .low-altitude-screen__header,
  .screen-panel {
    border-radius: 22px;
  }

  .screen-panel__metric-grid,
  .screen-panel__summary-grid {
    grid-template-columns: 1fr;
  }

  .low-altitude-screen__map-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
