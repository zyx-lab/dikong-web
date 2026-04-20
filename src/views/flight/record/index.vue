<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="Flight Replay Desk"
      title="飞行记录"
      description="以复盘视角聚合架次、告警、媒体与核实进度，帮助值守人员快速定位需要复查的飞行任务和异常事件。"
    />

    <RecordSummaryCards
      :total-count="totalCount"
      :pending-record-count="pendingRecordCount"
      :pending-alarm-count="pendingAlarmCount"
      :media-asset-count="mediaAssetCount"
    />

    <RecordFilterBar :query-params="queryParams" @query="handleQuery" @reset="handleResetQuery" />

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
          min-width="170"
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
        <el-table-column label="照片数量" prop="photoCount" width="90" align="center" />
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
            <el-table-column prop="photoCount" label="照片数量" width="90" align="center" />
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
        <el-form-item label="照片数量" prop="photoCount">
          <el-input-number v-model="editForm.photoCount" :min="0" style="width: 100%" />
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
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import FlightRecordAPI from "@/api/flight/record";
import type { FlightRecordInfo, FlightRecordQuery } from "@/api/flight/types";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import RecordFilterBar from "@/views/flight/record/components/RecordFilterBar.vue";
import RecordSummaryCards from "@/views/flight/record/components/RecordSummaryCards.vue";

defineOptions({ name: "FlightRecord", inheritAttrs: false });

const { width } = useWindowSize();

const editFormRef = ref<FormInstance>();

const queryParams = reactive<FlightRecordQuery>({
  pageNum: 1,
  pageSize: 10,
  flightNo: undefined,
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
  Boolean(queryParams.flightNo || queryParams.status !== undefined)
);

const pendingRecordCount = computed(
  () => tableData.value.filter((r) => r.status === 0 || r.status === 2).length
);
const pendingAlarmCount = computed(() => 0);
const mediaAssetCount = computed(() =>
  tableData.value.reduce((sum, r) => sum + (r.photoCount ?? 0) + (r.videoCount ?? 0), 0)
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
  photoCount: 0,
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
  editForm.photoCount = row.photoCount ?? 0;
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
      photo_count: editForm.photoCount,
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
    // 第一步：获取飞行记录详情，从中取 media_files 里视频的 id
    const detail = await FlightRecordAPI.getDetail(row.id);
    const mediaFiles: Array<{ id: number; media_type: number }> = (detail as any).media_files ?? [];

    // 找视频类型（media_type=2）的第一条
    const video = mediaFiles.find((m: { media_type: number }) => m.media_type === 2);

    if (!video) {
      ElMessage.warning("暂无视频文件");
      return;
    }

    // 第二步：用 media id 调用 playback-url 接口获取可播放 URL
    const res = await FlightRecordAPI.getPlaybackUrl(video.id);
    console.log("[handleVideo] playback-url response:", res);

    // 提取 playback_url：响应可能是 { playback_url: "..." } 或 { data: { playback_url: "..." } }
    const url =
      (res as any)?.playback_url ?? (res as any)?.data?.playback_url ?? (res as any)?.data ?? null;

    if (!url) {
      ElMessage.warning("暂无视频回放地址");
      return;
    }

    window.location.href = url;
  } catch {
    // 接口调用失败，错误已在拦截器里处理
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
// styles moved to global scope
</style>
