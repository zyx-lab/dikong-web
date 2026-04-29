<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Flight Replay Desk</p>
            <h2 class="command-page__title">飞行记录</h2>
            <p class="command-page__description">
              以复盘视角聚合架次、告警、媒体与核实进度，帮助值守人员快速定位需要复查的飞行任务和异常事件。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">飞行复盘台</span>
            <span class="command-page__signal">告警核实链路</span>
            <span class="command-page__signal">媒体证据关联</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">飞行记录</div>
            <div class="command-page__metric-value">{{ totalCount }}</div>
            <div class="command-page__metric-note">当前筛选范围内的架次总数</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">待核实架次</div>
            <div class="command-page__metric-value">{{ pendingRecordCount }}</div>
            <div class="command-page__metric-note">仍需人工确认的异常飞行</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">待核实告警</div>
            <div class="command-page__metric-value">{{ pendingAlarmCount }}</div>
            <div class="command-page__metric-note">需要尽快闭环的告警事件</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">媒体资产</div>
            <div class="command-page__metric-value">{{ mediaAssetCount }}</div>
            <div class="command-page__metric-note">图像与视频证据同步沉淀</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="飞行记录编号" prop="flightNo">
          <el-input
            v-model="queryParams.flightNo"
            placeholder="请输入飞行记录编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="无人机" prop="droneId">
          <el-select
            v-model="queryParams.droneId"
            placeholder="全部"
            clearable
            filterable
            class="filter-field filter-field--md"
          >
            <el-option
              v-for="opt in droneOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="飞手" prop="pilotId">
          <el-select
            v-model="queryParams.pilotId"
            placeholder="全部"
            clearable
            filterable
            class="filter-field filter-field--md"
          >
            <el-option
              v-for="opt in pilotOptions"
              :key="opt.memberId"
              :label="opt.displayName"
              :value="opt.memberId"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">查询</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--right">
          <div class="table-toolbar-summary">
            <el-tag type="info">共 {{ totalCount }} 条飞行记录</el-tag>
            <el-tag v-if="ids.length > 0" type="primary">已选 {{ ids.length }} 项</el-tag>
          </div>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        highlight-current-row
        class="table-section__content"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="ID" prop="id" width="80" align="center" />
        <el-table-column
          label="飞行记录编号"
          prop="flightNo"
          min-width="100"
          show-overflow-tooltip
        />
        <el-table-column
          label="任务名称"
          prop="missionName"
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column label="航线名称" prop="routeName" min-width="160" show-overflow-tooltip />
        <el-table-column
          label="无人机名称"
          prop="droneName"
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column label="设备序列号" prop="deviceSn" min-width="180" show-overflow-tooltip />
        <el-table-column label="飞手姓名" prop="pilotName" min-width="120" align="center" />
        <el-table-column label="飞行时间" min-width="120">
          <template #default="{ row }">
            <div v-if="row.startTime || row.endTime">
              <div class="time-row">
                <span class="time-label">起</span>
                <span class="time-value">{{ formatTime(row.startTime) }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">止</span>
                <span class="time-value">{{ formatTime(row.endTime) }}</span>
              </div>
            </div>
            <span v-else class="time-value">{{ formatTime(row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="飞行时长" width="100" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.flightDuration) }}
          </template>
        </el-table-column>
        <el-table-column label="视频数量" prop="videoCount" width="90" align="center" />
        <el-table-column fixed="right" label="操作" align="center" width="240">
          <template #default="scope">
            <el-button type="primary" link size="small" @click.stop="handleDetail(scope.row)">
              详情
            </el-button>
            <el-button type="primary" link size="small" @click.stop="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click.stop="handleDelete(scope.row.id)">
              删除
            </el-button>
            <el-button type="primary" link size="small" @click.stop="handleVideo(scope.row)">
              视频回放
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-state">
            <el-empty
              :description="hasActiveFilters ? '当前筛选条件下暂无飞行记录' : '暂无飞行记录数据'"
            />
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

    <!-- Detail dialog -->
    <el-dialog
      v-model="detailDialog.visible"
      title="飞行记录详情"
      :width="dialogWidth"
      align-center
      destroy-on-close
      class="dialog-form-decorated"
    >
      <div v-loading="detailDialog.loading" style="min-height: 200px">
        <template v-if="detailDialog.data">
          <el-table :data="[detailDialog.data]" border size="small">
            <el-table-column prop="id" label="ID" min-width="80" align="center" />
            <el-table-column
              prop="flightNo"
              label="飞行记录编号"
              min-width="160"
              show-overflow-tooltip
            />
            <el-table-column
              prop="missionName"
              label="任务名称"
              min-width="160"
              show-overflow-tooltip
            />
            <el-table-column
              prop="routeName"
              label="航线名称"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="airportName"
              label="执行机场"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column
              prop="deviceSn"
              label="设备序列号"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column
              prop="droneName"
              label="无人机名称"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column prop="pilotName" label="飞手姓名" min-width="100" align="center" />
            <el-table-column label="开始时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
            </el-table-column>
            <el-table-column label="结束时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.endTime) }}</template>
            </el-table-column>
            <el-table-column label="飞行时长" width="100" align="center">
              <template #default="{ row }">
                {{ formatDuration(row.flightDuration) }}
              </template>
            </el-table-column>
            <el-table-column prop="videoCount" label="视频数量" width="90" align="center" />
          </el-table>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Edit dialog -->
    <el-dialog
      v-model="editDialog.visible"
      title="编辑飞行记录"
      :width="dialogWidth"
      align-center
      destroy-on-close
      class="dialog-form-decorated"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="120px">
        <el-form-item label="任务名称" prop="missionName">
          <el-input v-model="editForm.missionName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="航线名称" prop="routeName">
          <el-input v-model="editForm.routeName" placeholder="请输入航线名称" />
        </el-form-item>
        <el-form-item label="执行机场" prop="airportName">
          <el-input v-model="editForm.airportName" placeholder="请输入执行机场" />
        </el-form-item>
        <el-form-item label="无人机名称" prop="droneName">
          <el-input v-model="editForm.droneName" placeholder="请输入无人机名称" />
        </el-form-item>
        <el-form-item label="飞手姓名" prop="pilotName">
          <el-input v-model="editForm.pilotName" placeholder="请输入飞手姓名" />
        </el-form-item>
        <el-form-item label="飞行时长(秒)" prop="flightDuration">
          <el-input-number v-model="editForm.flightDuration" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="视频数量" prop="videoCount">
          <el-input-number v-model="editForm.videoCount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import FlightRecordAPI from "@/api/flight/record";
import TaskAPI from "@/api/flight/task";
import DroneAPI from "@/api/resource/drone";
import type { FlightRecordInfo, FlightRecordQuery } from "@/api/flight/types";
import type { MemberOption } from "@/api/flight/task";

defineOptions({ name: "FlightRecord", inheritAttrs: false });

const router = useRouter();
const { width } = useWindowSize();

const editFormRef = ref<FormInstance>();

const droneOptions = ref<{ id: number; name: string }[]>([]);
const pilotOptions = ref<MemberOption[]>([]);

const queryParams = reactive<FlightRecordQuery>({
  pageNum: 1,
  pageSize: 10,
  flightNo: undefined,
  droneId: undefined,
  pilotId: undefined,
  status: undefined,
});

const tableData = ref<FlightRecordInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const submitLoading = ref(false);
const ids = ref<number[]>([]);
const deletedIds = ref(new Set<number>());

/** 飞行记录总量：API total 减去已删除的 */
const totalCount = computed(() => Math.max(0, total.value - deletedIds.value.size));

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "800px"));
const hasActiveFilters = computed(() =>
  Boolean(
    queryParams.flightNo ||
    queryParams.droneId !== undefined ||
    queryParams.pilotId !== undefined ||
    queryParams.status !== undefined
  )
);

const pendingRecordCount = computed(
  () => tableData.value.filter((r) => r.status === 0 || r.status === 2).length
);
const pendingAlarmCount = computed(() => 0);
const mediaAssetCount = computed(() =>
  tableData.value.reduce((sum, r) => sum + ((r as any).photoCount ?? 0) + (r.videoCount ?? 0), 0)
);

// Detail dialog
const detailDialog = reactive({
  visible: false,
  loading: false,
  data: null as FlightRecordInfo | null,
});

// Edit dialog
const editDialog = reactive({ visible: false });
const editForm = reactive({
  id: 0,
  missionName: "",
  routeName: "",
  airportName: "",
  droneName: "",
  pilotName: "",
  flightDuration: 0,
  videoCount: 1,
});

const editRules: FormRules = {};

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await FlightRecordAPI.getPage(queryParams as FlightRecordQuery);
    tableData.value = res.list ?? [];
    total.value = res.total ?? 0;
  } catch (err) {
    console.error(err);
    ElMessage.error("获取飞行记录列表失败");
  } finally {
    loading.value = false;
  }
}

function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchData();
}

function handleResetQuery(): void {
  queryParams.flightNo = undefined;
  queryParams.droneId = undefined;
  queryParams.pilotId = undefined;
  queryParams.status = undefined;
  queryParams.pageNum = 1;
  fetchData();
}

function handleSelectionChange(selection: FlightRecordInfo[]): void {
  ids.value = selection.map((item) => item.id);
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

/** 详情 */
async function handleDetail(row: FlightRecordInfo): Promise<void> {
  detailDialog.loading = true;
  detailDialog.data = null;
  detailDialog.visible = true;
  try {
    detailDialog.data = await FlightRecordAPI.getDetail(row.id);
  } catch (err) {
    console.error(err);
    ElMessage.error("获取详情失败");
    detailDialog.visible = false;
  } finally {
    detailDialog.loading = false;
  }
}

/** 编辑 */
function handleEdit(row: FlightRecordInfo): void {
  editForm.id = row.id;
  editForm.missionName = row.missionName ?? "";
  editForm.routeName = row.routeName ?? "";
  editForm.airportName = row.airportName ?? "";
  editForm.droneName = row.droneName ?? "";
  editForm.pilotName = row.pilotName ?? "";
  editForm.flightDuration = row.flightDuration ?? 0;
  editForm.videoCount = row.videoCount ?? 1;
  editDialog.visible = true;
}

/** 提交更新 */
async function handleUpdate(): Promise<void> {
  const valid = await editFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    await FlightRecordAPI.update(editForm.id, {
      mission_name: editForm.missionName,
      route_name: editForm.routeName,
      airport_name: editForm.airportName,
      drone_name: editForm.droneName,
      pilot_name: editForm.pilotName,
      flight_duration: editForm.flightDuration,
      video_count: editForm.videoCount,
    });
    ElMessage.success("修改成功");
    editDialog.visible = false;
    fetchData();
  } catch (err: any) {
    console.error(err);
    ElMessage.error(err?.message || "修改失败");
  } finally {
    submitLoading.value = false;
  }
}

/** 删除 */
async function handleDelete(id: number): Promise<void> {
  try {
    await ElMessageBox.confirm("确认删除该飞行记录吗？", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await FlightRecordAPI.delete(id);
    ElMessage.success("删除成功");
    ids.value = ids.value.filter((i) => i !== id);
    deletedIds.value.add(id);
    fetchData();
  } catch (err: any) {
    if (err !== "cancel") {
      console.error(err);
      ElMessage.error(err?.message || "删除失败");
    }
  }
}

/** 视频回放 */
async function handleVideo(row: FlightRecordInfo): Promise<void> {
  try {
    const detail = await FlightRecordAPI.getDetail(row.id);
    const mediaFiles: Array<{ id: number; media_type: number }> = (detail as any).media_files ?? [];
    const video = mediaFiles.find((m: { media_type: number }) => m.media_type === 2);

    if (!video) {
      ElMessage.warning("暂无视频文件");
      return;
    }

    router.push({ path: `/flight/record/video-player/${video.id}` });
  } catch {
    // 接口调用失败，错误已在拦截器里处理
  }
}

async function loadDropdownOptions(): Promise<void> {
  const [drones, members] = await Promise.all([
    DroneAPI.getPage({ pageNum: 1, pageSize: 1000 }),
    TaskAPI.getMembers(),
  ]);
  droneOptions.value = (drones.list ?? []).map((d: any) => ({ id: d.id, name: d.name }));
  pilotOptions.value = (members ?? []).filter((m: MemberOption) =>
    m.roleCodes.includes("pilot_operator")
  );
}

onMounted(() => {
  loadDropdownOptions();
  fetchData();
});
</script>

<style scoped lang="scss">
// styles moved to global scope
.time-row {
  display: flex;
  align-items: center;
  line-height: 1.4;
}
.time-label {
  min-width: 22px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.time-value {
  font-size: 13px;
}
</style>
