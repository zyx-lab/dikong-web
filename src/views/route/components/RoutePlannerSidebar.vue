<template>
  <div class="planner-sidebar">
    <div class="planner-sidebar__head">
      <div class="planner-sidebar__title">
        <div>
          <div class="planner-sidebar__eyebrow">规划面板</div>
          <h3>航线配置</h3>
          <p>{{ draft.routeName }}</p>
        </div>
      </div>
      <Badge variant="outline" class="planner-sidebar__type">
        {{ getRouteTypeLabel(draft.routeType) }}
      </Badge>
    </div>

    <div class="planner-sidebar__stats">
      <div v-for="item in stats" :key="item.label" class="planner-stat">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <el-scrollbar class="planner-sidebar__scroll">
      <section class="config-card">
        <div class="config-card__head">
          <div>
            <h4>
              {{
                draft.routeType === routeTypeEnum.POINT
                  ? "航点列表"
                  : draft.routeType === routeTypeEnum.AREA
                    ? "范围顶点"
                    : "环绕中心"
              }}
            </h4>
            <p>
              <template v-if="draft.routeType === routeTypeEnum.POINT">
                支持逐点配置悬停、拍照与偏航角。
              </template>
              <template v-else-if="draft.routeType === routeTypeEnum.AREA">
                连续两次点击地图即可框选巡检范围。
              </template>
              <template v-else>点击地图或输入经纬度设置兴趣点。</template>
            </p>
          </div>
          <Button variant="ghost" size="sm" @click="emit('clearGeometry')">清空</Button>
        </div>

        <div v-if="draft.routeType === routeTypeEnum.POINT" class="waypoint-list">
          <div v-if="draft.points.length === 0" class="empty-text">
            暂无航点，请点击右侧地图依次添加。
          </div>
          <div v-for="(point, index) in draft.points" :key="point.id" class="waypoint-card">
            <div class="waypoint-card__head">
              <strong>{{ point.name }}</strong>
              <Button
                variant="ghost"
                size="sm"
                class="waypoint-card__delete"
                @click="removeWaypoint(index)"
              >
                删除
              </Button>
            </div>
            <div class="waypoint-card__meta">
              {{ point.lng.toFixed(6) }}, {{ point.lat.toFixed(6) }}
            </div>
            <div class="number-grid">
              <label>
                <span>ALT (m)</span>
                <el-input-number
                  v-model="point.alt"
                  :min="10"
                  :max="500"
                  :step="1"
                  controls-position="right"
                />
              </label>
              <label>
                <span>悬停 (s)</span>
                <el-input-number
                  v-model="point.hoverSeconds"
                  :min="0"
                  :max="120"
                  :step="1"
                  controls-position="right"
                />
              </label>
              <label>
                <span>Pitch</span>
                <el-input-number
                  v-model="point.gimbalPitch"
                  :min="-90"
                  :max="90"
                  :step="1"
                  controls-position="right"
                />
              </label>
              <label>
                <span>偏航角</span>
                <el-input-number
                  v-model="point.yaw"
                  :min="-180"
                  :max="180"
                  :step="1"
                  controls-position="right"
                />
              </label>
            </div>
            <div class="chip-group chip-group--compact">
              <button
                type="button"
                class="option-chip"
                :class="{ 'is-active': point.shootPhoto }"
                @click="point.shootPhoto = !point.shootPhoto"
              >
                拍照
              </button>
              <button
                type="button"
                class="option-chip"
                :class="{ 'is-active': point.startRecord }"
                @click="point.startRecord = !point.startRecord"
              >
                开始录像
              </button>
              <button
                type="button"
                class="option-chip"
                :class="{ 'is-active': point.stopRecord }"
                @click="point.stopRecord = !point.stopRecord"
              >
                停止录像
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="draft.routeType === routeTypeEnum.AREA" class="corner-list">
          <div v-if="draft.points.length === 0" class="empty-text">
            暂无范围，请在地图上完成框选。
          </div>
          <div v-for="point in draft.points" :key="point.id" class="corner-item">
            <strong>{{ point.name }}</strong>
            <span>{{ point.lng.toFixed(6) }}, {{ point.lat.toFixed(6) }}</span>
          </div>
          <Badge v-if="pendingAreaSelection" variant="secondary">已设置框选起点，等待终点</Badge>
        </div>

        <div v-else class="loop-target-grid">
          <label>
            <span>目标点经度</span>
            <el-input-number
              v-model="loopTargetLng"
              :precision="6"
              :step="0.0001"
              controls-position="right"
            />
          </label>
          <label>
            <span>目标点纬度</span>
            <el-input-number
              v-model="loopTargetLat"
              :precision="6"
              :step="0.0001"
              controls-position="right"
            />
          </label>
          <label>
            <span>环绕半径 (m)</span>
            <el-input-number
              v-model="draft.loopConfig.radius"
              :min="10"
              :max="1000"
              :step="5"
              controls-position="right"
            />
          </label>
          <label>
            <span>总角度 (°)</span>
            <el-input-number
              v-model="draft.loopConfig.totalAngle"
              :min="90"
              :max="1080"
              :step="30"
              controls-position="right"
            />
          </label>
        </div>
      </section>

      <section class="config-card">
        <div class="config-card__head">
          <div>
            <h4>全局配置</h4>
            <p>保持与现有航线参数一致的配置行为。</p>
          </div>
        </div>

        <div class="number-grid">
          <label>
            <span>起飞高度</span>
            <el-input-number
              v-model="draft.globalConfig.takeoffHeight"
              :min="5"
              :max="500"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>全局航线高度</span>
            <el-input-number
              v-model="draft.globalConfig.routeHeight"
              :min="10"
              :max="500"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>返航高度</span>
            <el-input-number
              v-model="draft.globalConfig.returnHeight"
              :min="10"
              :max="500"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>全局航线速度</span>
            <el-input-number
              v-model="draft.globalConfig.routeSpeed"
              :min="1"
              :max="30"
              :step="0.5"
              controls-position="right"
            />
          </label>
        </div>

        <div class="field-group">
          <span class="field-group__label">航线飞行中失联</span>
          <div class="chip-group">
            <button
              v-for="option in signalLossOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.globalConfig.signalLossAction === option.value }"
              @click="draft.globalConfig.signalLossAction = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <span class="field-group__label">飞行完成后</span>
          <div class="chip-group">
            <button
              v-for="option in finishActionOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.globalConfig.finishAction === option.value }"
              @click="draft.globalConfig.finishAction = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <span class="field-group__label">相机模式</span>
          <div class="chip-group">
            <button
              v-for="option in cameraModeOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.globalConfig.cameraMode === option.value }"
              @click="draft.globalConfig.cameraMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="draft.routeType === routeTypeEnum.POINT" class="config-card">
        <div class="config-card__head">
          <div>
            <h4>点状航线设置</h4>
            <p>适合道路卡口、单点巡检与重点目标采集。</p>
          </div>
        </div>

        <div class="number-grid">
          <label>
            <span>悬停时长 (s)</span>
            <el-input-number
              v-model="draft.pointConfig.hoverSeconds"
              :min="0"
              :max="120"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>拍照间隔 (s)</span>
            <el-input-number
              v-model="draft.pointConfig.photoIntervalSeconds"
              :min="1"
              :max="600"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>间隔距离 (m)</span>
            <el-input-number
              v-model="draft.pointConfig.photoIntervalDistance"
              :min="1"
              :max="1000"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>默认 Pitch</span>
            <el-input-number
              v-model="draft.pointConfig.gimbalPitch"
              :min="-90"
              :max="90"
              :step="1"
              controls-position="right"
            />
          </label>
        </div>

        <div class="field-group">
          <span class="field-group__label">起飞前准备动作</span>
          <p class="field-group__hint">
            起飞后进入正式航线前，可先执行一次悬停与云台俯仰准备动作。
          </p>
          <div class="number-grid">
            <label>
              <span>悬停时长 (s)</span>
              <el-input-number
                v-model="draft.pointConfig.preflightAction.hoverSeconds"
                :min="0"
                :max="120"
                :step="1"
                controls-position="right"
              />
            </label>
            <label>
              <span>高度 (m)</span>
              <el-input-number
                v-model="draft.pointConfig.preflightAction.height"
                :min="0"
                :max="500"
                :step="1"
                controls-position="right"
              />
            </label>
            <label>
              <span>Pitch</span>
              <el-input-number
                v-model="draft.pointConfig.preflightAction.gimbalPitch"
                :min="-90"
                :max="90"
                :step="1"
                controls-position="right"
              />
            </label>
          </div>
        </div>

        <div class="field-group">
          <span class="field-group__label">无人机偏航角模式</span>
          <div class="chip-group">
            <button
              v-for="option in headingModeOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.pointConfig.yawMode === option.value }"
              @click="draft.pointConfig.yawMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="draft.routeType === routeTypeEnum.AREA" class="config-card">
        <div class="config-card__head">
          <div>
            <h4>面状航线设置</h4>
            <p>适合正射测绘、林场巡护和大范围巡检。</p>
          </div>
        </div>

        <div class="field-group">
          <span class="field-group__label">拍照方式</span>
          <div class="chip-group">
            <button
              v-for="option in shootModeOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.areaConfig.shootMode === option.value }"
              @click="draft.areaConfig.shootMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="number-grid">
          <label>
            <span>地面分辨率</span>
            <el-input-number
              v-model="draft.areaConfig.gsd"
              :min="1"
              :max="20"
              :step="0.5"
              controls-position="right"
            />
          </label>
          <label>
            <span>飞行高度</span>
            <el-input-number
              v-model="draft.areaConfig.flightHeight"
              :min="20"
              :max="500"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>航向重叠率 (%)</span>
            <el-input-number
              v-model="draft.areaConfig.overlapFront"
              :min="40"
              :max="95"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>旁向重叠率 (%)</span>
            <el-input-number
              v-model="draft.areaConfig.overlapSide"
              :min="40"
              :max="95"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>航线方向 (°)</span>
            <el-input-number
              v-model="draft.areaConfig.routeDirection"
              :min="-180"
              :max="180"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>距离间隔 (m)</span>
            <el-input-number
              v-model="draft.areaConfig.shootIntervalDistance"
              :min="5"
              :max="500"
              :step="1"
              controls-position="right"
            />
          </label>
        </div>

        <div class="field-group">
          <span class="field-group__label">起飞点</span>
          <div class="chip-group">
            <button
              v-for="option in takeoffPointOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.areaConfig.takeoffPointMode === option.value }"
              @click="draft.areaConfig.takeoffPointMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </section>

      <section v-else class="config-card">
        <div class="config-card__head">
          <div>
            <h4>环状航线设置</h4>
            <p>适合文旅宣传、重点建筑环绕和全景展示。</p>
          </div>
        </div>

        <div class="field-group">
          <span class="field-group__label">环绕方向</span>
          <div class="chip-group">
            <button
              v-for="option in orbitDirectionOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.loopConfig.direction === option.value }"
              @click="draft.loopConfig.direction = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="number-grid">
          <label>
            <span>起始角度 (°)</span>
            <el-input-number
              v-model="draft.loopConfig.startAngle"
              :min="-180"
              :max="180"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>飞行高度</span>
            <el-input-number
              v-model="draft.loopConfig.flightHeight"
              :min="20"
              :max="500"
              :step="1"
              controls-position="right"
            />
          </label>
          <label>
            <span>目标分辨率</span>
            <el-input-number
              v-model="draft.loopConfig.targetResolution"
              :min="1"
              :max="20"
              :step="0.5"
              controls-position="right"
            />
          </label>
          <label>
            <span>Pitch</span>
            <el-input-number
              v-model="draft.loopConfig.gimbalPitch"
              :min="-90"
              :max="90"
              :step="1"
              controls-position="right"
            />
          </label>
        </div>

        <div class="field-group">
          <span class="field-group__label">偏航角调整模式</span>
          <div class="chip-group">
            <button
              v-for="option in loopYawModeOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.loopConfig.yawMode === option.value }"
              @click="draft.loopConfig.yawMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <span class="field-group__label">摄影方式</span>
          <div class="chip-group">
            <button
              v-for="option in shootModeOptions"
              :key="option.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': draft.loopConfig.shootMode === option.value }"
              @click="draft.loopConfig.shootMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </section>
    </el-scrollbar>

    <div class="planner-sidebar__actions">
      <Button
        class="planner-sidebar__action-btn"
        :disabled="dispatching || saving"
        @click="emit('dispatch')"
      >
        {{ dispatching ? "下发中..." : "下发航线" }}
      </Button>
      <Button class="planner-sidebar__action-btn" variant="outline" @click="emit('preview')">
        预览
      </Button>
      <div class="planner-sidebar__actions-row">
        <Button
          class="planner-sidebar__actions-row-btn"
          :disabled="saving || dispatching"
          @click="emit('save')"
        >
          {{ saving ? "保存中..." : "保存" }}
        </Button>
        <Button
          class="planner-sidebar__actions-row-btn"
          variant="secondary"
          :disabled="saving || dispatching"
          @click="emit('reset')"
        >
          重置
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RouteType } from "@/api/flight/types";
import type { RouteRecordModel } from "../types";
import {
  DEFAULT_CENTER,
  getRouteStatItems,
  getRouteTypeLabel,
  normalizeWaypointNames,
} from "../utils";

defineOptions({ name: "RoutePlannerSidebar" });

const props = withDefaults(
  defineProps<{
    draft: RouteRecordModel;
    pendingAreaSelection: boolean;
    saving?: boolean;
    dispatching?: boolean;
  }>(),
  {
    dispatching: false,
    saving: false,
  }
);

const emit = defineEmits<{
  dispatch: [];
  preview: [];
  save: [];
  reset: [];
  clearGeometry: [];
}>();

const routeTypeEnum = RouteType;
const stats = computed(() => getRouteStatItems(props.draft));

const signalLossOptions = [
  { label: "返航", value: "returnHome" },
  { label: "悬停", value: "hover" },
  { label: "继续任务", value: "continue" },
] as const;
const finishActionOptions = [
  { label: "返航", value: "returnHome" },
  { label: "悬停", value: "hover" },
  { label: "降落", value: "land" },
] as const;
const cameraModeOptions = [
  { label: "广角", value: "wide" },
  { label: "红外", value: "infrared" },
] as const;
const headingModeOptions = [
  { label: "自动", value: "auto" },
  { label: "兴趣点跟踪", value: "track" },
  { label: "沿切线方向", value: "tangent" },
  { label: "手动设置角度", value: "manual" },
] as const;
const loopYawModeOptions = [
  { label: "兴趣点跟踪", value: "track" },
  { label: "沿切线方向", value: "tangent" },
  { label: "手动设置角度", value: "manual" },
] as const;
const shootModeOptions = [
  { label: "等时间间隔拍照", value: "time" },
  { label: "等距离间隔拍照", value: "distance" },
] as const;
const takeoffPointOptions = [
  { label: "系统生成起飞点", value: "system" },
  { label: "手动设置起飞点", value: "manual" },
] as const;
const orbitDirectionOptions = [
  { label: "顺时针", value: "clockwise" },
  { label: "逆时针", value: "counterclockwise" },
] as const;

const loopTargetLng = computed({
  get: () => props.draft.loopConfig.targetPoint?.lng ?? DEFAULT_CENTER.lng,
  set: (value: number) => {
    ensureLoopTarget();
    if (props.draft.loopConfig.targetPoint) {
      props.draft.loopConfig.targetPoint.lng = value;
    }
  },
});
const loopTargetLat = computed({
  get: () => props.draft.loopConfig.targetPoint?.lat ?? DEFAULT_CENTER.lat,
  set: (value: number) => {
    ensureLoopTarget();
    if (props.draft.loopConfig.targetPoint) {
      props.draft.loopConfig.targetPoint.lat = value;
    }
  },
});

watch(
  () => [
    props.draft.pointConfig.hoverSeconds,
    props.draft.pointConfig.gimbalPitch,
    props.draft.pointConfig.yaw,
  ],
  ([hoverSeconds, gimbalPitch, yaw]) => {
    if (props.draft.routeType !== RouteType.POINT) {
      return;
    }

    props.draft.points.forEach((point) => {
      point.hoverSeconds = hoverSeconds;
      point.gimbalPitch = gimbalPitch;
      point.yaw = yaw;
    });
  }
);

watch(
  () => props.draft.areaConfig.flightHeight,
  (value) => {
    if (props.draft.routeType !== RouteType.AREA) {
      return;
    }

    props.draft.points.forEach((point) => {
      point.alt = value;
    });
  }
);

watch(
  () => props.draft.loopConfig.flightHeight,
  (value) => {
    if (props.draft.loopConfig.targetPoint) {
      props.draft.loopConfig.targetPoint.alt = value;
    }
  }
);

function ensureLoopTarget() {
  if (!props.draft.loopConfig.targetPoint) {
    props.draft.loopConfig.targetPoint = {
      lng: DEFAULT_CENTER.lng,
      lat: DEFAULT_CENTER.lat,
      alt: props.draft.loopConfig.flightHeight,
    };
  }
}

function removeWaypoint(index: number) {
  props.draft.points.splice(index, 1);
  props.draft.points = normalizeWaypointNames(props.draft.points);
}
</script>

<style scoped lang="scss">
.planner-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.planner-sidebar__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2px 2px 0;
}

.planner-sidebar__eyebrow {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.planner-sidebar__title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--foreground);
}

.planner-sidebar__title p {
  margin: 6px 0 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

.planner-sidebar__type {
  margin-top: 2px;
  white-space: nowrap;
}

.planner-sidebar__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.planner-stat {
  padding: 12px 14px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(9, 9, 11, 0.04);
}

.planner-stat span {
  display: block;
  margin-bottom: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.planner-stat strong {
  font-size: 1.125rem;
  line-height: 1.2;
  color: var(--foreground);
}

.planner-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.config-card {
  padding: 14px;
  margin-bottom: 12px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
  box-shadow: 0 12px 24px rgba(9, 9, 11, 0.05);
}

.config-card__head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.config-card__head h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.config-card__head p {
  margin: 6px 0 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--muted-foreground);
}

.waypoint-list,
.corner-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.waypoint-card,
.corner-item {
  padding: 12px;
  background: color-mix(in srgb, var(--muted) 56%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
  border-radius: 16px;
}

.waypoint-card__head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.waypoint-card__head strong,
.corner-item strong {
  color: var(--foreground);
}

.waypoint-card__delete {
  color: var(--destructive);
}

.waypoint-card__meta,
.corner-item span,
.empty-text {
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--muted-foreground);
}

.corner-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.number-grid,
.loop-target-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.number-grid label,
.loop-target-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.number-grid label span,
.loop-target-grid label span {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--foreground);
}

.field-group {
  margin-top: 14px;
}

.field-group__label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
}

.field-group__hint {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-group--compact {
  margin-top: 10px;
}

.option-chip {
  padding: 7px 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--foreground);
  cursor: pointer;
  background: color-mix(in srgb, var(--background) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
  border-radius: 999px;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.option-chip:hover,
.option-chip.is-active {
  color: var(--foreground);
  background: color-mix(in srgb, var(--secondary) 92%, transparent);
  border-color: color-mix(in srgb, var(--ring) 38%, transparent);
}

.option-chip:hover {
  transform: translateY(-1px);
}

.planner-sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.planner-sidebar__action-btn {
  width: 100%;
  margin: 0;
}

.planner-sidebar__actions-row {
  display: flex;
  gap: 12px;
}

.planner-sidebar__actions-row-btn {
  flex: 1;
  margin: 0;
}

:deep(.el-input-number) {
  width: 100%;
  --el-input-number-controls-color: var(--muted-foreground);
  --el-input-number-controls-border-color: color-mix(in srgb, var(--border) 86%, transparent);
}

:deep(.el-input-number .el-input__wrapper) {
  background: color-mix(in srgb, var(--background) 96%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
  border-radius: 12px;
  box-shadow: none;
}

:deep(.el-input-number .el-input__inner) {
  font-size: 0.875rem;
  color: var(--foreground);
}

:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) {
  background: color-mix(in srgb, var(--muted) 55%, transparent);
}

:deep(.el-scrollbar__view) {
  min-height: 100%;
}

@media (max-width: 1400px) {
  .planner-sidebar__stats,
  .number-grid,
  .loop-target-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
