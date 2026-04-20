<template>
  <div class="app-container route-detail-page">
    <template v-if="activeDraft">
      <section v-loading="plannerLoading" class="planner-page">
        <div class="planner-page__header">
          <div class="planner-page__header-main">
            <Button variant="ghost" @click="returnToList">返回列表</Button>
            <div>
              <div class="planner-page__header-tags">
                <Badge variant="outline">
                  {{ getRouteTypeLabel(activeDraft.routeType) }}
                </Badge>
                <Badge :variant="activeDraft.persisted ? 'secondary' : 'outline'">
                  {{ activeDraft.persisted ? "已保存" : "草稿" }}
                </Badge>
              </div>
              <h1>{{ activeDraft.routeName }}</h1>
              <p>
                {{ activeDraft.description || "统一维护航线规划、模拟飞行和下发状态。" }}
              </p>
            </div>
          </div>
          <div class="planner-page__header-actions">
            <Button
              variant="outline"
              :disabled="!playbackEntryState.enabled"
              @click="openPlaybackScreen"
            >
              模拟飞行
            </Button>
            <div class="planner-page__type-switch">
              <Button
                v-for="option in routeTypeOptions"
                :key="option.value"
                size="sm"
                :variant="activeDraft.routeType === option.value ? 'default' : 'outline'"
                @click="handleRouteTypeChange(option.value)"
              >
                {{ option.label }}
              </Button>
            </div>
          </div>
        </div>

        <el-row :gutter="20" class="planner-page__body">
          <el-col :xl="8" :lg="8" :xs="24" class="planner-page__side-col">
            <el-card shadow="hover" class="planner-card planner-card--sidebar">
              <RoutePlannerSidebar
                :draft="activeDraft"
                :pending-area-selection="Boolean(areaSelectionStart)"
                :dispatching="dispatchLoading"
                :saving="saveLoading"
                @dispatch="openDispatchDialog"
                @preview="previewDraft"
                @save="saveDraft"
                @reset="resetDraft"
                @clear-geometry="clearCurrentGeometry"
              />
            </el-card>
          </el-col>

          <el-col :xl="16" :lg="16" :xs="24" class="planner-page__map-col">
            <el-card shadow="hover" class="planner-card planner-card--map">
              <div class="planner-card__map-toolbar">
                <el-button
                  v-for="option in baseMapOptions"
                  :key="option.value"
                  size="small"
                  :type="baseMapMode === option.value ? 'primary' : 'default'"
                  @click="handleBaseMapChange(option.value)"
                >
                  {{ option.label }}
                </el-button>
              </div>

              <div class="planner-card__map-body">
                <RoutePlannerMap
                  ref="plannerMapRef"
                  :draft="activeDraft"
                  :base-map-mode="baseMapMode"
                  :dark-mode="isDarkMode"
                  @map-click="handleMapClick"
                />
                <div class="planner-overlay planner-overlay--hint">{{ mapInstruction }}</div>
                <div
                  v-if="baseMapMode === 'terrain' && !hasTerrainSource"
                  class="planner-overlay planner-overlay--warn"
                >
                  未配置 `VITE_CESIUM_TERRAIN_URL` 或
                  `VITE_CESIUM_ION_TOKEN`，当前显示地形底图，但未启用真实地形高程。
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </section>
    </template>

    <FlightEmptyState
      v-else
      title="未找到对应的航线详情"
      description="当前没有可展示的航线详情，请返回列表重新选择。"
      action-label="返回列表"
      @action="returnToList"
    />

    <RouteDispatchDialog
      :open="dispatchDialogVisible"
      :route-draft="activeDraft"
      :can-publish-route="canPublishRoute"
      :dispatch-status-text="dispatchStatusText"
      :dispatching="dispatchLoading"
      @update:open="handleDispatchDialogOpenChange"
      @close="closeDispatchDialog"
      @confirm="handleDispatchRoute"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import RouteAPI from "@/api/flight/route";
import { RouteType } from "@/api/flight/types";
import { ThemeMode } from "@/enums";
import { useSettingsStore } from "@/store/modules/settings";
import { downloadFile } from "@/utils";
import FlightEmptyState from "@/components/flight/FlightEmptyState.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RouteDispatchDialog from "./components/RouteDispatchDialog.vue";
import RoutePlannerMap from "./components/RoutePlannerMap.vue";
import RoutePlannerSidebar from "./components/RoutePlannerSidebar.vue";
import { buildPlaybackLocation, getPlaybackEntryState } from "./playback-entry";
import { buildRouteDraftKmzFile, formatApiDateTime, hydrateRouteRecord } from "./route-xml";
import { getRouteDraftById, removeRouteDraft, saveRouteDraft } from "./storage";
import type { BaseMapMode, PlannerPoint, RouteRecordModel } from "./types";
import {
  buildAreaRectangle,
  cloneRouteRecord,
  createPlannerPoint,
  getRouteInstruction,
  getRouteTypeLabel,
  normalizeWaypointNames,
} from "./utils";

defineOptions({ name: "RouteManagerDetailPage" });

interface PlannerMapExpose {
  flyToRoute: () => void;
}

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();

const routeTypeOptions = [
  { value: RouteType.POINT, label: "点状航线" },
  { value: RouteType.AREA, label: "面状航线" },
  { value: RouteType.LOOP, label: "环状航线" },
] as const;

const baseMapOptions = [
  { value: "standard", label: "标准地图" },
  { value: "satellite", label: "卫星地图" },
  { value: "terrain", label: "地形图" },
] as const satisfies Array<{ value: BaseMapMode; label: string }>;

const dispatchDialogVisible = ref(false);
const activeDraft = ref<RouteRecordModel | null>(null);
const draftSnapshot = ref<RouteRecordModel | null>(null);
const areaSelectionStart = ref<PlannerPoint | null>(null);
const baseMapMode = ref<BaseMapMode>("standard");
const plannerMapRef = ref<PlannerMapExpose | null>(null);
const plannerLoading = ref(false);
const dispatchLoading = ref(false);
const saveLoading = ref(false);

const routeId = computed(() => String(route.params.id ?? ""));
const isDraftRoute = computed(() => route.query.draft === "1");
const hasTerrainSource = computed(
  () =>
    Boolean(import.meta.env.VITE_CESIUM_TERRAIN_URL?.trim()) ||
    Boolean(import.meta.env.VITE_CESIUM_ION_TOKEN)
);
const isDarkMode = computed(() => settingsStore.theme === ThemeMode.DARK);
const hasUnsavedChanges = computed(() => {
  if (!activeDraft.value || !draftSnapshot.value) {
    return false;
  }
  return JSON.stringify(activeDraft.value) !== JSON.stringify(draftSnapshot.value);
});
const canPublishRoute = computed(
  () => Boolean(activeDraft.value?.persisted) && !isDraftRoute.value && !hasUnsavedChanges.value
);
const playbackEntryState = computed(() =>
  getPlaybackEntryState(activeDraft.value, isDraftRoute.value, hasUnsavedChanges.value)
);
const dispatchStatusText = computed(() => {
  if (!activeDraft.value?.persisted || isDraftRoute.value) {
    return "当前航线尚未保存，请先保存后再下发。";
  }
  if (hasUnsavedChanges.value) {
    return "检测到未保存修改，请先保存当前配置后再下发。";
  }
  return "确认后将通过正式业务 API 获取当前航线的 KMZ 下发包。";
});
const mapInstruction = computed(() => {
  if (!activeDraft.value) return "";
  return getRouteInstruction(activeDraft.value.routeType, Boolean(areaSelectionStart.value));
});

async function loadRouteState() {
  plannerLoading.value = true;
  dispatchDialogVisible.value = false;
  areaSelectionStart.value = null;
  baseMapMode.value = "standard";

  try {
    if (isDraftRoute.value) {
      const draftRoute = getRouteDraftById(routeId.value);
      if (!draftRoute) {
        activeDraft.value = null;
        draftSnapshot.value = null;
        return;
      }

      activeDraft.value = cloneRouteRecord(draftRoute);
      draftSnapshot.value = cloneRouteRecord(draftRoute);
    } else {
      const routeDetail = await RouteAPI.getDetail(routeId.value);
      const kmzResponse = await RouteAPI.getKmz(routeId.value).catch(() => null);
      const routeRecord = await hydrateRouteRecord(routeDetail, kmzResponse?.data);
      activeDraft.value = cloneRouteRecord(routeRecord);
      draftSnapshot.value = cloneRouteRecord(routeRecord);
    }
  } catch {
    activeDraft.value = null;
    draftSnapshot.value = null;
  } finally {
    plannerLoading.value = false;
  }

  await nextTick();
  window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 160);
}

function returnToList() {
  router.push("/flight/route");
}

function handleBaseMapChange(mode: BaseMapMode) {
  baseMapMode.value = mode;
  if (mode === "terrain" && !hasTerrainSource.value) {
    ElMessage.info(
      "未配置 VITE_CESIUM_TERRAIN_URL 或 VITE_CESIUM_ION_TOKEN，当前显示地形底图，但未启用真实地形高程。"
    );
  }
}

function handleRouteTypeChange(type: RouteType) {
  if (!activeDraft.value || activeDraft.value.routeType === type) return;
  activeDraft.value.routeType = type;
  activeDraft.value.points = [];
  areaSelectionStart.value = null;
  activeDraft.value.loopConfig.targetPoint = null;
  ElMessage.info("已切换航线类型，请重新绘制规划范围");
  window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 120);
}

function handleMapClick(coordinate: { lng: number; lat: number }) {
  if (!activeDraft.value) return;

  if (activeDraft.value.routeType === RouteType.POINT) {
    activeDraft.value.points = normalizeWaypointNames([
      ...activeDraft.value.points,
      createPlannerPoint(
        activeDraft.value.points.length + 1,
        coordinate.lng,
        coordinate.lat,
        activeDraft.value.globalConfig.routeHeight,
        {
          hoverSeconds: activeDraft.value.pointConfig.hoverSeconds,
          gimbalPitch: activeDraft.value.pointConfig.gimbalPitch,
          yaw: activeDraft.value.pointConfig.yaw,
        }
      ),
    ]);
    return;
  }

  if (activeDraft.value.routeType === RouteType.AREA) {
    if (!areaSelectionStart.value) {
      areaSelectionStart.value = createPlannerPoint(
        1,
        coordinate.lng,
        coordinate.lat,
        activeDraft.value.areaConfig.flightHeight
      );
      activeDraft.value.points = [areaSelectionStart.value];
      ElMessage.info("已设置框选起点，请再次点击地图完成范围框选");
      return;
    }

    activeDraft.value.points = buildAreaRectangle(
      areaSelectionStart.value,
      coordinate,
      activeDraft.value.areaConfig.flightHeight
    );
    areaSelectionStart.value = null;
    window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 120);
    return;
  }

  activeDraft.value.loopConfig.targetPoint = {
    lng: coordinate.lng,
    lat: coordinate.lat,
    alt: activeDraft.value.loopConfig.flightHeight,
  };
}

function clearCurrentGeometry() {
  if (!activeDraft.value) return;
  activeDraft.value.points = [];
  areaSelectionStart.value = null;
  if (activeDraft.value.routeType === RouteType.LOOP) {
    activeDraft.value.loopConfig.targetPoint = null;
  }
  ElMessage.success("已清空当前规划图形");
}

function previewDraft() {
  plannerMapRef.value?.flyToRoute();
}

function openPlaybackScreen() {
  if (!activeDraft.value) return;

  if (!playbackEntryState.value.enabled) {
    ElMessage.warning(playbackEntryState.value.reason);
    return;
  }

  router.push(buildPlaybackLocation(activeDraft.value.id));
}

function openDispatchDialog() {
  if (!activeDraft.value) return;
  if (!validateCurrentDraft(activeDraft.value)) return;
  if (!activeDraft.value.persisted || isDraftRoute.value) {
    ElMessage.warning("请先保存航线再下发");
    return;
  }
  if (hasUnsavedChanges.value) {
    ElMessage.warning("检测到未保存修改，请先保存后再下发");
    return;
  }

  dispatchDialogVisible.value = true;
}

function closeDispatchDialog() {
  dispatchDialogVisible.value = false;
}

function handleDispatchDialogOpenChange(open: boolean) {
  dispatchDialogVisible.value = open;
}

function resetDraft() {
  if (!draftSnapshot.value) return;
  activeDraft.value = cloneRouteRecord(draftSnapshot.value);
  areaSelectionStart.value = null;
  ElMessage.success("已恢复到上次保存状态");
  window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 160);
}

async function saveDraft() {
  if (!activeDraft.value) return;
  if (!validateCurrentDraft(activeDraft.value)) return;

  saveLoading.value = true;

  try {
    const savedDraft = cloneRouteRecord(activeDraft.value);
    const kmzFile = await buildRouteDraftKmzFile(savedDraft);
    const response = savedDraft.persisted
      ? await RouteAPI.update(savedDraft.id, {
          name: savedDraft.routeName.trim(),
          kmzFile,
        })
      : await RouteAPI.create({
          name: savedDraft.routeName.trim(),
          kmzFile,
        });

    areaSelectionStart.value = null;

    if (!savedDraft.persisted || isDraftRoute.value) {
      removeRouteDraft(savedDraft.id);
      await router.replace({
        name: "FlightRouteDetail",
        params: { id: String(response.id) },
      });
    } else {
      savedDraft.id = String(response.id);
      savedDraft.persisted = true;
      savedDraft.isPublished = Boolean(response.is_published);
      savedDraft.routeName = response.name || savedDraft.routeName;
      savedDraft.createdAt = formatApiDateTime(response.created_at);
      savedDraft.updatedAt = formatApiDateTime(response.updated_at);
      activeDraft.value = cloneRouteRecord(savedDraft);
      draftSnapshot.value = cloneRouteRecord(savedDraft);
    }

    ElMessage.success("航线保存成功");
  } finally {
    saveLoading.value = false;
  }
}

async function handleDispatchRoute() {
  if (!activeDraft.value) return;
  if (!validateCurrentDraft(activeDraft.value)) return;
  if (!canPublishRoute.value) {
    ElMessage.warning(dispatchStatusText.value);
    return;
  }

  dispatchLoading.value = true;

  try {
    const kmzResponse = await RouteAPI.getKmz(activeDraft.value.id);

    downloadFile(kmzResponse, `${activeDraft.value.routeName || "route"}.kmz`);
    dispatchDialogVisible.value = false;
    ElMessage.success("航线下发包下载成功");
  } catch (error: any) {
    ElMessage.error(error?.message || "航线下发包下载失败");
  } finally {
    dispatchLoading.value = false;
  }
}

function validateCurrentDraft(draft: RouteRecordModel): boolean {
  if (!draft.routeName.trim()) return (ElMessage.warning("航线名称不能为空"), false);
  if (draft.routeType === RouteType.POINT && draft.points.length < 2) {
    return (ElMessage.warning("点状航线至少需要 2 个航点"), false);
  }
  if (draft.routeType === RouteType.AREA && draft.points.length < 4) {
    return (ElMessage.warning("面状航线请先完成范围框选"), false);
  }
  if (draft.routeType === RouteType.LOOP && !draft.loopConfig.targetPoint) {
    return (ElMessage.warning("请先设置环绕中心"), false);
  }
  return true;
}

watch(
  () => [route.params.id, route.query.draft, route.query.action].join("|"),
  () => {
    void loadRouteState();
  },
  { immediate: true }
);

watch(
  activeDraft,
  (draft) => {
    if (!draft || !isDraftRoute.value || draft.persisted) return;
    saveRouteDraft(draft);
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.route-detail-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 84px);
  min-height: calc(100vh - 84px);
  overflow: hidden !important;
}

.planner-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.planner-page__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.planner-page__header-main {
  display: flex;
  gap: 12px;
  align-items: center;
}

.planner-page__header h1,
.planner-page__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.planner-page__header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.planner-page__header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.planner-page__type-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.planner-page__header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.planner-page__body {
  flex: 1;
  align-items: stretch;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0 !important;
  margin-right: 0 !important;
  margin-left: 0 !important;
  overflow: hidden;
}

.planner-page__side-col,
.planner-page__map-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.planner-page__side-col {
  overflow-x: hidden;
  overflow-y: auto;
}

.planner-page__map-col {
  overflow: hidden !important;
}

.planner-card {
  height: 100%;
  min-height: 0;
}

.planner-card--sidebar :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}

.planner-card--sidebar {
  overflow: hidden;
}

.planner-card--map :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}

.planner-card--map {
  overflow: hidden !important;
}

.planner-card__map-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.planner-card__map-body {
  position: relative;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.planner-overlay {
  position: absolute;
  z-index: 5;
  padding: 6px 10px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.planner-overlay--hint {
  bottom: 12px;
  left: 12px;
}

.planner-overlay--warn {
  top: 12px;
  left: 12px;
  color: var(--el-color-warning);
}

.route-dispatch-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-dispatch-dialog__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.route-dispatch-dialog__summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.route-dispatch-dialog__summary-item span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.route-dispatch-dialog__summary-item strong {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.route-dispatch-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

.route-dispatch-dialog__grid--compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.route-dispatch-dialog__status {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.route-dispatch-dialog__status.is-error {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-7);
}

.route-dispatch-dialog__tip {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.detail-empty-card__footer {
  display: flex;
  justify-content: center;
}

@media (max-width: 1280px) {
  .route-dispatch-dialog__summary,
  .route-dispatch-dialog__grid,
  .route-dispatch-dialog__grid--compact {
    grid-template-columns: minmax(0, 1fr);
  }

  .planner-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .planner-page__header-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .planner-page__side-col {
    margin-bottom: 12px;
  }

  .planner-page__body {
    height: auto !important;
  }
}
</style>
