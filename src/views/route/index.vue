<template>
  <div class="route-manager app-container">
    <template v-if="pageMode === 'list'">
      <section class="route-filter-panel">
        <div class="route-filter-panel__title">
          <span class="route-filter-panel__bar"></span>
          <div>
            <h2>航线管理</h2>
            <p>按照原型效果构建点状、面状、环状航线管理，并接入 Cesium 规划工作台。</p>
          </div>
        </div>

        <el-form :model="filterForm" label-position="top" class="route-filter-form">
          <div class="route-filter-form__grid">
            <el-form-item label="航线名称">
              <el-input v-model="filterForm.routeName" placeholder="请输入航线名称" clearable />
            </el-form-item>
            <el-form-item label="航线类型">
              <el-select
                v-model="filterForm.routeType"
                placeholder="全部类型"
                clearable
                :teleported="false"
              >
                <el-option
                  v-for="option in routeTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="创建人">
              <el-input v-model="filterForm.creatorName" placeholder="请输入创建人" clearable />
            </el-form-item>
            <el-form-item label="所属部门">
              <el-input v-model="filterForm.department" placeholder="请输入所属部门" clearable />
            </el-form-item>
            <el-form-item label="更新时间">
              <el-date-picker
                v-model="filterForm.updatedRange"
                type="daterange"
                :teleported="false"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                range-separator="至"
              />
            </el-form-item>
          </div>

          <div class="route-filter-form__actions">
            <el-button type="primary" class="route-primary-btn" @click="loadRouteList">
              查 询
            </el-button>
            <el-button class="route-secondary-btn" @click="resetFilterForm">重 置</el-button>
          </div>
        </el-form>
      </section>

      <section class="route-list-toolbar">
        <div class="route-list-toolbar__left">
          <span class="route-total-tag">共 {{ totalCount }} 条航线</span>
        </div>
        <div class="route-list-toolbar__right">
          <el-button type="primary" class="route-primary-btn" @click="openCreateDialog">
            + 新 增
          </el-button>
        </div>
      </section>

      <div v-loading="listLoading" class="route-list-state">
        <section v-if="filteredRoutes.length > 0" class="route-card-grid">
          <article v-for="route in filteredRoutes" :key="route.id" class="route-card">
            <div class="route-card__preview" :class="`route-card__preview--${route.routeType}`">
              <svg viewBox="0 0 220 124" class="route-card__svg">
                <g v-if="route.routeType === routeTypeEnum.POINT">
                  <polyline
                    points="18,92 56,50 98,66 140,34 182,48 202,74"
                    class="route-card__line"
                  />
                  <circle cx="18" cy="92" r="5" class="route-card__node" />
                  <circle cx="56" cy="50" r="5" class="route-card__node" />
                  <circle cx="98" cy="66" r="5" class="route-card__node" />
                  <circle cx="140" cy="34" r="5" class="route-card__node" />
                  <circle cx="182" cy="48" r="5" class="route-card__node" />
                  <circle cx="202" cy="74" r="5" class="route-card__node" />
                </g>
                <g v-else-if="route.routeType === routeTypeEnum.AREA">
                  <polygon points="34,28 182,24 194,92 44,98" class="route-card__polygon" />
                  <line x1="56" y1="36" x2="170" y2="34" class="route-card__sweep" />
                  <line x1="54" y1="54" x2="176" y2="52" class="route-card__sweep" />
                  <line x1="50" y1="72" x2="182" y2="70" class="route-card__sweep" />
                  <line x1="46" y1="88" x2="188" y2="86" class="route-card__sweep" />
                </g>
                <g v-else>
                  <circle cx="110" cy="62" r="38" class="route-card__orbit" />
                  <circle cx="110" cy="62" r="6" class="route-card__target" />
                  <circle cx="148" cy="62" r="5" class="route-card__node" />
                </g>
              </svg>
            </div>

            <div class="route-card__body">
              <div class="route-card__body-head">
                <div>
                  <h3>{{ route.routeName }}</h3>
                  <p>所属部门：{{ route.department || "未配置" }}</p>
                </div>
                <span class="route-type-chip">{{ getRouteTypeLabel(route.routeType) }}</span>
              </div>

              <div class="route-card__meta">
                <span>机型：{{ route.droneModel }}</span>
                <span>创建人：{{ route.creatorName || "—" }}</span>
                <span>更新时间：{{ route.updatedAt }}</span>
              </div>

              <div class="route-card__stats">
                <div
                  v-for="item in getRouteCardStats(route)"
                  :key="item.label"
                  class="route-card__stat"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>

              <div class="route-card__actions route-chip-group">
                <el-button link type="primary" @click="editRoute(route)">编辑</el-button>
                <el-button link type="primary" @click="openPreviewFromList(route)">规划</el-button>
                <el-button link type="danger" @click="handleDeleteRoute(route)">删除</el-button>
              </div>
            </div>
          </article>
        </section>

        <el-empty v-else description="暂无符合条件的航线数据" />
      </div>

      <el-dialog
        v-model="createDialogVisible"
        width="720px"
        class="route-create-dialog"
        :teleported="false"
        modal-class="route-create-dialog-mask"
        destroy-on-close
      >
        <template #header>
          <div class="route-create-dialog__header">
            <span class="route-create-dialog__bar"></span>
            <span>新增航线</span>
          </div>
        </template>

        <div class="route-create-dialog__content">
          <el-form :model="createForm" label-position="top">
            <div class="route-create-dialog__grid">
              <el-form-item label="航线名称">
                <el-input v-model="createForm.routeName" placeholder="请输入航线名称" />
              </el-form-item>
              <el-form-item label="所属部门">
                <el-input v-model="createForm.department" placeholder="请输入所属部门" />
              </el-form-item>
            </div>
          </el-form>

          <div class="route-create-dialog__types">
            <button
              v-for="option in routeTypeOptions"
              :key="option.value"
              type="button"
              class="dialog-type-card"
              :class="{ 'is-active': createForm.routeType === option.value }"
              @click="createForm.routeType = option.value"
            >
              <span class="dialog-type-card__title">{{ option.label }}</span>
              <span class="dialog-type-card__desc">{{ option.description }}</span>
            </button>
          </div>
        </div>

        <template #footer>
          <div class="route-create-dialog__footer">
            <el-button class="route-secondary-btn" @click="createDialogVisible = false">
              取 消
            </el-button>
            <el-button type="primary" class="route-primary-btn" @click="startCreate">
              确 定
            </el-button>
          </div>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="activeDraft">
      <section v-loading="plannerLoading" class="planner-shell">
        <header class="planner-shell__header">
          <div class="planner-shell__header-left">
            <button type="button" class="planner-back-btn" @click="returnToList">返回列表</button>
            <div>
              <h2>{{ activeDraft.routeName }}</h2>
              <p>
                {{ activeDraft.department || "未配置部门" }} ·
                {{ getRouteTypeLabel(activeDraft.routeType) }}
              </p>
            </div>
          </div>

          <div class="planner-shell__header-right">
            <div class="planner-chip-group">
              <button
                v-for="option in routeTypeOptions"
                :key="option.value"
                type="button"
                class="planner-chip"
                :class="{ 'is-active': activeDraft.routeType === option.value }"
                @click="handleRouteTypeChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <div class="planner-chip-group">
              <button
                v-for="option in baseMapOptions"
                :key="option.value"
                type="button"
                class="planner-chip planner-chip--map"
                :class="{ 'is-active': baseMapMode === option.value }"
                @click="handleBaseMapChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </header>

        <div class="planner-shell__body">
          <RoutePlannerSidebar
            class="planner-shell__side"
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

          <div class="planner-shell__map-wrap">
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
        </div>
      </section>
    </template>

    <el-dialog
      v-model="dispatchDialogVisible"
      width="760px"
      class="route-create-dialog route-dispatch-dialog"
      :teleported="false"
      modal-class="route-create-dialog-mask"
    >
      <template #header>
        <div class="route-create-dialog__header">
          <span class="route-create-dialog__bar"></span>
          <span>下发航线</span>
        </div>
      </template>

      <div class="route-create-dialog__content">
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
                :teleported="false"
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
        <div class="route-create-dialog__footer">
          <el-button class="route-secondary-btn" @click="dispatchDialogVisible = false">
            取 消
          </el-button>
          <el-button
            type="primary"
            class="route-primary-btn"
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
import WaylineAPI from "@/api/flight/wayline";
import { RouteType } from "@/api/flight/types";
import { ThemeMode } from "@/enums";
import { useSettingsStore } from "@/store/modules/settings";
import { Storage } from "@/utils/storage";
import RoutePlannerMap from "./components/RoutePlannerMap.vue";
import RoutePlannerSidebar from "./components/RoutePlannerSidebar.vue";
import { createMockRoutes } from "./mock";
import type {
  BaseMapMode,
  CreateRouteForm,
  PlannerPoint,
  RouteFilterForm,
  RouteRecordModel,
} from "./types";
import {
  buildWaylineKmzFile,
  ensureKmzFileName,
  WAYLINE_DEVICE_PRESETS,
  type WaylineDevicePreset,
} from "./wayline-kmz";
import {
  buildAreaRectangle,
  cloneRouteRecord,
  createEmptyRoute,
  createLoopTargetPoint,
  createPlannerPoint,
  createRouteDraftId,
  formatDateTime,
  getRouteInstruction,
  getRouteStatItems,
  getRouteTypeLabel,
  normalizeRouteRecord,
  normalizeWaypointNames,
} from "./utils";

defineOptions({ name: "RouteManagerPage" });

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

const settingsStore = useSettingsStore();
const ROUTE_STORAGE_KEY = "vea:route:planner_records";
const ROUTE_DISPATCH_STORAGE_KEY = "vea:route:planner_dispatch_config";
const DEFAULT_WAYLINE_BASE_URL = "http://192.168.3.26:6789";
const WAYLINE_LOGIN_PAYLOAD = Object.freeze({
  username: "adminPC",
  password: "adminPC",
  flag: 1,
});
const routeTypeEnum = RouteType;
const routeTypeOptions = [
  {
    value: RouteType.POINT,
    label: "点状航线",
    description: "适合单点巡检、道路卡口和离散目标采集。",
  },
  { value: RouteType.AREA, label: "面状航线", description: "适合测绘建模、林场巡护和大范围巡检。" },
  {
    value: RouteType.LOOP,
    label: "环状航线",
    description: "适合建筑环拍、文旅宣传和重点目标展示。",
  },
] as const;
const baseMapOptions = [
  { value: "standard", label: "标准地图" },
  { value: "satellite", label: "卫星地图" },
  { value: "terrain", label: "地形图" },
] as const satisfies Array<{ value: BaseMapMode; label: string }>;

const routeRecords = ref<RouteRecordModel[]>(loadRouteRecords());
const createDialogVisible = ref(false);
const dispatchDialogVisible = ref(false);
const pageMode = ref<"list" | "planner">("list");
const activeDraft = ref<RouteRecordModel | null>(null);
const draftSnapshot = ref<RouteRecordModel | null>(null);
const areaSelectionStart = ref<PlannerPoint | null>(null);
const baseMapMode = ref<BaseMapMode>("standard");
const plannerMapRef = ref<PlannerMapExpose | null>(null);
const listLoading = ref(false);
const plannerLoading = ref(false);
const dispatchLoading = ref(false);
const dispatchAuthLoading = ref(false);
const saveLoading = ref(false);
const dispatchToken = ref("");
const dispatchWorkspaceName = ref("");
const dispatchAuthError = ref("");

const filterForm = reactive<RouteFilterForm>({
  routeName: "",
  creatorName: "",
  department: "",
  routeType: undefined,
  updatedRange: [],
});
const createForm = reactive<CreateRouteForm>({
  routeName: "",
  department: "",
  routeType: RouteType.POINT,
});
const dispatchForm = reactive<RouteDispatchForm>(createDispatchForm());

const filteredRoutes = computed(() => {
  return routeRecords.value.filter((route) => {
    if (filterForm.routeName && !route.routeName.includes(filterForm.routeName.trim()))
      return false;
    if (filterForm.routeType && route.routeType !== filterForm.routeType) return false;
    if (filterForm.creatorName && !route.creatorName.includes(filterForm.creatorName.trim()))
      return false;
    if (filterForm.department && !route.department.includes(filterForm.department.trim()))
      return false;
    if (filterForm.updatedRange.length === 2) {
      const [start, end] = filterForm.updatedRange;
      if (route.updatedAt < start || route.updatedAt > end) return false;
    }
    return true;
  });
});

const totalCount = computed(() => filteredRoutes.value.length);
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

function getRouteCardStats(route: RouteRecordModel) {
  return getRouteStatItems(route);
}

function loadRouteRecords(): RouteRecordModel[] {
  const savedRoutes = Storage.get<RouteRecordModel[] | null>(ROUTE_STORAGE_KEY, null);
  if (Array.isArray(savedRoutes)) {
    const normalizedRoutes = savedRoutes.map((route) => normalizeRouteRecord(route));
    persistRouteRecords(normalizedRoutes);
    return normalizedRoutes;
  }

  const defaultRoutes = createMockRoutes();
  persistRouteRecords(defaultRoutes);
  return defaultRoutes;
}

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

function persistRouteRecords(records: RouteRecordModel[]) {
  Storage.set(ROUTE_STORAGE_KEY, records);
}

watch(
  routeRecords,
  (records) => {
    persistRouteRecords(records);
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

function loadRouteList() {
  listLoading.value = false;
}

function openCreateDialog() {
  createForm.routeName = "";
  createForm.department = "";
  createForm.routeType = RouteType.POINT;
  createDialogVisible.value = true;
}

function resetFilterForm() {
  filterForm.routeName = "";
  filterForm.creatorName = "";
  filterForm.department = "";
  filterForm.routeType = undefined;
  filterForm.updatedRange = [];
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
    // resetDispatchAuthState();
    // const message = error?.message || "自动获取下发凭据失败";
    // dispatchAuthError.value = message;
    // throw new Error(message);
  } finally {
    dispatchAuthLoading.value = false;
  }
}

async function handleRefreshDispatchContext() {
  try {
    await resolveDispatchContext(true);
  } catch {
    // message handled in resolveDispatchContext caller state
  }
}

async function startCreate() {
  if (!createForm.routeName.trim()) return ElMessage.warning("请输入航线名称");
  if (!createForm.department.trim()) return ElMessage.warning("请输入所属部门");

  const loopTemplate = createEmptyRoute({ routeType: RouteType.LOOP }).loopConfig;
  const draft = createEmptyRoute({
    id: createRouteDraftId(),
    routeName: createForm.routeName.trim(),
    department: createForm.department.trim(),
    routeType: createForm.routeType,
    loopConfig:
      createForm.routeType === RouteType.LOOP
        ? { ...loopTemplate, targetPoint: createLoopTargetPoint(loopTemplate.flightHeight) }
        : { ...loopTemplate, targetPoint: null },
  });

  createDialogVisible.value = false;
  await enterPlanner(draft);
}

async function editRoute(route: RouteRecordModel) {
  await enterPlanner(route);
}
async function openPreviewFromList(route: RouteRecordModel) {
  await enterPlanner(route);
  window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 160);
}

function returnToList() {
  pageMode.value = "list";
  activeDraft.value = null;
  draftSnapshot.value = null;
  areaSelectionStart.value = null;
}

async function handleDeleteRoute(route: RouteRecordModel) {
  try {
    await ElMessageBox.confirm(`确认删除航线【${route.routeName}】吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    routeRecords.value = routeRecords.value.filter((item) => item.id !== route.id);
    if (activeDraft.value?.id === route.id) returnToList();
    ElMessage.success("删除成功");
  } catch {
    // 用户取消
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
  if (activeDraft.value.routeType === RouteType.LOOP)
    activeDraft.value.loopConfig.targetPoint = null;
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
  const savedDraft = cloneRouteRecord(activeDraft.value);
  savedDraft.code = savedDraft.code || savedDraft.id;
  savedDraft.persisted = true;
  savedDraft.updatedAt = formatDateTime(new Date());

  upsertRouteRecord(savedDraft);
  activeDraft.value = cloneRouteRecord(savedDraft);
  draftSnapshot.value = cloneRouteRecord(savedDraft);
  areaSelectionStart.value = null;
  saveLoading.value = false;
  ElMessage.success("航线保存成功");
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
  if (draft.routeType === RouteType.POINT && draft.points.length < 2)
    return (ElMessage.warning("点状航线至少需要 2 个航点"), false);
  if (draft.routeType === RouteType.AREA && draft.points.length < 4)
    return (ElMessage.warning("面状航线请先完成范围框选"), false);
  if (draft.routeType === RouteType.LOOP && !draft.loopConfig.targetPoint)
    return (ElMessage.warning("请先设置环绕中心"), false);
  return true;
}

async function enterPlanner(route: RouteRecordModel) {
  plannerLoading.value = false;
  pageMode.value = "planner";
  areaSelectionStart.value = null;
  baseMapMode.value = "standard";
  activeDraft.value = cloneRouteRecord(route);
  draftSnapshot.value = cloneRouteRecord(route);
  await nextTick();
  window.setTimeout(() => plannerMapRef.value?.flyToRoute(), 160);
}

function upsertRouteRecord(route: RouteRecordModel) {
  const index = routeRecords.value.findIndex((item) =>
    route.code && item.code ? item.code === route.code : item.id === route.id
  );
  if (index >= 0) {
    routeRecords.value.splice(index, 1, route);
    return;
  }
  routeRecords.value.unshift(route);
}
</script>

<style scoped lang="scss">
.route-manager {
  --route-primary: #0abaff;
  --route-accent: #51f4f3;
  --route-danger: #ff6666;
  --route-warning: #fba625;
  --route-primary-gradient: linear-gradient(90deg, #0abaff 0%, #51f4f3 100%);
  --route-page-bg: radial-gradient(
    circle at top left,
    rgba(81, 244, 243, 0.16) 0%,
    #ffffff 34%,
    #eef5ff 100%
  );
  --route-page-outline: rgba(10, 186, 255, 0.1);
  --route-panel-bg: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(245, 249, 255, 0.98) 100%
  );
  --route-card-bg: rgba(255, 255, 255, 0.96);
  --route-subtle-bg: rgba(10, 186, 255, 0.06);
  --route-chip-bg: rgba(10, 186, 255, 0.1);
  --route-chip-text: #24457a;
  --route-overlay-bg: rgba(255, 255, 255, 0.9);
  --route-input-bg: rgba(255, 255, 255, 0.98);
  --route-map-bg: linear-gradient(180deg, #dfeeff 0%, #f8fbff 100%);
  --route-mask-bg: rgba(6, 18, 35, 0.28);
  --route-text-primary: #1f3256;
  --route-text-secondary: rgba(31, 50, 86, 0.72);
  --route-text-muted: rgba(31, 50, 86, 0.58);
  --route-border: rgba(36, 69, 122, 0.12);
  --route-border-strong: rgba(10, 186, 255, 0.24);
  --route-shadow: 0 14px 32px rgba(36, 69, 122, 0.12);
  position: relative;
  min-height: calc(100vh - 80px);
  padding: 18px;
  color: var(--route-text-primary);
  background: var(--route-page-bg);
  border: 1px solid var(--route-page-outline);
  border-radius: 28px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    color 0.25s ease;
}

:global(html.dark) .route-manager {
  --route-page-bg: radial-gradient(
    circle at top left,
    rgba(10, 186, 255, 0.2) 0%,
    rgba(19, 41, 74, 0.96) 26%,
    rgba(8, 16, 29, 0.98) 100%
  );
  --route-page-outline: rgba(81, 244, 243, 0.12);
  --route-panel-bg: linear-gradient(180deg, rgba(23, 44, 81, 0.94) 0%, rgba(15, 31, 58, 0.92) 100%);
  --route-card-bg: rgba(15, 31, 58, 0.86);
  --route-subtle-bg: rgba(23, 44, 81, 0.72);
  --route-chip-bg: rgba(10, 186, 255, 0.12);
  --route-chip-text: rgba(255, 255, 255, 0.88);
  --route-overlay-bg: rgba(8, 19, 36, 0.9);
  --route-input-bg: rgba(8, 19, 36, 0.92);
  --route-map-bg: linear-gradient(180deg, #10284a 0%, #091628 100%);
  --route-mask-bg: rgba(2, 10, 24, 0.72);
  --route-text-primary: #ffffff;
  --route-text-secondary: rgba(255, 255, 255, 0.72);
  --route-text-muted: rgba(255, 255, 255, 0.58);
  --route-border: rgba(81, 244, 243, 0.14);
  --route-border-strong: rgba(10, 186, 255, 0.3);
  --route-shadow: 0 18px 42px rgba(2, 10, 24, 0.4);
  box-shadow: inset 0 0 0 1px rgba(81, 244, 243, 0.08);
}

.route-filter-panel,
.route-list-toolbar,
.planner-shell__header,
.route-card,
.planner-sidebar,
.planner-shell__map-wrap,
.planner-overlay,
:deep(.el-dialog) {
  background: var(--route-panel-bg);
  border: 1px solid var(--route-border-strong);
  box-shadow: var(--route-shadow);
  backdrop-filter: blur(18px);
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    color 0.25s ease;
}

.route-filter-panel,
.route-list-toolbar,
.planner-shell__header {
  border-radius: 20px;
}

.route-filter-panel {
  padding: 20px;
  margin-bottom: 16px;
}
.route-filter-panel__title {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}
.route-filter-panel__title h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  color: var(--route-text-primary);
}
.route-filter-panel__title p {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--route-text-secondary);
}
.route-filter-panel__bar,
.route-create-dialog__bar {
  width: 4px;
  background: var(--route-primary-gradient);
  border-radius: 999px;
}
.route-filter-panel__bar {
  height: 56px;
}
.route-filter-form__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0 14px;
}
.route-filter-form__actions,
.route-list-toolbar,
.route-chip-group,
.planner-shell__header-left,
.planner-shell__header-right,
.route-card__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.route-filter-form__actions {
  justify-content: flex-end;
  margin-top: 8px;
}
.route-primary-btn,
.route-secondary-btn {
  min-width: 108px;
  height: 40px;
  font-weight: 500;
  border-radius: 999px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}
.route-primary-btn {
  color: #fff;
  background: var(--route-primary-gradient);
  border: none;
  box-shadow: 0 12px 24px rgba(10, 186, 255, 0.24);
}
.route-primary-btn:hover,
.route-primary-btn:focus-visible {
  box-shadow: 0 16px 28px rgba(10, 186, 255, 0.3);
  transform: translateY(-1px);
}
.route-secondary-btn {
  color: var(--route-text-primary);
  background: var(--route-subtle-bg);
  border: 1px solid var(--route-border);
}
.route-secondary-btn:hover,
.route-secondary-btn:focus-visible {
  background: rgba(10, 186, 255, 0.14);
  border-color: var(--route-border-strong);
}
.route-list-toolbar {
  justify-content: space-between;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.route-total-tag {
  padding: 8px 14px;
  font-size: 14px;
  color: var(--route-primary);
  background: var(--route-chip-bg);
  border: 1px solid var(--route-border-strong);
  border-radius: 999px;
}
.route-list-state {
  min-height: 240px;
}
.route-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.route-card {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 18px;
  padding: 18px;
  border-radius: 22px;
  backdrop-filter: blur(12px);
}
.route-card__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 156px;
  border-radius: 18px;
}
.route-card__preview--point {
  background: linear-gradient(135deg, rgba(10, 186, 255, 0.18) 0%, rgba(36, 69, 122, 0.1) 100%);
}
.route-card__preview--area {
  background: linear-gradient(135deg, rgba(81, 244, 243, 0.16) 0%, rgba(36, 69, 122, 0.08) 100%);
}
.route-card__preview--loop {
  background: linear-gradient(135deg, rgba(252, 101, 51, 0.16) 0%, rgba(36, 69, 122, 0.08) 100%);
}
.route-card__svg {
  width: 100%;
  max-width: 220px;
  height: auto;
}
.route-card__line,
.route-card__orbit,
.route-card__sweep {
  fill: none;
  stroke: #51f4f3;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.route-card__polygon {
  fill: rgba(81, 244, 243, 0.16);
  stroke: #51f4f3;
  stroke-width: 3;
}
.route-card__node,
.route-card__target {
  fill: #0abaff;
}
.route-card__target {
  fill: #fc6533;
}
.route-card__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.route-card__body-head {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}
.route-card__body-head h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--route-text-primary);
}
.route-card__body-head p {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--route-text-secondary);
}
.route-type-chip {
  padding: 8px 14px;
  font-size: 14px;
  color: var(--route-primary);
  white-space: nowrap;
  background: var(--route-chip-bg);
  border: 1px solid var(--route-border-strong);
  border-radius: 999px;
}
.route-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
}
.route-card__meta span {
  font-size: 14px;
  color: var(--route-text-secondary);
}
.route-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.route-card__stat {
  padding: 14px;
  background: var(--route-card-bg);
  border: 1px solid var(--route-border);
  border-radius: 16px;
}
.route-card__stat span {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--route-text-secondary);
}
.route-card__stat strong {
  font-size: 24px;
  font-weight: 600;
  color: var(--route-text-primary);
}
.route-card__actions {
  justify-content: flex-end;
  padding-top: 4px;
}
.route-create-dialog__header {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: var(--route-text-primary);
}
.route-create-dialog__bar {
  height: 24px;
}
.route-create-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.route-create-dialog__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
}
.route-create-dialog__grid,
.route-create-dialog__types {
  display: grid;
  gap: 14px;
}
.route-create-dialog__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.route-create-dialog__types {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.route-dispatch-dialog__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.route-dispatch-dialog__summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--route-card-bg);
  border: 1px solid var(--route-border);
  border-radius: 16px;
}
.route-dispatch-dialog__summary-item span {
  font-size: 13px;
  color: var(--route-text-secondary);
}
.route-dispatch-dialog__summary-item strong {
  font-size: 16px;
  font-weight: 500;
  color: var(--route-text-primary);
  word-break: break-all;
}
.route-dispatch-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}
.route-dispatch-dialog__grid--compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.route-dispatch-dialog__status {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 16px;
  color: var(--route-text-secondary);
  background: var(--route-subtle-bg);
  border: 1px solid var(--route-border);
  border-radius: 14px;
}
.route-dispatch-dialog__status.is-error {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, var(--route-border));
}
.route-dispatch-dialog__tip {
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--route-text-secondary);
  background: var(--route-subtle-bg);
  border: 1px solid var(--route-border);
  border-radius: 14px;
}
.dialog-type-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  color: var(--route-text-primary);
  text-align: left;
  cursor: pointer;
  background: var(--route-card-bg);
  border: 1px solid var(--route-border);
  border-radius: 18px;
  box-shadow: inset 0 0 0 1px transparent;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}
.dialog-type-card:hover {
  border-color: var(--route-border-strong);
  box-shadow: inset 0 0 0 1px rgba(81, 244, 243, 0.12);
  transform: translateY(-1px);
}
.dialog-type-card.is-active {
  background: linear-gradient(180deg, rgba(10, 186, 255, 0.16) 0%, rgba(15, 31, 58, 0.08) 100%);
  border-color: rgba(81, 244, 243, 0.48);
  box-shadow: inset 0 0 0 1px rgba(81, 244, 243, 0.16);
}
.dialog-type-card__title {
  font-size: 18px;
  font-weight: 500;
  color: var(--route-text-primary);
}
.dialog-type-card__desc {
  font-size: 14px;
  color: var(--route-text-secondary);
}
.planner-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.planner-shell__header {
  justify-content: space-between;
  padding: 16px 18px;
}
.planner-shell__header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: var(--route-text-primary);
}
.planner-shell__header p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--route-text-secondary);
}
.planner-back-btn,
.planner-chip {
  padding: 8px 16px;
  color: var(--route-chip-text);
  cursor: pointer;
  background: var(--route-chip-bg);
  border: 1px solid var(--route-border);
  border-radius: 999px;
}
.planner-chip.is-active,
.planner-back-btn:hover,
.planner-chip:hover {
  color: #fff;
  background: var(--route-primary-gradient);
  border-color: transparent;
}
.planner-shell__body {
  display: grid;
  grid-template-columns: 430px 1fr;
  gap: 16px;
  align-items: stretch;
  height: calc(100vh - 220px);
  min-height: 620px;
  overflow: hidden;
}
.planner-shell__side,
.planner-shell__map-wrap {
  height: 100%;
  min-height: 0;
}
.planner-shell__map-wrap {
  position: relative;
  padding: 10px;
  overflow: hidden;
  border-radius: 24px;
}
.planner-overlay {
  position: absolute;
  z-index: 5;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--route-text-primary);
  background: var(--route-overlay-bg);
  border: 1px solid var(--route-border);
  border-radius: 999px;
  backdrop-filter: blur(8px);
}
.planner-overlay--hint {
  bottom: 18px;
  left: 18px;
}
.planner-overlay--warn {
  top: 18px;
  left: 18px;
  color: var(--route-warning);
  border-color: rgba(255, 196, 58, 0.24);
}
:deep(.route-create-dialog-mask) {
  background: var(--route-mask-bg);
  backdrop-filter: blur(10px);
}
:deep(.el-dialog) {
  color: var(--route-text-primary);
  background: var(--route-panel-bg);
  border: 1px solid var(--route-border-strong);
  border-radius: 22px;
}
:deep(.el-dialog__header) {
  padding-bottom: 0;
}
:deep(.el-dialog__body),
:deep(.el-dialog__title),
:deep(.el-dialog__headerbtn .el-dialog__close),
:deep(.el-form-item__content) {
  color: var(--route-text-primary);
}
:deep(.el-dialog__footer) {
  padding-top: 18px;
  border-top: 1px solid var(--route-border);
}
:deep(.el-form-item__label) {
  color: var(--route-primary);
}
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper),
:deep(.el-date-editor .el-input__wrapper) {
  background: var(--route-input-bg);
  border-color: var(--route-border-strong);
  box-shadow: inset 0 0 0 1px var(--route-border-strong);
}
:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-date-editor .el-input__wrapper:hover) {
  box-shadow: inset 0 0 0 1px rgba(10, 186, 255, 0.36);
}
:deep(.el-input__wrapper:focus-within),
:deep(.el-select__wrapper.is-focused),
:deep(.el-date-editor .el-input__wrapper:focus-within) {
  box-shadow:
    inset 0 0 0 1px rgba(10, 186, 255, 0.45),
    0 0 0 4px rgba(10, 186, 255, 0.12);
}
:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__selected-item),
:deep(.el-range-input) {
  color: var(--route-text-primary);
}
:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder),
:deep(.el-range-input::placeholder),
:deep(.el-select__placeholder),
:deep(.el-input__icon),
:deep(.el-select__caret),
:deep(.el-range-separator),
:deep(.el-range__icon),
:deep(.el-input__prefix-inner),
:deep(.el-input__suffix-inner) {
  color: var(--route-text-muted);
}
:deep(.el-button--primary.is-link) {
  color: var(--route-primary);
}
:deep(.el-button--danger.is-link) {
  color: var(--route-danger);
}
:deep(.el-empty__description p) {
  color: var(--route-text-secondary);
}

@media (max-width: 1500px) {
  .route-filter-form__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .route-card-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .planner-shell__body {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    min-height: auto;
    overflow: visible;
  }
}

@media (max-width: 1080px) {
  .route-filter-form__grid,
  .route-create-dialog__grid,
  .route-create-dialog__types,
  .route-dispatch-dialog__summary,
  .route-dispatch-dialog__grid,
  .route-dispatch-dialog__grid--compact,
  .route-card,
  .route-card__stats,
  .planner-shell__header,
  .planner-shell__header-left,
  .planner-shell__header-right {
    flex-direction: column;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }

  .route-card {
    display: flex;
    flex-direction: column;
  }
}
</style>
