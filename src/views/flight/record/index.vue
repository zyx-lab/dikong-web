<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="执行任务" prop="taskName">
          <el-select
            v-model="queryParams.taskName"
            placeholder="请选择"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option v-for="item in taskOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行航线" prop="routeName">
          <el-select
            v-model="queryParams.routeName"
            placeholder="请选择"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option v-for="item in routeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行机场" prop="airportName">
          <el-select
            v-model="queryParams.airportName"
            placeholder="请选择"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option v-for="item in airportOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行无人机" prop="droneName">
          <el-select
            v-model="queryParams.droneName"
            placeholder="请选择"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option v-for="item in droneOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行飞手" prop="pilotName">
          <el-select
            v-model="queryParams.pilotName"
            placeholder="请选择"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option v-for="item in pilotOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="告警核实" prop="alarmVerifyStatus">
          <el-select
            v-model="queryParams.alarmVerifyStatus"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in alarmVerifyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="执行日期" prop="executeDateRange">
          <el-date-picker
            v-model="queryParams.executeDateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item class="search-buttons">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <el-button
            type="danger"
            icon="Delete"
            :disabled="selectedIds.length === 0"
            @click="handleDelete()"
          >
            批量删除
          </el-button>
        </div>
        <div class="table-section__toolbar--right">
          <el-tag type="info">共 {{ total }} 条飞行记录</el-tag>
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
        <el-table-column label="架次编号" prop="recordNo" min-width="160" show-overflow-tooltip />
        <el-table-column label="任务名称" prop="taskName" min-width="170" show-overflow-tooltip />
        <el-table-column label="任务航线" prop="routeName" min-width="160" show-overflow-tooltip />
        <el-table-column
          label="执行机场"
          prop="airportName"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="执行无人机"
          prop="droneName"
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column label="执行飞手" min-width="120" align="center">
          <template #default="scope">
            <div class="authority-tags">
              <el-tag class="pilot-tag" size="small" effect="dark">
                <el-icon><UserFilled /></el-icon>
                <span>{{ scope.row.pilotName }}</span>
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="飞行时长" prop="flightDurationText" width="100" align="center" />
        <el-table-column label="异常告警" prop="alarmCount" width="90" align="center" />
        <el-table-column label="图片/视频" width="100" align="center">
          <template #default="scope">
            {{ scope.row.imageCount }}/{{ scope.row.videoCount }}
          </template>
        </el-table-column>
        <el-table-column label="执行时间" prop="executeTime" width="170" align="center" />
        <el-table-column label="告警核实" width="100" align="center">
          <template #default="scope">
            <span
              :class="[
                'alarm-verify-text',
                scope.row.alarmVerifyStatus === AlarmVerifyStatus.PENDING &&
                  'alarm-verify-text--pending',
              ]"
            >
              {{ getAlarmVerifyText(scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" align="center" width="240">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleView(scope.row.id)">
              查看
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handlePlaceholderAction('异常告警', scope.row.taskName)"
            >
              异常告警
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handlePlaceholderAction('媒体库', scope.row.taskName)"
            >
              媒体库
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { UserFilled } from "@element-plus/icons-vue";
import type { BaseQueryParams } from "@/types/api";
import {
  AlarmVerifyStatus,
  buildFlightRecordData,
  type FlightRecordItem,
} from "@/views/flight/record/data";

defineOptions({
  name: "FlightRecord",
  inheritAttrs: false,
});

interface FlightRecordQuery extends BaseQueryParams {
  taskName?: string;
  routeName?: string;
  airportName?: string;
  droneName?: string;
  pilotName?: string;
  alarmVerifyStatus?: AlarmVerifyStatus;
  executeDateRange?: [string, string] | [];
}

const router = useRouter();
const queryFormRef = ref<FormInstance>();

const alarmVerifyOptions = [
  { label: "已完成", value: AlarmVerifyStatus.COMPLETED },
  { label: "待核实", value: AlarmVerifyStatus.PENDING },
];

const queryParams = reactive<FlightRecordQuery>({
  pageNum: 1,
  pageSize: 10,
  executeDateRange: [],
});

const tableData = ref<FlightRecordItem[]>([]);
const total = ref(0);
const loading = ref(false);
const selectedIds = ref<number[]>([]);

const mockData = ref<FlightRecordItem[]>(buildFlightRecordData());

const taskOptions = computed(() => buildUniqueOptions(mockData.value, "taskName"));
const routeOptions = computed(() => buildUniqueOptions(mockData.value, "routeName"));
const airportOptions = computed(() => buildUniqueOptions(mockData.value, "airportName"));
const droneOptions = computed(() => buildUniqueOptions(mockData.value, "droneName"));
const pilotOptions = computed(() => buildUniqueOptions(mockData.value, "pilotName"));

function buildUniqueOptions<T extends keyof FlightRecordItem>(
  list: FlightRecordItem[],
  field: T
): string[] {
  return [...new Set(list.map((item) => String(item[field] ?? "")))].filter(Boolean);
}

function fetchData(): void {
  loading.value = true;

  setTimeout(() => {
    let filteredData = [...mockData.value];

    if (queryParams.taskName) {
      filteredData = filteredData.filter((item) => item.taskName === queryParams.taskName);
    }

    if (queryParams.routeName) {
      filteredData = filteredData.filter((item) => item.routeName === queryParams.routeName);
    }

    if (queryParams.airportName) {
      filteredData = filteredData.filter((item) => item.airportName === queryParams.airportName);
    }

    if (queryParams.droneName) {
      filteredData = filteredData.filter((item) => item.droneName === queryParams.droneName);
    }

    if (queryParams.pilotName) {
      filteredData = filteredData.filter((item) => item.pilotName === queryParams.pilotName);
    }

    if (queryParams.alarmVerifyStatus) {
      filteredData = filteredData.filter(
        (item) => item.alarmVerifyStatus === queryParams.alarmVerifyStatus
      );
    }

    if (queryParams.executeDateRange && queryParams.executeDateRange.length === 2) {
      const [startDate, endDate] = queryParams.executeDateRange;
      filteredData = filteredData.filter(
        (item) => item.executeDate >= startDate && item.executeDate <= endDate
      );
    }

    total.value = filteredData.length;

    const pageNum = queryParams.pageNum ?? 1;
    const pageSize = queryParams.pageSize ?? 10;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    tableData.value = filteredData.slice(startIndex, endIndex);
    loading.value = false;
  }, 300);
}

function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchData();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  queryParams.executeDateRange = [];
  fetchData();
}

function handleSelectionChange(selection: FlightRecordItem[]): void {
  selectedIds.value = selection.map((item) => item.id);
}

function getAlarmVerifyText(row: FlightRecordItem): string {
  if (row.alarmVerifyStatus === AlarmVerifyStatus.COMPLETED) {
    return "已完成";
  }

  return `${row.verifiedAlarmCount}/${row.totalAlarmCount}`;
}

function handleView(id: number): void {
  router.push(`/flight/record/detail/${id}`);
}

function handlePlaceholderAction(action: string, taskName: string): void {
  ElMessage.info(`${action}功能待接入：${taskName}`);
}

function handleDelete(id?: number): void {
  const ids = id ? [id] : [...selectedIds.value];
  if (ids.length === 0) {
    ElMessage.warning("请先选择要删除的飞行记录");
    return;
  }

  const current = mockData.value.find((item) => item.id === ids[0]);
  const message =
    ids.length === 1
      ? `确认删除架次【${current?.recordNo ?? ""}】的飞行记录吗？`
      : `确认删除已选中的 ${ids.length} 条飞行记录吗？`;

  ElMessageBox.confirm(message, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      mockData.value = mockData.value.filter((item) => !ids.includes(item.id));
      selectedIds.value = [];
      ElMessage.success("删除成功");

      const maxPage = Math.max(1, Math.ceil(mockData.value.length / (queryParams.pageSize ?? 10)));
      if ((queryParams.pageNum ?? 1) > maxPage) {
        queryParams.pageNum = maxPage;
      }

      fetchData();
    },
    () => undefined
  );
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.authority-tags {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.pilot-tag {
  border: none;
}

.pilot-tag :deep(.el-tag__content) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.alarm-verify-text {
  font-weight: 600;
  color: var(--el-color-success);
}

.alarm-verify-text--pending {
  color: #2ec27e;
}
</style>
