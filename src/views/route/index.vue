<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="Route Planning Hub"
      title="航线管理"
      description="统一管理点状、面状与环状航线资产，让值守人员在进入列表前先看清航线规模、规划类型和待处理资源。"
      action-label="新增航线"
      @action="openCreateDialog"
    />

    <RouteSummaryCards
      :total-count="totalCount"
      :point-route-count="pointRouteCount"
      :area-route-count="areaRouteCount"
      :loop-route-count="loopRouteCount"
    />

    <RouteFilterBar
      :filter-form="filterForm"
      :route-type-options="routeTypeOptions"
      @query="handleQuery"
      @reset="handleResetQuery"
    />

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
        <RouteCardList
          :routes="pagedRoutes"
          :has-active-filters="hasActiveFilters"
          :get-route-type-label="getRouteTypeLabel"
          :get-route-card-stats="getRouteCardStats"
          :get-route-usage-status="getRouteUsageStatus"
          @preview="openPreviewFromList"
          @edit="editRoute"
          @delete="handleDeleteRoute"
          @clear-filters="handleResetQuery"
        />
      </div>

      <pagination
        v-if="totalCount > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="totalCount"
        @pagination="loadRouteList"
      />
    </el-card>

    <RouteEditorSheet
      :open="createDialogVisible"
      :form-data="createForm"
      :route-type-options="routeTypeOptions"
      @update:open="handleCreateDialogOpenChange"
      @close="closeCreateDialog"
      @save="startCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import MissionAPI, { type MissionPageResult, type MissionRead } from "@/api/flight/mission";
import RouteAPI, { type RouteRead } from "@/api/flight/route";
import { RouteType } from "@/api/flight/types";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import RouteCardList from "@/views/route/components/RouteCardList.vue";
import RouteEditorSheet from "@/views/route/components/RouteEditorSheet.vue";
import RouteFilterBar from "@/views/route/components/RouteFilterBar.vue";
import RouteSummaryCards from "@/views/route/components/RouteSummaryCards.vue";
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
}

function resetFilterForm() {
  filterForm.routeName = "";
  filterForm.creatorName = "";
  filterForm.routeType = undefined;
  filterForm.createdRange = [];
  filterForm.updatedRange = [];
}

function handleResetQuery() {
  resetFilterForm();
  queryParams.pageNum = 1;
  void loadRouteList();
}

function closeCreateDialog() {
  createDialogVisible.value = false;
  resetCreateForm();
}

function handleCreateDialogOpenChange(open: boolean) {
  if (!open) {
    closeCreateDialog();
    return;
  }

  createDialogVisible.value = open;
}

async function startCreate() {
  if (!createForm.routeName.trim()) {
    ElMessage.warning("请输入航线名称");
    return;
  }

  if (!createForm.routeType) {
    ElMessage.warning("请选择航线类型");
    return;
  }

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
