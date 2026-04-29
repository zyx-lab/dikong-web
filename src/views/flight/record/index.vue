<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="飞行记录"
      title="飞行记录"
      description="查看飞行记录、媒体资料和核实状态。"
    />

    <RecordFilterBar
      :query-params="queryParams"
      :drone-options="droneOptions"
      :pilot-options="pilotOptions"
      @query="handleQuery"
      @reset="handleResetQuery"
    />

    <Card data-testid="record-table-shell" class="border-border/70 shadow-none">
      <CardContent class="space-y-4 pt-6">
        <div class="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline">共 {{ totalCount }} 条飞行记录</Badge>
          <Badge v-if="ids.length > 0" variant="secondary">已选 {{ ids.length }} 项</Badge>
        </div>

        <div v-loading="loading" class="table-section__content">
          <RecordDataTable
            :rows="tableData"
            :selected-ids="ids"
            :has-active-filters="hasActiveFilters"
            @update:selected-ids="handleSelectionIdsChange"
            @detail="handleDetail"
            @edit="handleEdit"
            @delete="handleDelete"
            @video="handleVideo"
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

    <RecordDetailDialog
      :open="detailDialog.visible"
      :loading="detailDialog.loading"
      :data="detailDialog.data"
      @update:open="handleDetailDialogOpenChange"
      @close="closeDetailDialog"
    />

    <RecordEditSheet
      :open="editDialog.visible"
      :form-data="editForm"
      :submit-loading="submitLoading"
      @update:open="handleEditDialogOpenChange"
      @close="closeEditDialog"
      @submit="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import TaskAPI, { type MemberOption } from "@/api/flight/task";
import DroneAPI from "@/api/resource/drone";
import FlightRecordAPI from "@/api/flight/record";
import type { FlightRecordInfo, FlightRecordQuery } from "@/api/flight/types";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import RecordDataTable from "@/views/flight/record/components/RecordDataTable.vue";
import RecordDetailDialog from "@/views/flight/record/components/RecordDetailDialog.vue";
import RecordEditSheet from "@/views/flight/record/components/RecordEditSheet.vue";
import RecordFilterBar from "@/views/flight/record/components/RecordFilterBar.vue";

defineOptions({ name: "FlightRecord", inheritAttrs: false });

const router = useRouter();

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
const droneOptions = ref<{ id: number; name: string }[]>([]);
const pilotOptions = ref<MemberOption[]>([]);

/** 飞行记录总量：API total 减去已删除的 */
const totalCount = computed(() => Math.max(0, total.value - deletedIds.value.size));

const hasActiveFilters = computed(() =>
  Boolean(
    queryParams.flightNo ||
    queryParams.droneId !== undefined ||
    queryParams.pilotId !== undefined ||
    queryParams.status !== undefined
  )
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

async function loadDropdownOptions(): Promise<void> {
  try {
    const [drones, members] = await Promise.all([
      DroneAPI.getPage({ pageNum: 1, pageSize: 1000 }),
      TaskAPI.getMembers(),
    ]);
    droneOptions.value = (drones.list ?? []).map((drone: any) => ({
      id: drone.id,
      name: drone.name,
    }));
    pilotOptions.value = members.filter((member: MemberOption) =>
      member.roleCodes.includes("pilot_operator")
    );
  } catch (err) {
    console.error(err);
    ElMessage.warning("筛选选项加载失败");
  }
}

function handleSelectionIdsChange(nextIds: number[]): void {
  ids.value = nextIds;
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

function closeDetailDialog(): void {
  detailDialog.visible = false;
  detailDialog.data = null;
}

function handleDetailDialogOpenChange(open: boolean): void {
  detailDialog.visible = open;
  if (!open) {
    detailDialog.data = null;
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

function closeEditDialog(): void {
  editDialog.visible = false;
}

function handleEditDialogOpenChange(open: boolean): void {
  editDialog.visible = open;
}

/** 提交更新 */
async function handleUpdate(): Promise<void> {
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
    closeEditDialog();
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

onMounted(() => {
  loadDropdownOptions();
  fetchData();
});
</script>

<style scoped lang="scss">
// styles moved to global scope
</style>
