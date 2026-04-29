<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Mission Command</p>
            <h2 class="command-page__title">任务管理</h2>
            <p class="command-page__description">
              统一编排巡检任务、航线资源与执行窗口，让值守人员在进入表格前先看清任务节奏、执行压力和异常风险。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">任务编排中枢</span>
            <span class="command-page__signal">航线与资源联动</span>
            <span class="command-page__signal">执行态势优先</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">任务总量</div>
            <div class="command-page__metric-value">{{ totalCount }}</div>
            <div class="command-page__metric-note">当前筛选条件下的任务池规模</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">执行中</div>
            <div class="command-page__metric-value">{{ activeTaskCount }}</div>
            <div class="command-page__metric-note">需持续关注的实时任务</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">已完成</div>
            <div class="command-page__metric-value">{{ completedTaskCount }}</div>
            <div class="command-page__metric-note">完成闭环的巡检任务</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">需关注</div>
            <div class="command-page__metric-value">{{ attentionTaskCount }}</div>
            <div class="command-page__metric-note">暂停或失败任务需要跟进</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="任务名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="航线名称" prop="route_id">
          <el-select
            v-model="queryParams.route_id"
            placeholder="全部"
            clearable
            filterable
            class="filter-field filter-field--md"
          >
            <el-option
              v-for="opt in routeOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="无人机" prop="drone_name">
          <el-select
            v-model="queryParams.drone_name"
            placeholder="全部"
            clearable
            filterable
            class="filter-field filter-field--md"
          >
            <el-option
              v-for="opt in droneOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="飞手" prop="pilot_name">
          <el-select
            v-model="queryParams.pilot_name"
            placeholder="全部"
            clearable
            filterable
            class="filter-field filter-field--md"
          >
            <el-option
              v-for="opt in pilotOptions"
              :key="opt.memberId"
              :label="opt.displayName"
              :value="opt.displayName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            class="filter-field filter-field--md"
          >
            <el-option label="待执行" :value="0" />
            <el-option label="执行中" :value="1" />
            <el-option label="执行完成" :value="2" />
            <el-option label="异常终止" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间">
          <el-date-picker
            v-model="queryParams.scheduled_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="filter-field filter-field--lg"
            clearable
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
        <el-table-column label="执行时间" min-width="150">
          <template #default="{ row }">
            <div v-if="row.startedAt || row.finishedAt">
              <div class="time-row">
                <span class="time-label">起</span>
                <span class="time-value">{{ formatTime(row.startedAt) }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">止</span>
                <span class="time-value">{{ formatTime(row.finishedAt) }}</span>
              </div>
            </div>
            <div v-else class="time-row">
              <span class="time-label">计划</span>
              <span class="time-value">{{ formatTime(row.scheduledAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
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
            <el-button
              v-if="scope.row.status !== 2 && scope.row.status !== 3 && scope.row.status !== 4"
              type="primary"
              link
              size="small"
              @click.stop="handleAdvance(scope.row)"
            >
              {{ scope.row.status === 0 ? "开始任务" : "结束任务" }}
            </el-button>
            <el-button
              v-if="scope.row.status === 1"
              type="primary"
              link
              size="small"
              @click.stop="handleLiveStream(getLiveUrl(scope.row.id), scope.row.id)"
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
        :page-sizes="[10, 20, 50, 100]"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      :width="dialogWidth"
      align-center
      destroy-on-close
      custom-class="dialog-form-decorated"
      class="dialog-form-decorated"
      @close="closeDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务航线" prop="routeId">
          <el-select v-model="formData.routeId" placeholder="请选择航线" class="w-full">
            <el-option
              v-for="item in routeOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行无人机" prop="droneId">
          <el-select v-model="formData.droneId" placeholder="请选择无人机" class="w-full">
            <el-option
              v-for="item in droneOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行飞手" prop="pilotId">
          <el-select
            v-model="formData.pilotId"
            placeholder="请选择执行飞手"
            class="w-full"
            clearable
          >
            <el-option
              v-for="item in pilotOptions"
              :key="item.memberId"
              :label="item.displayName"
              :value="item.memberId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划时间" prop="scheduledAt">
          <el-date-picker
            v-model="formData.scheduledAt"
            type="datetime"
            placeholder="选择计划执行时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Detail dialog -->
    <el-dialog
      v-model="detailDialog.visible"
      title="任务详情"
      :width="dialogWidth"
      align-center
      destroy-on-close
      custom-class="dialog-form-decorated"
      class="dialog-form-decorated"
      @close="closeDetailDialog"
    >
      <div v-loading="detailDialog.loading" style="min-height: 200px">
        <template v-if="detailDialog.data">
          <el-table :data="[detailDialog.data]" border size="small">
            <el-table-column prop="id" label="任务ID" min-width="80" align="center" />
            <el-table-column prop="name" label="任务名称" min-width="160" show-overflow-tooltip />
            <el-table-column
              prop="routeName"
              label="任务航线"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="droneName"
              label="执行无人机"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column prop="pilotName" label="执行飞手" min-width="100" align="center" />
            <el-table-column prop="scheduledAt" label="计划执行时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.scheduledAt) }}</template>
            </el-table-column>
            <el-table-column label="开始时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
            </el-table-column>
            <el-table-column label="结束时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.finishedAt) }}</template>
            </el-table-column>
            <el-table-column label="任务状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ formatStatus(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="更新时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          </el-table>
        </template>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useWindowSize } from "@vueuse/core";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import type { TaskPageQuery, TaskVO, TaskForm, RouteOption, MemberOption } from "@/api/flight/task";
import TaskAPI from "@/api/flight/task";
import DroneAPI from "@/api/resource/drone";

defineOptions({
  name: "FlightTask",
  inheritAttrs: false,
});

const router = useRouter();
const { width } = useWindowSize();

// 表单引用
const dataFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<TaskPageQuery>({
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
  route_id: undefined,
  route_name: undefined,
  drone_name: undefined,
  pilot_name: undefined,
  scheduled_range: undefined,
  started_at_start: undefined,
  started_at_end: undefined,
  finished_at_start: undefined,
  finished_at_end: undefined,
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

/** 直播 URL 缓存（sessionStorage，刷新页面不丢） */
const liveUrlMap = ref<Record<number, string>>({});

function setLiveUrl(taskId: number, url: string) {
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

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "600px"));
const hasActiveFilters = computed(() =>
  Boolean(
    queryParams.name ||
    queryParams.status !== undefined ||
    queryParams.route_id ||
    queryParams.route_name ||
    queryParams.drone_name ||
    queryParams.pilot_name ||
    queryParams.scheduled_range ||
    queryParams.started_at_start ||
    queryParams.started_at_end ||
    queryParams.finished_at_start ||
    queryParams.finished_at_end
  )
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

// 验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
};

/**
 * 加载任务列表数据（调用 API 层并消费已映射的 camelCase 数据）
 */
async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    // 日期范围拆分为 started_at 和 finished_at 起止参数
    const { scheduled_range: range, ...rest } = queryParams;
    const params = {
      ...rest,
      started_at_start: Array.isArray(range) ? range[0] : undefined,
      started_at_end: Array.isArray(range) ? range[1] : undefined,
      finished_at_start: Array.isArray(range) ? range[0] : undefined,
      finished_at_end: Array.isArray(range) ? range[1] : undefined,
    };
    const res = await TaskAPI.getPage(params);
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
  queryParams.status = undefined;
  queryParams.route_id = undefined;
  queryParams.route_name = undefined;
  queryParams.drone_name = undefined;
  queryParams.pilot_name = undefined;
  queryParams.scheduled_range = undefined;
  queryParams.started_at_start = undefined;
  queryParams.started_at_end = undefined;
  queryParams.finished_at_start = undefined;
  queryParams.finished_at_end = undefined;
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
  return ["待执行", "执行中", "执行完成", "异常终止"][status ?? -1] ?? "-";
}

function statusTagType(status: number | undefined): "info" | "warning" | "success" | "danger" {
  return (
    (["info", "warning", "success", "danger"][status ?? -1] as
      | "info"
      | "warning"
      | "success"
      | "danger") ?? "info"
  );
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
  dataFormRef.value?.clearValidate();
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
  dataFormRef.value?.validate(async (isValid) => {
    if (!isValid) return;
    submitLoading.value = true;
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
  });
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  dataFormRef.value?.resetFields();
  resetForm();
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
 * 开始/结束任务
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
  router.push({ path: "/flight/task/hls-player", query: { url, taskId: String(taskId) } });
}

onMounted(() => {
  loadDropdownOptions();
  handleQuery();
});
</script>

<style scoped>
.w-full {
  width: 100%;
}
.time-row {
  display: flex;
  align-items: center;
  line-height: 1.6;
}
.time-label {
  min-width: 26px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.time-value {
  font-size: 13px;
}
</style>
