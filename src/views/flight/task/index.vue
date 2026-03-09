<template>
  <div class="task-container">
    <!-- 顶部渐变搜索区 -->
    <div class="search-header">
      <el-form :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="任务名称：" class="search-item">
          <el-input
            v-model="queryParams.taskName"
            placeholder="请输入"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="任务航线：" class="search-item">
          <el-input
            v-model="queryParams.routeName"
            placeholder="请输入"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="执行机场：" class="search-item">
          <el-select
            v-model="queryParams.airportName"
            placeholder="请选择"
            clearable
            class="search-select"
          >
            <el-option label="市应急基地主舱" value="市应急基地主舱" />
            <el-option label="城西河道机巢-A1" value="城西河道机巢-A1" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态：" class="search-item">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            class="search-select"
          >
            <el-option label="待执行" :value="0" />
            <el-option label="执行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="执行失败" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-btns">
          <el-button type="primary" class="btn-query" @click="handleQuery">查 询</el-button>
          <el-button class="btn-reset" @click="handleReset">重 置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" class="btn-add" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新 增
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        :data="tableData"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        border
        class="dark-table"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="taskName" label="任务名称" min-width="160" align="center" />
        <el-table-column prop="routeName" label="任务航线" min-width="140" align="center" />
        <el-table-column prop="airportName" label="执行机场" min-width="140" align="center" />
        <el-table-column prop="droneName" label="执行无人机" min-width="160" align="center" />
        <el-table-column prop="algorithm" label="应用算法" min-width="120" align="center" />
        <el-table-column prop="taskContent" label="任务内容" min-width="180" align="center" />
        <el-table-column prop="taskStrategy" label="任务策略" min-width="100" align="center" />
        <el-table-column prop="status" label="执行状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link class="action-link" @click="handleRecord(row)">飞行记录</el-button>
            <el-button link class="action-link" @click="handleDetail(row)">详情</el-button>
            <el-button link class="action-link" @click="handleEdit(row)">编辑</el-button>
            <el-button link class="action-link action-link--danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </div>

    <!-- 新增/编辑 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="680px"
      class="task-dialog"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        class="task-form"
      >
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务航线" prop="routeId">
          <el-select v-model="formData.routeId" placeholder="请选择" style="width: 100%">
            <el-option label="港区全景航线" :value="1" />
            <el-option label="秦淮河东段航线" :value="2" />
            <el-option label="紫金山核心区航线" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行无人机" prop="droneId">
          <el-select v-model="formData.droneId" placeholder="请选择" style="width: 100%">
            <el-option label="应急测绘-01 (CW-15)" :value="1" />
            <el-option label="河道巡检-03 (M3E)" :value="2" />
            <el-option label="林火预警-02 (M300)" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行机场" prop="airportId">
          <el-select v-model="formData.airportId" placeholder="请选择" style="width: 100%">
            <el-option label="市应急基地主舱" :value="1" />
            <el-option label="城西河道机巢-A1" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用算法" prop="algorithmId">
          <el-select v-model="formData.algorithmId" placeholder="请选择" style="width: 100%">
            <el-option label="岸线变化分析" :value="1" />
            <el-option label="水面漂浮物检测" :value="2" />
            <el-option label="热成像火点识别" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务策略" prop="taskStrategy">
          <el-radio-group v-model="formData.taskStrategy">
            <el-radio value="periodic">周期定时</el-radio>
            <el-radio value="scheduled">定时执行</el-radio>
            <el-radio value="manual">手动执行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择日期" prop="executeDate">
          <el-date-picker
            v-model="formData.executeDate"
            type="date"
            placeholder="请选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="选择时间" prop="executeTime">
          <el-time-picker
            v-model="formData.executeTime"
            placeholder="请选择时间"
            value-format="HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="执行状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择" style="width: 100%">
            <el-option label="待执行" :value="0" />
            <el-option label="执行中" :value="1" />
            <el-option label="已完成" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FlightTask, FlightTaskForm, FlightTaskQuery } from "@/api/flight/types";
import { TaskStatus } from "@/api/flight/types";

defineOptions({ name: "FlightTask" });

const queryParams = reactive<FlightTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  taskName: undefined,
  routeName: undefined,
  airportName: undefined,
  status: undefined,
  droneName: undefined,
});

const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref("新增任务");
const formRef = ref<FormInstance>();

const initFormData = (): FlightTaskForm => ({
  taskName: "",
  routeId: undefined,
  droneId: undefined,
  airportId: undefined,
  algorithmId: undefined,
  taskStrategy: "periodic",
  executeDate: undefined,
  executeTime: undefined,
  status: undefined,
});

const formData = reactive<FlightTaskForm>(initFormData());

const formRules: FormRules = {
  taskName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  routeId: [{ required: true, message: "请选择任务航线", trigger: "change" }],
  droneId: [{ required: true, message: "请选择执行无人机", trigger: "change" }],
  airportId: [{ required: true, message: "请选择执行机场", trigger: "change" }],
  algorithmId: [{ required: true, message: "请选择应用算法", trigger: "change" }],
  taskStrategy: [{ required: true, message: "请选择任务策略", trigger: "change" }],
  executeDate: [{ required: true, message: "请选择日期", trigger: "change" }],
  executeTime: [{ required: true, message: "请选择时间", trigger: "change" }],
  status: [{ required: true, message: "请选择执行状态", trigger: "change" }],
};

const mockData: FlightTask[] = [
  {
    id: 1,
    taskName: "南京港口应急测绘",
    routeName: "港区全景航线",
    airportName: "市应急基地主舱",
    droneName: "应急测绘-01 (CW-15)",
    algorithm: "岸线变化分析",
    taskContent: "岸线变化分析、三维建模",
    taskStrategy: "周期定时",
    status: TaskStatus.COMPLETED,
    creator: "孙工",
    createTime: "2025-11-14 08:43:35",
  },
  {
    id: 2,
    taskName: "秦淮河河道日常巡检",
    routeName: "秦淮河东段航线",
    airportName: "城西河道机巢-A1",
    droneName: "河道巡检-03 (M3E)",
    algorithm: "水面漂浮物检测",
    taskContent: "水面漂浮物检测、排污口识别",
    taskStrategy: "定时执行",
    status: TaskStatus.EXECUTING,
    creator: "李主任",
    createTime: "2025-11-14 09:30:55",
  },
  {
    id: 3,
    taskName: "紫金山林火预警巡飞",
    routeName: "紫金山核心区航线",
    airportName: "市应急基地主舱",
    droneName: "林火预警-02 (M300)",
    algorithm: "热成像火点识别",
    taskContent: "热红外巡查、火点识别",
    taskStrategy: "周期定时",
    status: TaskStatus.PENDING,
    creator: "张队长",
    createTime: "2025-11-15 07:00:00",
  },
  {
    id: 4,
    taskName: "高栏港区域安全巡检",
    routeName: "港区东区航线",
    airportName: "市应急基地主舱",
    droneName: "应急测绘-01 (CW-15)",
    algorithm: "目标检测",
    taskContent: "异常人员检测、车辆识别",
    taskStrategy: "定时执行",
    status: TaskStatus.COMPLETED,
    creator: "王工",
    createTime: "2025-11-15 10:15:20",
  },
  {
    id: 5,
    taskName: "化工园区气体泄漏监测",
    routeName: "化工园区环线",
    airportName: "城西河道机巢-A1",
    droneName: "河道巡检-03 (M3E)",
    algorithm: "气体浓度分析",
    taskContent: "VOC浓度检测、泄漏定位",
    taskStrategy: "手动执行",
    status: TaskStatus.FAILED,
    creator: "刘工",
    createTime: "2025-11-16 14:22:10",
  },
];

const tableData = ref<FlightTask[]>(mockData);

const headerCellStyle = () => ({
  backgroundColor: "rgba(23, 44, 81, 1)",
  color: "#FFFFFF",
  borderColor: "rgba(85, 85, 85, 1)",
  fontSize: "14px",
  fontWeight: "600",
});

const cellStyle = () => ({
  backgroundColor: "rgba(15, 31, 58, 1)",
  color: "#FFFFFF",
  borderColor: "rgba(85, 85, 85, 1)",
  fontSize: "13px",
});

const statusMap: Record<number, { label: string; class: string }> = {
  [TaskStatus.PENDING]: { label: "待执行", class: "status--pending" },
  [TaskStatus.EXECUTING]: { label: "执行中", class: "status--executing" },
  [TaskStatus.COMPLETED]: { label: "已完成", class: "status--completed" },
  [TaskStatus.FAILED]: { label: "执行失败", class: "status--failed" },
  [TaskStatus.CANCELLED]: { label: "已取消", class: "status--cancelled" },
};

function getStatusLabel(status: TaskStatus) {
  return statusMap[status]?.label ?? "未知";
}

function getStatusClass(status: TaskStatus) {
  return statusMap[status]?.class ?? "";
}

function handleQuery() {
  queryParams.pageNum = 1;
  ElMessage.info("查询功能将对接后端接口");
}

function handleReset() {
  queryParams.taskName = undefined;
  queryParams.routeName = undefined;
  queryParams.airportName = undefined;
  queryParams.status = undefined;
  queryParams.droneName = undefined;
  queryParams.pageNum = 1;
  handleQuery();
}

function handleAdd() {
  dialogTitle.value = "新增任务";
  Object.assign(formData, initFormData());
  dialogVisible.value = true;
}

function handleEdit(row: FlightTask) {
  dialogTitle.value = "编辑任务";
  Object.assign(formData, {
    id: row.id,
    taskName: row.taskName,
    taskStrategy:
      row.taskStrategy === "周期定时"
        ? "periodic"
        : row.taskStrategy === "定时执行"
          ? "scheduled"
          : "manual",
  });
  dialogVisible.value = true;
}

function handleDetail(row: FlightTask) {
  ElMessage.info(`查看任务详情: ${row.taskName}`);
}

function handleRecord(row: FlightTask) {
  ElMessage.info(`查看飞行记录: ${row.taskName}`);
}

function handleDelete(row: FlightTask) {
  ElMessageBox.confirm(`确认删除任务【${row.taskName}】?`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    customClass: "dark-message-box",
  })
    .then(() => {
      ElMessage.success("删除成功");
    })
    .catch(() => {});
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();
  ElMessage.success(formData.id ? "编辑成功" : "新增成功");
  dialogVisible.value = false;
}

total.value = mockData.length;
</script>

<style lang="scss" scoped>
.task-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  padding: 0;
  overflow: auto;
  background: #0a1628;
}

/* === 顶部渐变搜索区 === */
.search-header {
  flex-shrink: 0;
  padding: 20px 24px 16px;
  background: linear-gradient(180deg, #2b4b85 0%, rgba(46, 87, 153, 0.3) 100%);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: flex-end;
}

.search-item {
  margin-bottom: 0 !important;

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 400;
    color: #0abaff !important;
  }
}

.search-input,
.search-select {
  width: 200px;

  :deep(.el-input__wrapper) {
    background-color: rgba(15, 31, 58, 0.8);
    border: 1px solid rgba(85, 85, 85, 1);
    box-shadow: none;

    .el-input__inner {
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  :deep(.el-select__wrapper) {
    color: #fff;
    background-color: rgba(15, 31, 58, 0.8);
    border: 1px solid rgba(85, 85, 85, 1);
    box-shadow: none;
  }
}

.search-btns {
  margin-bottom: 0 !important;
  margin-left: auto;
}

.btn-query {
  min-width: 88px;
  font-size: 14px;
  color: #fff;
  letter-spacing: 2px;
  background-color: rgba(24, 144, 255, 1);
  border: 1px solid rgba(10, 186, 255, 1);
  border-radius: 6px;

  &:hover {
    background-color: rgba(37, 97, 239, 0.6);
    border-color: rgba(10, 186, 255, 1);
  }
}

.btn-reset {
  min-width: 88px;
  font-size: 14px;
  color: #0abaff;
  letter-spacing: 2px;
  background-color: transparent;
  border: 1px solid rgba(10, 186, 255, 1);
  border-radius: 6px;

  &:hover {
    color: #0abaff;
    background-color: rgba(37, 97, 239, 0.2);
    border-color: rgba(10, 186, 255, 1);
  }
}

/* === 工具栏 === */
.toolbar {
  flex-shrink: 0;
  padding: 12px 24px;
}

.btn-add {
  font-size: 14px;
  color: #fff;
  background-color: rgba(24, 144, 255, 1);
  border: 1px solid rgba(10, 186, 255, 1);
  border-radius: 6px;

  &:hover {
    background-color: rgba(37, 97, 239, 0.6);
    border-color: rgba(10, 186, 255, 1);
  }
}

/* === 表格区域 === */
.table-wrapper {
  flex: 1;
  padding: 0 24px;
  overflow: hidden;
}

.dark-table {
  width: 100%;
  background-color: transparent !important;

  &::before {
    background-color: rgba(85, 85, 85, 1);
  }

  :deep(.el-table__inner-wrapper) {
    &::before {
      background-color: rgba(85, 85, 85, 1);
    }
  }

  :deep(th.el-table__cell) {
    padding: 14px 0;
    font-size: 14px;
    color: #fff;
    background-color: rgba(23, 44, 81, 1) !important;
    border-color: rgba(85, 85, 85, 1) !important;
  }

  :deep(td.el-table__cell) {
    padding: 12px 0;
    font-size: 13px;
    color: #fff;
    background-color: rgba(15, 31, 58, 1) !important;
    border-color: rgba(85, 85, 85, 1) !important;
  }

  :deep(tr:hover > td.el-table__cell) {
    background-color: rgba(23, 44, 81, 0.6) !important;
  }

  :deep(.el-table__fixed-right-patch) {
    background-color: rgba(23, 44, 81, 1) !important;
  }

  :deep(.el-table__border-left-patch) {
    background-color: rgba(85, 85, 85, 1);
  }

  :deep(.el-scrollbar__bar) {
    opacity: 0.3;
  }

  :deep(.el-table__empty-block) {
    background-color: rgba(15, 31, 58, 1);
  }

  :deep(.el-table__empty-text) {
    color: rgba(255, 255, 255, 0.5);
  }
}

/* 状态标签 */
.status--pending {
  color: #e6a23c;
}

.status--executing {
  color: #0abaff;
}

.status--completed {
  color: #19be6b;
}

.status--failed {
  color: #ff6666;
}

.status--cancelled {
  color: #909399;
}

/* 操作链接 */
.action-link {
  padding: 0 4px;
  font-size: 13px;
  color: #0abaff !important;

  &:hover {
    color: #40c9ff !important;
  }

  &--danger {
    color: #ff6666 !important;

    &:hover {
      color: #ff8888 !important;
    }
  }
}

/* === 分页 === */
.pagination-wrapper {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: 16px 24px;

  :deep(.el-pagination) {
    --el-pagination-bg-color: transparent;
    --el-pagination-text-color: #fff;
    --el-pagination-button-bg-color: rgba(23, 44, 81, 1);
    --el-pagination-button-color: #fff;
    --el-pagination-hover-color: #0abaff;

    .el-pager li {
      min-width: 32px;
      color: #fff;
      background-color: rgba(23, 44, 81, 1);
      border-radius: 4px;

      &.is-active {
        color: #fff;
        background-color: rgba(24, 144, 255, 1);
      }

      &:hover {
        color: #0abaff;
      }
    }

    .btn-prev,
    .btn-next {
      color: #fff;
      background-color: rgba(23, 44, 81, 1) !important;
      border-radius: 4px;
    }

    .el-pagination__total,
    .el-pagination__jump {
      color: rgba(255, 255, 255, 0.7);
    }

    .el-input__wrapper {
      background-color: rgba(15, 31, 58, 0.8);
      border: 1px solid rgba(85, 85, 85, 1);
      box-shadow: none;

      .el-input__inner {
        color: #fff;
      }
    }

    .el-select {
      .el-select__wrapper {
        color: #fff;
        background-color: rgba(15, 31, 58, 0.8);
        border: 1px solid rgba(85, 85, 85, 1);
        box-shadow: none;
      }
    }
  }
}

/* === 弹窗样式 === */
.task-dialog {
  :deep(.el-dialog) {
    background-color: #0f1f3a;
    border: 1px solid rgba(85, 85, 85, 0.5);
    border-radius: 8px;
  }

  :deep(.el-dialog__header) {
    padding: 16px 24px;
    margin-right: 0;
    background-color: rgba(23, 44, 81, 1);
    border-bottom: 1px solid rgba(85, 85, 85, 0.5);
    border-radius: 8px 8px 0 0;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: rgba(255, 255, 255, 0.6);

      &:hover {
        color: #0abaff;
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    background-color: #0f1f3a;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 24px;
    background-color: #0f1f3a;
    border-top: 1px solid rgba(85, 85, 85, 0.3);
    border-radius: 0 0 8px 8px;
  }
}

.task-form {
  :deep(.el-form-item__label) {
    font-size: 14px;
    color: #0abaff;
  }

  :deep(.el-input__wrapper) {
    background-color: rgba(15, 31, 58, 0.8);
    border: 1px solid rgba(85, 85, 85, 1);
    box-shadow: none;

    .el-input__inner {
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  :deep(.el-select__wrapper) {
    color: #fff;
    background-color: rgba(15, 31, 58, 0.8);
    border: 1px solid rgba(85, 85, 85, 1);
    box-shadow: none;
  }

  :deep(.el-radio) {
    color: #fff;

    .el-radio__inner {
      background-color: transparent;
      border-color: rgba(37, 97, 239, 1);
    }

    &.is-checked {
      .el-radio__inner {
        background-color: rgba(37, 97, 239, 1);
        border-color: rgba(37, 97, 239, 1);
      }

      .el-radio__label {
        color: #0abaff;
      }
    }
  }

  :deep(.el-date-editor) {
    --el-date-editor-width: 100%;

    .el-input__wrapper {
      background-color: rgba(15, 31, 58, 0.8);
      border: 1px solid rgba(85, 85, 85, 1);
      box-shadow: none;

      .el-input__inner {
        color: #fff;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  .el-button--primary {
    background-color: rgba(24, 144, 255, 1);
    border-color: rgba(10, 186, 255, 1);
    border-radius: 6px;
  }

  .el-button:not(.el-button--primary) {
    color: #fff;
    background-color: transparent;
    border: 1px solid rgba(85, 85, 85, 1);
    border-radius: 6px;

    &:hover {
      color: #0abaff;
      border-color: rgba(10, 186, 255, 1);
    }
  }
}
</style>
