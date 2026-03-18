<template>
  <div class="app-container route-manager">
    <template v-if="pageMode === 'list'">
      <div class="filter-section">
        <el-form :model="filterForm" :inline="true" class="route-filter-form">
          <el-form-item label="航线名称">
            <el-input v-model="filterForm.routeName" placeholder="请输入航线名称" clearable />
          </el-form-item>
          <el-form-item label="航线类型">
            <el-select
              v-model="filterForm.routeType"
              placeholder="全部类型"
              clearable
              style="width: 180px"
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
              value-format="YYYY-MM-DD HH:mm:ss"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              range-separator="至"
            />
          </el-form-item>
          <el-form-item class="search-buttons">
            <el-button type="primary" icon="search" @click="handleQuery">查询</el-button>
            <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-card shadow="hover" class="table-section">
        <div class="table-section__toolbar">
          <div class="table-section__toolbar--actions">
            <el-button type="primary" icon="plus" @click="openCreateDialog">新增</el-button>
          </div>
          <div class="table-section__toolbar--right">
            <el-tag type="info">共 {{ totalCount }} 条航线</el-tag>
          </div>
        </div>

        <div v-loading="listLoading" class="table-section__content route-list-state">
          <section v-if="pagedRoutes.length > 0" class="route-card-grid">
            <article v-for="route in pagedRoutes" :key="route.id" class="route-card">
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

                <div class="route-card__actions">
                  <el-button link type="primary" @click="editRoute(route)">编辑</el-button>
                  <el-button link type="primary" @click="openPreviewFromList(route)">
                    规划
                  </el-button>
                  <el-button link type="danger" @click="handleDeleteRoute(route)">删除</el-button>
                </div>
              </div>
            </article>
          </section>

          <el-empty v-else description="暂无符合条件的航线数据" />
        </div>

        <pagination
          v-if="totalCount > 0"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          :total="totalCount"
          @pagination="loadRouteList"
        />
      </el-card>

      <el-dialog
        v-model="createDialogVisible"
        title="新增航线"
        width="600px"
        custom-class="dialog-form-decorated"
        class="route-create-dialog"
        destroy-on-close
      >
        <el-form :model="createForm" label-width="100px">
          <el-form-item label="航线名称">
            <el-input v-model="createForm.routeName" placeholder="请输入航线名称" />
          </el-form-item>
          <el-form-item label="所属部门">
            <el-input v-model="createForm.department" placeholder="请输入所属部门" />
          </el-form-item>
          <el-form-item label="航线类型">
            <div class="route-type-card-group">
              <button
                v-for="option in routeTypeOptions"
                :key="option.value"
                type="button"
                class="route-type-card"
                :class="{ 'is-active': createForm.routeType === option.value }"
                @click="createForm.routeType = option.value"
              >
                <span class="route-type-card__title">{{ option.label }}</span>
                <span class="route-type-card__desc">{{ option.description }}</span>
              </button>
            </div>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="createDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="startCreate">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="activeDraft">
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

        <el-row :gutter="20" class="planner-page__body" style=" align-items: stretch;height: 100%">
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
const queryParams = reactive({
  pageNum: 1,
  pageSize: 6,
});

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
const pagedRoutes = computed(() => {
  const start = (queryParams.pageNum - 1) * queryParams.pageSize;
  const end = start + queryParams.pageSize;
  return filteredRoutes.value.slice(start, end);
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

watch(
  () => totalCount.value,
  (count) => {
    const maxPage = Math.max(1, Math.ceil(count / queryParams.pageSize));
    if (queryParams.pageNum > maxPage) {
      queryParams.pageNum = maxPage;
    }
  }
);

watch(
  () => queryParams.pageSize,
  () => {
    queryParams.pageNum = 1;
  }
);

function loadRouteList() {
  listLoading.value = false;
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadRouteList();
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

function handleResetQuery() {
  resetFilterForm();
  queryParams.pageNum = 1;
  loadRouteList();
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
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  min-height: 0;
}

.route-filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.route-list-state {
  min-height: 240px;
}

.route-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.route-card {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.route-card__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 148px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.route-card__preview--point,
.route-card__preview--area,
.route-card__preview--loop {
  background: var(--el-fill-color-light);
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
  stroke: var(--el-color-primary);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-card__polygon {
  fill: var(--el-color-primary-light-9);
  stroke: var(--el-color-primary);
  stroke-width: 3;
}

.route-card__node,
.route-card__target {
  fill: var(--el-color-primary);
}

.route-card__target {
  fill: var(--el-color-warning);
}

.route-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-card__body-head {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.route-card__body-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.route-card__body-head p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.route-type-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 4px;
}

.route-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.route-card__meta span {
  color: var(--el-text-color-secondary);
}

.route-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.route-card__stat {
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.route-card__stat span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.route-card__stat strong {
  font-size: 16px;
}

.route-card__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.route-type-card-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.route-type-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  transition: border-color 0.2s ease;
}

.route-type-card:hover,
.route-type-card.is-active {
  border-color: var(--el-color-primary);
}

.route-type-card__title {
  font-size: 14px;
  font-weight: 600;
}

.route-type-card__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.planner-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
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
  height: 100%;
  min-height: 0;
  margin: 0;
}

.planner-page__side-col,
.planner-page__map-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.planner-card {
  height: 100%;
  min-height: 0;
}

.planner-card--sidebar :deep(.el-card__body) {
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow-x: hidden;
  overflow-y: auto;
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

@media (max-width: 1280px) {
  .route-card-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .route-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .route-card__stats,
  .route-type-card-group,
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
