<template>
  <div class="planner-sidebar">
    <div class="planner-sidebar__head">
      <div class="planner-sidebar__title">
        <span class="planner-sidebar__title-bar"></span>
        <div>
          <h3>航线配置</h3>
          <p>{{ draft.routeName }}</p>
        </div>
      </div>
      <span class="planner-sidebar__type">{{ getRouteTypeLabel(draft.routeType) }}</span>
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
          <button type="button" class="text-action" @click="emit('clearGeometry')">清空</button>
        </div>

        <div v-if="draft.routeType === routeTypeEnum.POINT" class="waypoint-list">
          <div v-if="draft.points.length === 0" class="empty-text">
            暂无航点，请点击右侧地图依次添加。
          </div>
          <div v-for="(point, index) in draft.points" :key="point.id" class="waypoint-card">
            <div class="waypoint-card__head">
              <strong>{{ point.name }}</strong>
              <button type="button" class="text-action danger" @click="removeWaypoint(index)">
                删除
              </button>
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
          <el-tag v-if="pendingAreaSelection" type="warning" effect="dark">
            已设置框选起点，等待终点
          </el-tag>
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
            <p>遵循组件设计规范中的深色科技风表单与按钮风格。</p>
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
      <el-button type="primary" class="primary-action" @click="emit('preview')">
        航线预览（模拟飞行）
      </el-button>
      <div class="planner-sidebar__actions-row">
        <el-button type="primary" class="primary-action" :loading="saving" @click="emit('save')">
          保存
        </el-button>
        <el-button class="secondary-action" :disabled="saving" @click="emit('reset')">
          重置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  }>(),
  {
    saving: false,
  }
);

const emit = defineEmits<{
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
  padding: 18px;
  background: var(--route-panel-bg);
  border: 1px solid var(--route-border-strong);
  border-radius: 20px;
  box-shadow: var(--route-shadow);
}

.planner-sidebar__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.planner-sidebar__title {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--route-text-primary);
  }

  p {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--route-text-secondary);
  }
}

.planner-sidebar__title-bar {
  width: 4px;
  height: 42px;
  margin-top: 2px;
  background: linear-gradient(180deg, #0abaff 0%, #51f4f3 100%);
  border-radius: 999px;
}

.planner-sidebar__type {
  padding: 7px 12px;
  font-size: 14px;
  color: var(--route-primary);
  background: var(--route-chip-bg);
  border: 1px solid var(--route-border-strong);
  border-radius: 999px;
}

.planner-sidebar__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.planner-stat {
  padding: 14px;
  background: var(--route-card-bg);
  border: 1px solid var(--route-border);
  border-radius: 16px;

  span {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--route-text-secondary);
  }

  strong {
    font-size: 24px;
    font-weight: 600;
    color: var(--route-text-primary);
  }
}

.planner-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.config-card {
  padding: 16px;
  margin-bottom: 14px;
  background: var(--route-card-bg);
  border: 1px solid var(--route-border);
  border-radius: 18px;
}

.config-card__head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--route-text-primary);
  }

  p {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--route-text-secondary);
  }
}

.text-action {
  padding: 0;
  font-size: 14px;
  color: var(--route-primary);
  cursor: pointer;
  background: transparent;
  border: none;
}

.danger {
  color: var(--route-danger);
}

.waypoint-list,
.corner-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.waypoint-card,
.corner-item {
  padding: 14px;
  background: var(--route-subtle-bg);
  border: 1px solid var(--route-border);
  border-radius: 14px;
}

.waypoint-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  strong {
    font-size: 16px;
    font-weight: 500;
    color: var(--route-text-primary);
  }
}

.waypoint-card__meta,
.corner-item span,
.empty-text {
  font-size: 14px;
  color: var(--route-text-secondary);
}

.corner-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;

  strong {
    color: var(--route-text-primary);
  }
}

.number-grid,
.loop-target-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;

    span {
      font-size: 14px;
      color: var(--route-primary);
    }
  }
}

.field-group {
  margin-top: 16px;
}

.field-group__label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--route-primary);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-group--compact {
  margin-top: 12px;
}

.option-chip {
  padding: 8px 14px;
  font-size: 14px;
  color: var(--route-chip-text);
  cursor: pointer;
  background: var(--route-chip-bg);
  border: 1px solid var(--route-border);
  border-radius: 999px;
  transition: all 0.2s ease;
}

.option-chip:hover,
.option-chip.is-active {
  color: #fff;
  background: var(--route-primary-gradient);
  border-color: transparent;
  box-shadow: 0 0 0 1px rgba(81, 244, 243, 0.18);
}

.planner-sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.planner-sidebar__actions-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.primary-action,
.secondary-action {
  width: 100%;
  height: 42px;
  border-radius: 999px;
}

.primary-action {
  background: var(--route-primary-gradient);
  border: none;
}

.secondary-action {
  color: var(--route-text-primary);
  background: var(--route-subtle-bg);
  border: 1px solid var(--route-border);
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase),
:deep(.el-input-number .el-input__wrapper) {
  background: var(--route-input-bg);
  border-color: var(--route-border-strong);
  box-shadow: inset 0 0 0 1px var(--route-border-strong);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__selected-item),
:deep(.el-input-number .el-input__inner) {
  color: var(--route-text-primary);
}

@media (max-width: 1600px) {
  .planner-sidebar__stats,
  .number-grid,
  .loop-target-grid,
  .planner-sidebar__actions-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
