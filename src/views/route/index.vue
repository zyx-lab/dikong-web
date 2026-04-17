<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Route Planning Hub</p>
            <h2 class="command-page__title">航线管理</h2>
            <p class="command-page__description">
              统一管理点状、面状与环状航线资产，让值守人员在进入列表前先看清航线规模、规划类型和待处理资源。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">航线资源总览</span>
            <span class="command-page__signal">规划与下发联动</span>
            <span class="command-page__signal">三类航线统一编排</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">航线总量</div>
            <div class="command-page__metric-value">{{ totalCount }}</div>
            <div class="command-page__metric-note">当前筛选条件下的航线资产规模</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">点状航线</div>
            <div class="command-page__metric-value">{{ pointRouteCount }}</div>
            <div class="command-page__metric-note">适合单点巡检与离散目标采集</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">面状航线</div>
            <div class="command-page__metric-value">{{ areaRouteCount }}</div>
            <div class="command-page__metric-note">适合测绘建模与大范围巡护任务</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">环状航线</div>
            <div class="command-page__metric-value">{{ loopRouteCount }}</div>
            <div class="command-page__metric-note">适合环拍展示与重点目标观察</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form ref="queryFormRef" :model="filterForm" :inline="true">
        <el-form-item label="航线名称" prop="routeName">
          <el-input
            v-model="filterForm.routeName"
            placeholder="请输入航线名称"
            clearable
            class="filter-field--lg"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="航线类型" prop="routeType">
          <el-select
            v-model="filterForm.routeType"
            placeholder="全部类型"
            clearable
            class="filter-field"
          >
            <el-option
              v-for="option in routeTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人" prop="creatorName">
          <el-input
            v-model="filterForm.creatorName"
            placeholder="请输入创建人"
            clearable
            class="filter-field"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="创建时间" prop="createdRange">
          <el-date-picker
            v-model="filterForm.createdRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            class="filter-field--lg"
          />
        </el-form-item>
        <el-form-item label="更新时间" prop="updatedRange">
          <el-date-picker
            v-model="filterForm.updatedRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            class="filter-field--lg"
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
          <el-button type="primary" icon="plus" @click="openCreateDialog">新增航线</el-button>
        </div>
        <div class="table-section__toolbar--right">
          <div class="table-toolbar-summary">
            <el-tag type="info">共 {{ totalCount }} 条航线</el-tag>
            <el-tag type="primary">点状 {{ pointRouteCount }}</el-tag>
            <el-tag type="success">面状 {{ areaRouteCount }}</el-tag>
            <el-tag type="warning">环状 {{ loopRouteCount }}</el-tag>
          </div>
        </div>
      </div>

      <div v-loading="listLoading" class="table-section__content">
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
                </div>
                <div class="route-card__head-tags">
                  <el-tag
                    size="small"
                    effect="plain"
                    class="route-status-tag"
                    :type="getRouteUsageStatus(route).tagType"
                  >
                    {{ getRouteUsageStatus(route).label }}
                  </el-tag>
                  <el-tag size="small" effect="plain" class="route-type-tag">
                    {{ getRouteTypeLabel(route.routeType) }}
                  </el-tag>
                </div>
              </div>

              <div class="route-card__meta">
                <span>机型：{{ route.droneModel }}</span>
                <span>创建人：{{ route.creatorName || "-" }}</span>
                <span>创建时间：{{ route.createdAt }}</span>
                <span>更新时间：{{ route.updatedAt }}</span>
              </div>

              <div class="route-card__status" :class="`is-${getRouteUsageStatus(route).state}`">
                <span class="route-card__status-label">当前状态</span>
                <span class="route-card__status-hint">{{ getRouteUsageStatus(route).hint }}</span>
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
                <el-button link type="primary" size="small" @click="openPreviewFromList(route)">
                  规划
                </el-button>
                <el-tooltip
                  :disabled="!getRouteUsageStatus(route).locked"
                  :content="getRouteUsageStatus(route).lockReason"
                  placement="top"
                >
                  <span class="route-card__action-wrap">
                    <el-button
                      link
                      type="primary"
                      icon="edit"
                      size="small"
                      :disabled="getRouteUsageStatus(route).locked"
                      @click="editRoute(route)"
                    >
                      编辑
                    </el-button>
                  </span>
                </el-tooltip>
                <el-tooltip
                  :disabled="!getRouteUsageStatus(route).locked"
                  :content="getRouteUsageStatus(route).lockReason"
                  placement="top"
                >
                  <span class="route-card__action-wrap">
                    <el-button
                      link
                      type="danger"
                      icon="delete"
                      size="small"
                      :disabled="getRouteUsageStatus(route).locked"
                      @click="handleDeleteRoute(route)"
                    >
                      删除
                    </el-button>
                  </span>
                </el-tooltip>
              </div>
            </div>
          </article>
        </section>

        <div v-else class="table-empty-state">
          <el-empty :description="hasActiveFilters ? '当前筛选条件下暂无航线' : '暂无航线数据'" />
          <div v-if="hasActiveFilters" class="table-empty-state__actions">
            <el-button link type="primary" @click="handleResetQuery">清空筛选</el-button>
          </div>
        </div>
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
      :width="dialogWidth"
      align-center
      destroy-on-close
      custom-class="dialog-form-decorated"
      class="dialog-form-decorated"
      @close="closeCreateDialog"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="航线名称" prop="routeName">
          <el-input v-model="createForm.routeName" placeholder="请输入航线名称" />
        </el-form-item>
        <el-form-item label="航线类型" prop="routeType">
          <el-select v-model="createForm.routeType" placeholder="请选择航线类型" class="w-full">
            <el-option
              v-for="option in routeTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeCreateDialog">取消</el-button>
          <el-button type="primary" @click="startCreate">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onMounted, reactive, ref } from "vue";
import { useWindowSize } from "@vueuse/core";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import MissionAPI, { type MissionPageResult, type MissionRead } from "@/api/flight/mission";
import RouteAPI, { type RouteRead } from "@/api/flight/route";
import { RouteType } from "@/api/flight/types";
import { saveRouteDraft } from "./storage";
import { hydrateRouteRecord } from "./route-xml";
import type { CreateRouteForm, RouteFilterForm, RouteRecordModel } from "./types";
import {
  createEmptyRoute,
  createRouteDraftId,
  getRouteStatItems,
  getRouteTypeLabel,
} from "./utils";

defineOptions({ name: "RouteManagerListPage" });

const router = useRouter();
const { width } = useWindowSize();

const routeTypeEnum = RouteType;
const routeTypeOptions = [
  {
    value: RouteType.POINT,
    label: "点状航线",
    description: "适合单点巡检、道路卡口和离散目标采集。",
  },
  {
    value: RouteType.AREA,
    label: "面状航线",
    description: "适合测绘建模、林场巡护和大范围巡检。",
  },
  {
    value: RouteType.LOOP,
    label: "环状航线",
    description: "适合建筑环拍、文旅宣传和重点目标展示。",
  },
] as const;

const queryFormRef = ref<FormInstance>();
const createFormRef = ref<FormInstance>();
const routeRecords = ref<RouteRecordModel[]>([]);
const routeUsageMap = ref<Record<string, RouteUsageStatus>>({});
const createDialogVisible = ref(false);
const listLoading = ref(false);

const filterForm = reactive<RouteFilterForm>({
  routeName: "",
  creatorName: "",
  routeType: undefined,
  createdRange: [],
  updatedRange: [],
});

const createForm = reactive<CreateRouteForm>({
  routeName: "",
  routeType: RouteType.POINT,
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 6,
});

const createRules: FormRules = {
  routeName: [{ required: true, message: "请输入航线名称", trigger: "blur" }],
  routeType: [{ required: true, message: "请选择航线类型", trigger: "change" }],
};

const filteredRoutes = computed(() =>
  routeRecords.value.filter((route) => {
    if (filterForm.routeName && !route.routeName.includes(filterForm.routeName.trim())) {
      return false;
    }
    if (filterForm.routeType && route.routeType !== filterForm.routeType) {
      return false;
    }
    if (filterForm.creatorName && !route.creatorName.includes(filterForm.creatorName.trim())) {
      return false;
    }
    if (filterForm.createdRange.length === 2) {
      const [start, end] = filterForm.createdRange;
      if (route.createdAt < start || route.createdAt > end) {
        return false;
      }
    }
    if (filterForm.updatedRange.length === 2) {
      const [start, end] = filterForm.updatedRange;
      if (route.updatedAt < start || route.updatedAt > end) {
        return false;
      }
    }
    return true;
  })
);

const pagedRoutes = computed(() => {
  const start = (queryParams.pageNum - 1) * queryParams.pageSize;
  const end = start + queryParams.pageSize;
  return filteredRoutes.value.slice(start, end);
});

const totalCount = computed(() => filteredRoutes.value.length);
const pointRouteCount = computed(
  () => filteredRoutes.value.filter((route) => route.routeType === RouteType.POINT).length
);
const areaRouteCount = computed(
  () => filteredRoutes.value.filter((route) => route.routeType === RouteType.AREA).length
);
const loopRouteCount = computed(
  () => filteredRoutes.value.filter((route) => route.routeType === RouteType.LOOP).length
);
const hasActiveFilters = computed(() =>
  Boolean(
    filterForm.routeName ||
    filterForm.creatorName ||
    filterForm.routeType ||
    filterForm.createdRange.length ||
    filterForm.updatedRange.length
  )
);
const dialogWidth = computed(() => (width.value < 768 ? "92%" : "600px"));

type RouteStatusTagType = "success" | "warning" | "danger" | "info" | "primary";
type RouteUsageState = "idle" | "occupied" | "executing";

interface RouteUsageStatus {
  state: RouteUsageState;
  label: string;
  tagType: RouteStatusTagType;
  hint: string;
  lockReason: string;
  locked: boolean;
}

const EXECUTING_MISSION_STATUS = 1;
const COMPLETED_MISSION_STATUS = 2;
const FLYING_MISSION_STATUS = 3;
const EXECUTION_STATUS_BUSY_SET = new Set(["EXECUTING", "RUNNING", "IN_PROGRESS", "FLYING"]);
const IDLE_ROUTE_USAGE_STATUS: RouteUsageStatus = Object.freeze({
  state: "idle",
  label: "空闲",
  tagType: "success",
  hint: "当前未被执行任务占用，可继续编辑和维护。",
  lockReason: "",
  locked: false,
});

function getRouteCardStats(route: RouteRecordModel) {
  return getRouteStatItems(route);
}

function getRouteUsageStatus(route: RouteRecordModel) {
  return routeUsageMap.value[route.id] ?? IDLE_ROUTE_USAGE_STATUS;
}

function createRouteUsageStatus(occupiedMissionCount: number, executingMissionCount: number) {
  if (executingMissionCount > 0) {
    const missionText = executingMissionCount > 1 ? `${executingMissionCount} 个任务` : "1 个任务";

    return {
      state: "executing",
      label: "执行中",
      tagType: "danger",
      hint: `当前有 ${missionText} 正在执行，暂不可编辑或删除。`,
      lockReason: "该航线当前有执行中的任务，暂不可编辑或删除。",
      locked: true,
    } satisfies RouteUsageStatus;
  }

  if (occupiedMissionCount > 0) {
    const missionText = occupiedMissionCount > 1 ? `${occupiedMissionCount} 个任务` : "1 个任务";

    return {
      state: "occupied",
      label: "任务占用",
      tagType: "warning",
      hint: `当前有 ${missionText} 已绑定该航线，暂不可编辑或删除。`,
      lockReason: "该航线已被已绑定无人机的任务占用，暂不可编辑或删除。",
      locked: true,
    } satisfies RouteUsageStatus;
  }

  return IDLE_ROUTE_USAGE_STATUS;
}

function getMissionPageItems(pageResult: MissionPageResult) {
  return pageResult.list ?? pageResult.results ?? [];
}

function getMissionPageTotal(pageResult: MissionPageResult, currentCount: number) {
  return pageResult.total ?? pageResult.count ?? currentCount;
}

function normalizeMissionStatusText(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

function isMissionCompleted(mission: MissionRead) {
  return mission.status === COMPLETED_MISSION_STATUS;
}

function isMissionExecuting(mission: MissionRead) {
  if (mission.status === EXECUTING_MISSION_STATUS || mission.status === FLYING_MISSION_STATUS) {
    return true;
  }

  const executionStatus = normalizeMissionStatusText(mission.execution_status);
  const syncStatus = normalizeMissionStatusText(mission.sync_status);

  return (
    EXECUTION_STATUS_BUSY_SET.has(executionStatus) || EXECUTION_STATUS_BUSY_SET.has(syncStatus)
  );
}

function isMissionOccupyingRoute(mission: MissionRead) {
  return mission.route != null && mission.drone != null && !isMissionCompleted(mission);
}

function ensureCurrentPage() {
  const maxPage = Math.max(1, Math.ceil(filteredRoutes.value.length / queryParams.pageSize));
  if (queryParams.pageNum > maxPage) {
    queryParams.pageNum = maxPage;
  }
}

async function fetchAllRouteSummaries(name?: string) {
  const pageSize = 100;
  const allRoutes: RouteRead[] = [];
  let pageNum = 1;
  let total = Number.POSITIVE_INFINITY;

  while (allRoutes.length < total) {
    const pageResult = await RouteAPI.getPage({
      pageNum,
      pageSize,
      name,
    });

    const currentRoutes = pageResult?.list || [];
    total = pageResult?.total ?? currentRoutes.length;

    if (currentRoutes.length === 0) {
      break;
    }

    allRoutes.push(...currentRoutes);
    pageNum += 1;
  }

  return allRoutes;
}

async function fetchAllMissionSummaries() {
  const pageSize = 100;
  const allMissions: MissionRead[] = [];
  let pageNum = 1;
  let total = Number.POSITIVE_INFINITY;

  while (allMissions.length < total) {
    const pageResult = await MissionAPI.getPage({
      pageNum,
      pageSize,
    });

    const currentMissions = getMissionPageItems(pageResult);
    total = getMissionPageTotal(pageResult, currentMissions.length);

    if (currentMissions.length === 0) {
      break;
    }

    allMissions.push(...currentMissions);
    pageNum += 1;
  }

  return allMissions;
}

async function buildRouteUsageMap(routes: RouteRead[]) {
  if (routes.length === 0) {
    return {};
  }

  const routeIds = new Set(routes.map((route) => route.id));
  const missions = await fetchAllMissionSummaries();
  const routeMissionSummary = new Map<
    number,
    {
      occupiedMissionCount: number;
      executingMissionCount: number;
    }
  >();

  missions.forEach((mission) => {
    if (
      !isMissionOccupyingRoute(mission) ||
      mission.route == null ||
      !routeIds.has(mission.route)
    ) {
      return;
    }

    const currentSummary = routeMissionSummary.get(mission.route) ?? {
      occupiedMissionCount: 0,
      executingMissionCount: 0,
    };

    currentSummary.occupiedMissionCount += 1;

    if (isMissionExecuting(mission)) {
      currentSummary.executingMissionCount += 1;
    }

    routeMissionSummary.set(mission.route, currentSummary);
  });

  return routes.reduce<Record<string, RouteUsageStatus>>((statusMap, route) => {
    const summary = routeMissionSummary.get(route.id);
    statusMap[String(route.id)] = createRouteUsageStatus(
      summary?.occupiedMissionCount ?? 0,
      summary?.executingMissionCount ?? 0
    );
    return statusMap;
  }, {});
}

async function hydrateRouteRecords(routes: RouteRead[]) {
  return Promise.all(
    routes.map(async (route) => {
      try {
        const kmzResponse = await RouteAPI.getKmz(route.id);
        return await hydrateRouteRecord(route, kmzResponse.data);
      } catch {
        return hydrateRouteRecord(route);
      }
    })
  );
}

async function loadRouteList() {
  listLoading.value = true;

  try {
    const routeName = filterForm.routeName.trim();
    const summaries = await fetchAllRouteSummaries(routeName || undefined);
    const [hydratedRoutes, usageMap] = await Promise.all([
      hydrateRouteRecords(summaries),
      buildRouteUsageMap(summaries).catch(() => {
        ElMessage.warning("任务占用状态加载失败，当前按可编辑状态展示航线。");
        return summaries.reduce<Record<string, RouteUsageStatus>>((statusMap, route) => {
          statusMap[String(route.id)] = IDLE_ROUTE_USAGE_STATUS;
          return statusMap;
        }, {});
      }),
    ]);

    routeRecords.value = hydratedRoutes;
    routeUsageMap.value = usageMap;
    ensureCurrentPage();
  } catch {
    routeRecords.value = [];
    routeUsageMap.value = {};
  } finally {
    listLoading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  void loadRouteList();
}

function resetCreateForm() {
  createForm.routeName = "";
  createForm.routeType = RouteType.POINT;
}

function openCreateDialog() {
  resetCreateForm();
  createDialogVisible.value = true;
  nextTick(() => createFormRef.value?.clearValidate());
}

function resetFilterForm() {
  filterForm.routeName = "";
  filterForm.creatorName = "";
  filterForm.routeType = undefined;
  filterForm.createdRange = [];
  filterForm.updatedRange = [];
}

function handleResetQuery() {
  queryFormRef.value?.resetFields();
  resetFilterForm();
  queryParams.pageNum = 1;
  void loadRouteList();
}

function closeCreateDialog() {
  createDialogVisible.value = false;
  createFormRef.value?.clearValidate();
  resetCreateForm();
}

async function startCreate() {
  const isValid = await createFormRef.value?.validate().catch(() => false);
  if (!isValid) return;

  const loopTemplate = createEmptyRoute({ routeType: RouteType.LOOP }).loopConfig;
  const draft = createEmptyRoute({
    id: createRouteDraftId(),
    persisted: false,
    routeName: createForm.routeName.trim(),
    routeType: createForm.routeType,
    loopConfig: { ...loopTemplate, targetPoint: null },
  });

  saveRouteDraft(draft);
  closeCreateDialog();

  router.push({
    name: "FlightRouteDetail",
    params: { id: draft.id },
    query: { draft: "1" },
  });
}

function editRoute(route: RouteRecordModel) {
  const usageStatus = getRouteUsageStatus(route);
  if (usageStatus.locked) {
    ElMessage.warning(usageStatus.lockReason);
    return;
  }

  router.push({
    name: "FlightRouteDetail",
    params: { id: route.id },
  });
}

function openPreviewFromList(route: RouteRecordModel) {
  router.push({
    name: "FlightRouteDetail",
    params: { id: route.id },
    query: { action: "preview" },
  });
}

async function handleDeleteRoute(route: RouteRecordModel) {
  const usageStatus = getRouteUsageStatus(route);
  if (usageStatus.locked) {
    ElMessage.warning(usageStatus.lockReason);
    return;
  }

  try {
    await ElMessageBox.confirm(`确认删除航线【${route.routeName}】吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await RouteAPI.delete(route.id);
    await loadRouteList();
    ElMessage.success("删除成功");
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  void loadRouteList();
});

onActivated(() => {
  void loadRouteList();
});
</script>
