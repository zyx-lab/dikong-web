<template>
  <div class="app-container route-detail-page">
    <template v-if="activeDraft">
      <section v-loading="plannerLoading" class="planner-page">
        <div class="planner-page__header">
          <div class="planner-page__header-main">
            <el-button link type="primary" icon="ArrowLeft" @click="returnToList">
              返回列表
            </el-button>
            <div>
              <h2>{{ activeDraft.routeName }}</h2>
              <p>
                {{ activeDraft.department || "未配置部门" }} ·
                {{ getRouteTypeLabel(activeDraft.routeType) }}
              </p>
            </div>
          </div>
          <div class="planner-page__type-switch">
            <el-button
              v-for="option in routeTypeOptions"
              :key="option.value"
              size="small"
              :type="activeDraft.routeType === option.value ? 'primary' : 'default'"
              @click="handleRouteTypeChange(option.value)"
            >
              {{ option.label }}
            </el-button>
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
                  v-if="baseMapMode === 'terrain' && !hasTerrainToken"
                  class="planner-overlay planner-overlay--warn"
                >
                  未配置 `VITE_CESIUM_ION_TOKEN`，当前以标准底图展示地形模式。
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </section>
    </template>

    <el-card v-else shadow="hover" class="detail-empty-card">
      <el-empty description="未找到对应的航线详情" />
      <div class="detail-empty-card__footer">
        <el-button type="primary" @click="returnToList">返回列表</el-button>
      </div>
    </el-card>

    <el-dialog
      v-model="dispatchDialogVisible"
      title="下发航线"
      width="760px"
      custom-class="dialog-form-decorated"
      class="route-dispatch-dialog"
    >
      <div class="route-dispatch-dialog__content">
        <div class="route-dispatch-dialog__summary">
          <div class="route-dispatch-dialog__summary-item">
            <span>航线名称</span>
            <strong>{{ activeDraft?.routeName || "-" }}</strong>
          </div>
          <div class="route-dispatch-dialog__summary-item">
            <span>航线类型</span>
            <strong>{{ activeDraft ? getRouteTypeLabel(activeDraft.routeType) : "-" }}</strong>
          </div>
          <div class="route-dispatch-dialog__summary-item">
            <span>KMZ 文件名</span>
            <strong>{{ dispatchFileName }}</strong>
          </div>
        </div>

        <el-form :model="dispatchForm" label-position="top">
          <div class="route-dispatch-dialog__grid">
            <el-form-item label="后端地址">
              <el-input
                v-model="dispatchForm.baseUrl"
                placeholder="默认：http://192.168.3.26:6789"
              />
            </el-form-item>
            <el-form-item label="当前工作区">
              <el-input :model-value="dispatchWorkspaceDisplay" readonly />
            </el-form-item>
            <el-form-item label="机型模板">
              <el-select
                v-model="dispatchForm.devicePresetKey"
                placeholder="请选择机型模板"
                @change="handleDevicePresetChange"
              >
                <el-option
                  v-for="item in WAYLINE_DEVICE_PRESETS"
                  :key="item.key"
                  :label="item.label"
                  :value="item.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="负载挂载位">
              <el-input-number
                v-model="dispatchForm.payloadPositionIndex"
                :min="0"
                :max="2"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
          </div>

          <div class="route-dispatch-dialog__status" :class="{ 'is-error': !!dispatchAuthError }">
            <span>{{ dispatchAuthStatus }}</span>
            <el-button text :loading="dispatchAuthLoading" @click="handleRefreshDispatchContext">
              重新获取
            </el-button>
          </div>

          <div class="route-dispatch-dialog__grid route-dispatch-dialog__grid--compact">
            <el-form-item label="droneEnumValue">
              <el-input-number
                v-model="dispatchForm.droneEnumValue"
                :min="0"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="droneSubEnumValue">
              <el-input-number
                v-model="dispatchForm.droneSubEnumValue"
                :min="0"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="payloadEnumValue">
              <el-input-number
                v-model="dispatchForm.payloadEnumValue"
                :min="0"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="payloadSubEnumValue">
              <el-input-number
                v-model="dispatchForm.payloadSubEnumValue"
                :min="0"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
          </div>
        </el-form>

        <div class="route-dispatch-dialog__tip">
          当前会默认连接 `http://192.168.3.26:6789`，使用 README 提供的 `adminPC`
          账号自动登录，自动获取当前 `workspace_id` 后再上传到 `waylines/file/upload` 接口。
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dispatchDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="dispatchLoading || dispatchAuthLoading"
            @click="handleDispatchRoute"
          >
            确认下发
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import WaylineAPI from "@/api/flight/wayline";
import { RouteType } from "@/api/flight/types";
import { ThemeMode } from "@/enums";
import { useSettingsStore } from "@/store/modules/settings";
import { Storage } from "@/utils/storage";
import RoutePlannerMap from "./components/RoutePlannerMap.vue";
import RoutePlannerSidebar from "./components/RoutePlannerSidebar.vue";
import {
  getPersistedRouteRecordById,
  getRouteDraftById,
  removeRouteDraft,
  savePersistedRouteRecord,
  saveRouteDraft,
} from "./storage";
import type { BaseMapMode, PlannerPoint, RouteRecordModel } from "./types";
import {
  buildWaylineKmzFile,
  ensureKmzFileName,
  WAYLINE_DEVICE_PRESETS,
  type WaylineDevicePreset,
} from "./wayline-kmz";
import {
  buildAreaRectangle,
  cloneRouteRecord,
  createLoopTargetPoint,
  createPlannerPoint,
  formatDateTime,
  getRouteInstruction,
  getRouteTypeLabel,
  normalizeWaypointNames,
} from "./utils";

defineOptions({ name: "RouteManagerDetailPage" });

interface PlannerMapExpose {
  flyToRoute: () => void;
}

interface RouteDispatchForm {
  baseUrl: string;
  workspaceId: string;
  devicePresetKey: string;
  droneEnumValue: number;
  droneSubEnumValue: number;
  payloadEnumValue: number;
  payloadSubEnumValue: number;
  payloadPositionIndex: number;
}

interface WaylineLoginResponse {
  code?: number;
  msg?: string;
  message?: string;
  data?: {
    access_token?: string;
    accessToken?: string;
    token?: string;
  };
}

interface CurrentWorkspaceResponse {
  code?: number;
  msg?: string;
  message?: string;
  data?: {
    workspace_id?: string;
    workspace_name?: string;
    workspaceId?: string;
    workspaceName?: string;
  };
}

const ROUTE_DISPATCH_STORAGE_KEY = "vea:route:planner_dispatch_config";
const DEFAULT_WAYLINE_BASE_URL = "http://192.168.3.26:6789";
const WAYLINE_LOGIN_PAYLOAD = Object.freeze({
  username: "adminPC",
  password: "adminPC",
  flag: 1,
});

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
const dispatchAuthLoading = ref(false);
const saveLoading = ref(false);
const dispatchToken = ref("");
const dispatchWorkspaceName = ref("");
const dispatchAuthError = ref("");

const dispatchForm = reactive<RouteDispatchForm>(createDispatchForm());

const routeId = computed(() => String(route.params.id ?? ""));
const isDraftRoute = computed(() => route.query.draft === "1");
const hasTerrainToken = computed(() => Boolean(import.meta.env.VITE_CESIUM_ION_TOKEN));
const isDarkMode = computed(() => settingsStore.theme === ThemeMode.DARK);
const dispatchFileName = computed(() =>
  ensureKmzFileName(activeDraft.value?.routeName || "航线规划")
);
const dispatchWorkspaceDisplay = computed(() => {
  if (!dispatchForm.workspaceId) {
    return dispatchAuthLoading.value ? "正在自动获取..." : "确认下发时自动获取";
  }
  return dispatchWorkspaceName.value
    ? `${dispatchForm.workspaceId} / ${dispatchWorkspaceName.value}`
    : dispatchForm.workspaceId;
});
const dispatchAuthStatus = computed(() => {
  if (dispatchAuthLoading.value) return "正在自动登录并获取当前工作区";
  if (dispatchAuthError.value) return dispatchAuthError.value;
  if (dispatchToken.value) return "已自动获取 x-auth-token";
  return "确认下发时自动登录获取";
});
const mapInstruction = computed(() => {
  if (!activeDraft.value) return "";
  return getRouteInstruction(activeDraft.value.routeType, Boolean(areaSelectionStart.value));
});

function createDispatchForm(): RouteDispatchForm {
  const defaultPreset = WAYLINE_DEVICE_PRESETS[0];
  const savedConfig = Storage.get<Partial<RouteDispatchForm> | null>(
    ROUTE_DISPATCH_STORAGE_KEY,
    null
  );

  return {
    baseUrl: savedConfig?.baseUrl || DEFAULT_WAYLINE_BASE_URL,
    workspaceId: "",
    devicePresetKey: savedConfig?.devicePresetKey || defaultPreset.key,
    droneEnumValue: savedConfig?.droneEnumValue ?? defaultPreset.droneEnumValue,
    droneSubEnumValue: savedConfig?.droneSubEnumValue ?? defaultPreset.droneSubEnumValue,
    payloadEnumValue: savedConfig?.payloadEnumValue ?? defaultPreset.payloadEnumValue,
    payloadSubEnumValue: savedConfig?.payloadSubEnumValue ?? defaultPreset.payloadSubEnumValue,
    payloadPositionIndex: savedConfig?.payloadPositionIndex ?? defaultPreset.payloadPositionIndex,
  };
}

function saveDispatchConfig() {
  Storage.set(ROUTE_DISPATCH_STORAGE_KEY, {
    baseUrl: dispatchForm.baseUrl,
    devicePresetKey: dispatchForm.devicePresetKey,
    droneEnumValue: dispatchForm.droneEnumValue,
    droneSubEnumValue: dispatchForm.droneSubEnumValue,
    payloadEnumValue: dispatchForm.payloadEnumValue,
    payloadSubEnumValue: dispatchForm.payloadSubEnumValue,
    payloadPositionIndex: dispatchForm.payloadPositionIndex,
  });
}

function normalizeDispatchBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function getWaylineResponseMessage(data: any) {
  return data?.msg || data?.message || data?.error || data?.detail || "";
}

function resetDispatchAuthState() {
  dispatchForm.workspaceId = "";
  dispatchToken.value = "";
  dispatchWorkspaceName.value = "";
  dispatchAuthError.value = "";
}

async function loadRouteState() {
  plannerLoading.value = false;
  dispatchDialogVisible.value = false;
  areaSelectionStart.value = null;
  baseMapMode.value = "standard";

  const persistedRoute = getPersistedRouteRecordById(routeId.value);
  const draftRoute = getRouteDraftById(routeId.value);
  const sourceRoute = isDraftRoute.value
    ? (draftRoute ?? persistedRoute)
    : (persistedRoute ?? draftRoute);

  if (!sourceRoute) {
    activeDraft.value = null;
    draftSnapshot.value = null;
    return;
  }

  activeDraft.value = cloneRouteRecord(sourceRoute);
  draftSnapshot.value = cloneRouteRecord(sourceRoute);

  await nextTick();
  window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 160);
}

async function resolveDispatchContext(showSuccess = false) {
  const baseUrl = normalizeDispatchBaseUrl(dispatchForm.baseUrl);
  if (!baseUrl) throw new Error("请填写后端地址");

  dispatchAuthLoading.value = true;
  resetDispatchAuthState();

  try {
    const loginResponse = await axios.post<WaylineLoginResponse>(
      `${baseUrl}/manage/api/v1/login`,
      WAYLINE_LOGIN_PAYLOAD,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );
    const loginData = loginResponse.data;
    const loginCode = Number(loginData?.code ?? 0);
    if (!Number.isNaN(loginCode) && loginCode !== 0) {
      throw new Error(getWaylineResponseMessage(loginData) || "自动登录失败");
    }

    const token =
      loginData?.data?.access_token || loginData?.data?.accessToken || loginData?.data?.token || "";
    if (!token) {
      throw new Error("后端未返回 x-auth-token");
    }

    dispatchToken.value = token;

    const workspaceResponse = await axios.get<CurrentWorkspaceResponse>(
      `${baseUrl}/manage/api/v1/workspaces/current`,
      {
        headers: { "x-auth-token": token },
        timeout: 15000,
      }
    );
    const workspaceData = workspaceResponse.data;
    const workspaceCode = Number(workspaceData?.code ?? 0);
    if (!Number.isNaN(workspaceCode) && workspaceCode !== 0) {
      throw new Error(getWaylineResponseMessage(workspaceData) || "获取当前工作区失败");
    }

    const workspaceId = workspaceData?.data?.workspace_id || workspaceData?.data?.workspaceId || "";
    if (!workspaceId) {
      throw new Error("后端未返回工作区 ID");
    }

    dispatchForm.baseUrl = baseUrl;
    dispatchForm.workspaceId = workspaceId;
    dispatchWorkspaceName.value =
      workspaceData?.data?.workspace_name || workspaceData?.data?.workspaceName || "";

    if (showSuccess) {
      ElMessage.success("已自动获取当前工作区");
    }

    return {
      baseUrl,
      token,
      workspaceId,
    };
  } catch (error: any) {
    console.log(error);
  } finally {
    dispatchAuthLoading.value = false;
  }
}

function returnToList() {
  router.push("/flight/route");
}

function handleDevicePresetChange(presetKey: string) {
  const preset = WAYLINE_DEVICE_PRESETS.find((item) => item.key === presetKey);
  if (!preset) return;

  dispatchForm.droneEnumValue = preset.droneEnumValue;
  dispatchForm.droneSubEnumValue = preset.droneSubEnumValue;
  dispatchForm.payloadEnumValue = preset.payloadEnumValue;
  dispatchForm.payloadSubEnumValue = preset.payloadSubEnumValue;
  dispatchForm.payloadPositionIndex = preset.payloadPositionIndex;
}

async function handleRefreshDispatchContext() {
  try {
    await resolveDispatchContext(true);
  } catch {
    // error handled by state
  }
}

function handleBaseMapChange(mode: BaseMapMode) {
  baseMapMode.value = mode;
  if (mode === "terrain" && !hasTerrainToken.value) {
    ElMessage.info("未配置 VITE_CESIUM_ION_TOKEN，将以标准底图展示地形模式。");
  }
}

function handleRouteTypeChange(type: RouteType) {
  if (!activeDraft.value || activeDraft.value.routeType === type) return;
  activeDraft.value.routeType = type;
  activeDraft.value.points = [];
  areaSelectionStart.value = null;
  activeDraft.value.loopConfig.targetPoint =
    type === RouteType.LOOP
      ? createLoopTargetPoint(activeDraft.value.loopConfig.flightHeight)
      : null;
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

function openDispatchDialog() {
  if (!activeDraft.value) return;
  if (!validateCurrentDraft(activeDraft.value)) return;

  dispatchDialogVisible.value = true;
  void resolveDispatchContext().catch(() => undefined);
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
    savedDraft.code = savedDraft.code || savedDraft.id;
    savedDraft.persisted = true;
    savedDraft.updatedAt = formatDateTime(new Date());

    savePersistedRouteRecord(savedDraft);
    removeRouteDraft(savedDraft.id);
    areaSelectionStart.value = null;

    if (isDraftRoute.value) {
      await router.replace({
        name: "FlightRouteDetail",
        params: { id: savedDraft.id },
      });
    } else {
      activeDraft.value = cloneRouteRecord(savedDraft);
      draftSnapshot.value = cloneRouteRecord(savedDraft);
    }

    ElMessage.success("航线保存成功");
  } finally {
    saveLoading.value = false;
  }
}

function getDispatchDevicePreset(): WaylineDevicePreset {
  const preset = WAYLINE_DEVICE_PRESETS.find((item) => item.key === dispatchForm.devicePresetKey);
  return {
    ...(preset || WAYLINE_DEVICE_PRESETS[0]),
    droneEnumValue: dispatchForm.droneEnumValue,
    droneSubEnumValue: dispatchForm.droneSubEnumValue,
    payloadEnumValue: dispatchForm.payloadEnumValue,
    payloadSubEnumValue: dispatchForm.payloadSubEnumValue,
    payloadPositionIndex: dispatchForm.payloadPositionIndex,
  };
}

async function handleDispatchRoute() {
  if (!activeDraft.value) return;
  if (!validateCurrentDraft(activeDraft.value)) return;
  if (!dispatchForm.baseUrl.trim()) return void ElMessage.warning("请填写后端地址");

  dispatchLoading.value = true;

  try {
    const dispatchContext = await resolveDispatchContext();
    const kmzFile = await buildWaylineKmzFile(activeDraft.value, {
      fileName: dispatchFileName.value,
      author: activeDraft.value.creatorName || "系统用户",
      device: getDispatchDevicePreset(),
    });

    const response = await WaylineAPI.uploadKmz({
      baseUrl: dispatchContext?.baseUrl || "",
      workspaceId: dispatchContext?.workspaceId || "",
      token: dispatchContext?.token || "",
      file: kmzFile,
    });

    saveDispatchConfig();
    dispatchDialogVisible.value = false;
    ElMessage.success(response?.msg || response?.message || "航线下发成功");
  } catch (error: any) {
    ElMessage.error(error?.message || "航线下发失败");
  } finally {
    dispatchLoading.value = false;
  }
}

function validateCurrentDraft(draft: RouteRecordModel): boolean {
  if (!draft.routeName.trim()) return (ElMessage.warning("航线名称不能为空"), false);
  if (!draft.department.trim()) return (ElMessage.warning("所属部门不能为空"), false);
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

watch(
  () => dispatchForm.baseUrl,
  (value, oldValue) => {
    if (normalizeDispatchBaseUrl(value) === normalizeDispatchBaseUrl(oldValue || "")) {
      return;
    }
    resetDispatchAuthState();
  }
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

.planner-page__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
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

  .planner-page__side-col {
    margin-bottom: 12px;
  }

  .planner-page__body {
    height: auto !important;
  }
}
</style>
