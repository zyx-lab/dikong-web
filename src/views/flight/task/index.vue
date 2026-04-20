<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="Mission Command"
      title="任务管理"
      description="统一编排巡检任务、航线资源与执行窗口，让值守人员在进入表格前先看清任务节奏、执行压力和异常风险。"
      action-label="新增任务"
      @action="handleCreateClick"
    />

    <TaskSummaryCards
      :total-count="totalCount"
      :active-task-count="activeTaskCount"
      :completed-task-count="completedTaskCount"
      :attention-task-count="attentionTaskCount"
    />

    <TaskFilterBar :query-params="queryParams" @query="handleQuery" @reset="handleResetQuery" />

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <el-button type="primary" icon="plus" @click="handleCreateClick">新增任务</el-button>
          <el-button
            type="danger"
            icon="delete"
            :disabled="ids.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
        <div class="table-section__toolbar--right">
          <div class="table-toolbar-summary">
            <el-tag type="info">共 {{ total }} 个任务</el-tag>
            <el-tag type="success">执行中 {{ activeTaskCount }} 个</el-tag>
            <el-tag v-if="ids.length > 0" type="warning">已选 {{ ids.length }} 项</el-tag>
          </div>
        </div>
      </div>

      <el-table
        v-loading="loading"
        highlight-current-row
        :data="tableData"
        border
        class="table-section__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="ID" prop="id" width="80" align="center" />
        <el-table-column label="任务名称" prop="name" min-width="150" show-overflow-tooltip />
        <el-table-column label="任务航线" prop="routeName" min-width="150" show-overflow-tooltip />
        <el-table-column
          label="执行无人机"
          prop="droneName"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column label="计划执行时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.scheduledAt) }}</template>
        </el-table-column>
        <el-table-column label="任务状态" align="center" width="100">
          <template #default="{ row }">
            {{ formatStatus(row.status) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="开始时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.finishedAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" align="center" width="280">
          <template #default="scope">
            <el-button type="primary" link size="small" @click.stop="handleDetailClick(scope.row)">
              详情
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              icon="edit"
              @click.stop="handleEditClick(scope.row)"
            >
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click.stop="handleDelete(scope.row.id)">
              删除
            </el-button>
            <el-button type="primary" link size="small" @click.stop="handleAdvance(scope.row)">
              推进任务
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleLiveStream(liveUrlMap[scope.row.id])"
            >
              直播画面
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-state">
            <el-empty :description="hasActiveFilters ? '当前筛选条件下暂无任务' : '暂无任务数据'" />
            <div v-if="hasActiveFilters" class="table-empty-state__actions">
              <el-button link type="primary" @click="handleResetQuery">清空筛选</el-button>
            </div>
          </div>
        </template>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <TaskEditorSheet
      :open="dialogState.visible"
      :title="dialogState.title"
      :form-data="formData"
      :route-options="routeOptions"
      :drone-options="droneOptions"
      :pilot-options="pilotOptions"
      :submit-loading="submitLoading"
      @update:open="handleDialogOpenChange"
      @close="closeDialog"
      @submit="handleSubmit"
    />

    <TaskDetailDialog
      :open="detailDialog.visible"
      :loading="detailDialog.loading"
      :data="detailDialog.data"
      @update:open="handleDetailDialogOpenChange"
      @close="closeDetailDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { TaskPageQuery, TaskVO, TaskForm, RouteOption, MemberOption } from "@/api/flight/task";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import TaskAPI from "@/api/flight/task";
import DroneAPI from "@/api/resource/drone";
import TaskDetailDialog from "@/views/flight/task/components/TaskDetailDialog.vue";
import TaskEditorSheet from "@/views/flight/task/components/TaskEditorSheet.vue";
import TaskFilterBar from "@/views/flight/task/components/TaskFilterBar.vue";
import TaskSummaryCards from "@/views/flight/task/components/TaskSummaryCards.vue";

defineOptions({
  name: "FlightTask",
  inheritAttrs: false,
});

// 查询参数
const queryParams = reactive<TaskPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

// 列表数据
const tableData = ref<TaskVO[]>([]);
const total = ref(0);
const loading = ref(false);
// 已删除的 ID 集合（用于修正统计）
const deletedIds = ref(new Set<number>());

/** 任务总量：API total 减去已删除的 */
const totalCount = computed(() => Math.max(0, total.value - deletedIds.value.size));
const submitLoading = ref(false);
const ids = ref<number[]>([]);
const liveUrlMap = ref<Record<number, string>>({});

const hasActiveFilters = computed(() =>
  Boolean(queryParams.name || queryParams.status !== undefined)
);
const activeTaskCount = computed(() => tableData.value.filter((item) => item.status === 1).length);
const completedTaskCount = computed(
  () => tableData.value.filter((item) => item.status === 2).length
);
const attentionTaskCount = computed(
  () => tableData.value.filter((item) => item.status === 0).length
);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 下拉选项数据
const routeOptions = ref<RouteOption[]>([]);
const droneOptions = ref<{ id: number; name: string }[]>([]);
const pilotOptions = ref<MemberOption[]>([]);

const detailDialog = reactive({
  visible: false,
  loading: false,
  data: null as TaskVO | null,
});

// 表单数据（只保留对接需要的字段）
const formData = reactive<TaskForm>({
  name: "",
  routeId: undefined,
  droneId: undefined,
  pilotId: undefined,
  scheduledAt: "",
  remark: "",
});

/**
 * 加载任务列表数据（调用 API 层并消费已映射的 camelCase 数据）
 */
async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await TaskAPI.getPage(queryParams);
    const list = (res?.list ?? []) as TaskVO[];
    tableData.value = list;
    total.value = res?.total ?? list.length;
  } catch (err: any) {
    console.error(err);
    ElMessage.error(err?.message || "加载任务失败");
  } finally {
    loading.value = false;
  }
}

/**
 * 查询按钮点击事件
 */
function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchData();
}

/**
 * 重置查询
 */
function handleResetQuery(): void {
  queryParams.name = undefined;
  queryParams.status = undefined; // 强制重置
  queryParams.pageNum = 1;
  fetchData();
}

function formatTime(value: string | undefined | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatStatus(status: number | undefined): string {
  return ["待执行", "执行中", "执行完成", "飞行中"][status ?? -1] ?? "-";
}

/**
 * 新增按钮点击事件
 */
function handleCreateClick(): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "新增任务";
  loadDropdownOptions();
}

/**
 * 编辑按钮点击事件
 */
function handleEditClick(row: TaskVO): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "修改任务";
  loadDropdownOptions();

  // 表单回显
  formData.id = row.id;
  formData.name = row.name;
  formData.routeId = row.routeId;
  formData.droneId = row.droneId;
  formData.pilotId = row.pilotId;
  formData.scheduledAt = row.scheduledAt ?? "";
  formData.remark = row.remark ?? "";
}

/**
 * 详情按钮点击事件
 */
function handleDetailClick(row: TaskVO): void {
  detailDialog.loading = true;
  detailDialog.data = null;
  detailDialog.visible = true;
  TaskAPI.getDetail(row.id)
    .then((data) => {
      detailDialog.data = data;
    })
    .catch((err) => {
      console.error(err);
      ElMessage.error("获取任务详情失败");
      detailDialog.visible = false;
    })
    .finally(() => {
      detailDialog.loading = false;
    });
}

function closeDetailDialog(): void {
  detailDialog.visible = false;
  detailDialog.data = null;
}

function resetForm(): void {
  formData.id = undefined;
  formData.name = "";
  formData.routeId = undefined;
  formData.droneId = undefined;
  formData.pilotId = undefined;
  formData.scheduledAt = "";
  formData.remark = "";
}

async function loadDropdownOptions(): Promise<void> {
  const [routes, drones, members] = await Promise.all([
    TaskAPI.getRoutes(),
    DroneAPI.getPage({ pageNum: 1, pageSize: 1000 }),
    TaskAPI.getMembers(),
  ]);
  routeOptions.value = routes;
  droneOptions.value = (drones.list ?? []).map((d: any) => ({ id: d.id, name: d.name }));
  // 只保留有 pilot_operator 角色的成员
  pilotOptions.value = members.filter((m: MemberOption) => m.roleCodes.includes("pilot_operator"));
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  if (!formData.name.trim()) {
    ElMessage.warning("请输入任务名称");
    return;
  }

  submitLoading.value = true;
  (async () => {
    try {
      if (formData.id) {
        await TaskAPI.update(formData.id, formData as TaskForm);
        ElMessage.success("修改成功");
      } else {
        await TaskAPI.add(formData as TaskForm);
        ElMessage.success("新增成功");
      }
      closeDialog();
      handleQuery();
    } catch (err: any) {
      console.error(err);
      ElMessage.error(err?.message || "提交失败");
    } finally {
      submitLoading.value = false;
    }
  })();
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  resetForm();
}

function handleDialogOpenChange(open: boolean): void {
  if (!open) {
    closeDialog();
    return;
  }

  dialogState.visible = open;
}

function handleDetailDialogOpenChange(open: boolean): void {
  detailDialog.visible = open;
  if (!open) {
    detailDialog.data = null;
  }
}

/**
 * 表格选择变化
 */
function handleSelectionChange(selection: TaskVO[]): void {
  ids.value = selection.map((item) => item.id);
}

/**
 * 批量删除
 */
async function handleBatchDelete(): Promise<void> {
  if (ids.value.length === 0) return;
  try {
    await ElMessageBox.confirm(`确认删除已选中的 ${ids.value.length} 个任务吗？`, "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    loading.value = true;
    for (const id of ids.value) {
      await TaskAPI.delete(id);
    }
    ElMessage.success("删除成功");
    ids.value.forEach((id) => deletedIds.value.add(id));
    ids.value = [];
    handleQuery();
  } catch (err: any) {
    if (err === "cancel") {
      ElMessage.info("已取消删除");
    } else {
      console.error(err);
      ElMessage.error(err?.message || "删除失败");
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 删除任务
 */
async function handleDelete(id: number): Promise<void> {
  try {
    await ElMessageBox.confirm("确认删除该任务吗？", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await TaskAPI.delete(id);
    ElMessage.success("删除成功");
    ids.value = ids.value.filter((i) => i !== id);
    deletedIds.value.add(id);
    handleQuery();
  } catch (err: any) {
    if (err === "cancel") {
      ElMessage.info("已取消删除");
    } else {
      console.error(err);
      ElMessage.error(err?.message || "删除失败");
    }
  }
}

/**
 * 推进任务
 */
async function handleAdvance(row: TaskVO): Promise<void> {
  const oldStatus = row.status;
  const waitingMsg = ElMessage({ type: "info", message: "等待响应...", duration: 0 });
  try {
    await TaskAPI.advance(row.id);
    const updated = await TaskAPI.getDetail(row.id);
    const newStatus = updated.status;

    if (newStatus === 1 && oldStatus !== 1) {
      // 待执行 → 执行中
      waitingMsg.close();
      ElMessage.success("任务开始");
      const liveBody = {
        url_type: 1,
        video_id: "1581F7FVC252A00CJ5TT/88-0-0/normal-0",
        video_quality: 1,
      };
      const res = await DroneAPI.liveStart(row.droneId!, liveBody);
      liveUrlMap.value[row.id] = res?.hls_url ?? "";
    } else if (newStatus === 2 && oldStatus !== 2) {
      // 执行中 → 执行完成，需等 advance + liveStop 都完成
      const liveBody = {
        url_type: 1,
        video_id: "1581F7FVC252A00CJ5TT/88-0-0/normal-0",
        video_quality: 1,
      };
      await DroneAPI.liveStop(row.droneId!, liveBody);
      waitingMsg.close();
      ElMessage.success("任务结束");
    }
    handleQuery();
  } catch (err: any) {
    waitingMsg.close();
    console.error(err);
    ElMessage.error(err?.message || "推进失败");
  }
}

/**
 * 直播画面
 */
function handleLiveStream(url?: string): void {
  if (!url) {
    ElMessage.warning("暂无直播地址，请先推进任务");
    return;
  }
  // 拼接完整绝对路径，避免被 SPA 路由拦截
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "");
  window.open(`${base}/live.html?url=${encodeURIComponent(url)}`, "_blank");
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
