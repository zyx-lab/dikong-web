<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="任务管理"
      title="任务管理"
      description="查看巡检任务、执行状态和计划时间。"
      action-label="新增任务"
      @action="handleCreateClick"
    />

    <TaskFilterBar :query-params="queryParams" @query="handleQuery" @reset="handleResetQuery" />

    <Card data-testid="task-table-shell" class="border-border/70 shadow-none">
      <CardContent class="space-y-4 pt-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-3">
            <Button @click="handleCreateClick">新增任务</Button>
            <Button variant="outline" :disabled="ids.length === 0" @click="handleBatchDelete">
              批量删除
            </Button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="outline">共 {{ total }} 个任务</Badge>
            <Badge variant="secondary">执行中 {{ activeTaskCount }} 个</Badge>
            <Badge v-if="ids.length > 0" variant="outline">已选 {{ ids.length }} 项</Badge>
          </div>
        </div>

        <div v-loading="loading" class="table-section__content">
          <TaskDataTable
            :rows="tableData"
            :selected-ids="ids"
            :has-active-filters="hasActiveFilters"
            @update:selected-ids="handleSelectionIdsChange"
            @detail="handleDetailClick"
            @edit="handleEditClick"
            @delete="handleDelete"
            @advance="handleAdvance"
            @live="handleLiveFromRow"
            @clear-filters="handleResetQuery"
          />
        </div>

        <pagination
          v-if="total > 0"
          v-model:total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="fetchData"
        />
      </CardContent>
    </Card>

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
import { useRouter } from "vue-router";
import type { TaskPageQuery, TaskVO, TaskForm, RouteOption, MemberOption } from "@/api/flight/task";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TaskAPI from "@/api/flight/task";
import DroneAPI from "@/api/resource/drone";
import TaskDataTable from "@/views/flight/task/components/TaskDataTable.vue";
import TaskDetailDialog from "@/views/flight/task/components/TaskDetailDialog.vue";
import TaskEditorSheet from "@/views/flight/task/components/TaskEditorSheet.vue";
import TaskFilterBar from "@/views/flight/task/components/TaskFilterBar.vue";

defineOptions({
  name: "FlightTask",
  inheritAttrs: false,
});

const router = useRouter();

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

const submitLoading = ref(false);
const ids = ref<number[]>([]);
const liveUrlMap = ref<Record<number, string>>({});

const hasActiveFilters = computed(() =>
  Boolean(queryParams.name || queryParams.status !== undefined)
);
const activeTaskCount = computed(() => tableData.value.filter((item) => item.status === 1).length);

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
function handleSelectionIdsChange(nextIds: number[]): void {
  ids.value = nextIds;
}

function setLiveUrl(taskId: number, url: string): void {
  liveUrlMap.value[taskId] = url;
  sessionStorage.setItem(`live_${taskId}`, url);
}

function getLiveUrl(taskId: number): string | undefined {
  if (liveUrlMap.value[taskId]) return liveUrlMap.value[taskId];
  const stored = sessionStorage.getItem(`live_${taskId}`);
  if (stored) {
    liveUrlMap.value[taskId] = stored;
    return stored;
  }
  return undefined;
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
      setLiveUrl(row.id, res?.hls_url ?? "");
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
function handleLiveStream(url?: string, taskId?: number): void {
  if (!url) {
    ElMessage.warning("暂无直播地址，请先推进任务");
    return;
  }
  router.push({
    path: "/flight/task/hls-player",
    query: {
      url,
      ...(taskId ? { taskId: String(taskId) } : {}),
    },
  });
}

function handleLiveFromRow(row: TaskVO): void {
  handleLiveStream(getLiveUrl(row.id), row.id);
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
