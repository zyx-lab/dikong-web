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
        <el-form-item label="所属部门" prop="department">
          <el-input
            v-model="filterForm.department"
            placeholder="请输入所属部门"
            clearable
            class="filter-field--md"
            @keyup.enter="handleQuery"
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
                  <p>所属部门：{{ route.department || "未配置" }}</p>
                </div>
                <el-tag size="small" effect="plain" class="route-type-tag">
                  {{ getRouteTypeLabel(route.routeType) }}
                </el-tag>
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
                <el-button link type="primary" size="small" @click="openPreviewFromList(route)">
                  规划
                </el-button>
                <el-button link type="primary" icon="edit" size="small" @click="editRoute(route)">
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  icon="delete"
                  size="small"
                  @click="handleDeleteRoute(route)"
                >
                  删除
                </el-button>
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
        <el-form-item label="所属部门" prop="department">
          <el-input v-model="createForm.department" placeholder="请输入所属部门" />
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
import RouteAPI, { type RouteRead } from "@/api/flight/route";
import { RouteType } from "@/api/flight/types";
import { saveRouteDraft } from "./storage";
import { hydrateRouteRecord } from "./route-xml";
import type { CreateRouteForm, RouteFilterForm, RouteRecordModel } from "./types";
import {
  createEmptyRoute,
  createLoopTargetPoint,
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
const createDialogVisible = ref(false);
const listLoading = ref(false);

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

const queryParams = reactive({
  pageNum: 1,
  pageSize: 6,
});

const createRules: FormRules = {
  routeName: [{ required: true, message: "请输入航线名称", trigger: "blur" }],
  department: [{ required: true, message: "请输入所属部门", trigger: "blur" }],
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
    if (filterForm.department && !route.department.includes(filterForm.department.trim())) {
      return false;
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
    filterForm.department ||
    filterForm.routeType ||
    filterForm.updatedRange.length
  )
);
const dialogWidth = computed(() => (width.value < 768 ? "92%" : "600px"));

function getRouteCardStats(route: RouteRecordModel) {
  return getRouteStatItems(route);
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
    routeRecords.value = await hydrateRouteRecords(summaries);
    ensureCurrentPage();
  } catch {
    routeRecords.value = [];
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
  createForm.department = "";
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
  filterForm.department = "";
  filterForm.routeType = undefined;
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
    department: createForm.department.trim(),
    routeType: createForm.routeType,
    loopConfig:
      createForm.routeType === RouteType.LOOP
        ? { ...loopTemplate, targetPoint: createLoopTargetPoint(loopTemplate.flightHeight) }
        : { ...loopTemplate, targetPoint: null },
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
