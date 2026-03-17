<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="无人机序号" prop="snCode">
          <el-input
            v-model="queryParams.snCode"
            placeholder="请输入无人机序号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="无人机名称" prop="droneName">
          <el-input
            v-model="queryParams.droneName"
            placeholder="请输入无人机名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="控制权" prop="controlAuthority">
          <el-select
            v-model="queryParams.controlAuthority"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in controlAuthorityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="所属组织" prop="organization">
          <el-select
            v-model="queryParams.organization"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in organizationOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="控制模式" prop="controlMode">
          <el-select
            v-model="queryParams.controlMode"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in controlModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="保养状态" prop="maintenanceStatus">
          <el-select
            v-model="queryParams.maintenanceStatus"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in maintenanceStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="保险状态" prop="insuranceStatus">
          <el-select
            v-model="queryParams.insuranceStatus"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in insuranceStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
        <div class="table-section__toolbar--actions">
          <el-button type="primary" icon="plus" @click="handleCreateClick">新增无人机</el-button>
          <el-button
            type="danger"
            icon="delete"
            :disabled="selectedIds.length === 0"
            @click="handleDelete()"
          >
            批量删除
          </el-button>
        </div>
        <div class="table-section__toolbar--right">
          <el-tag type="info">总共 {{ total }} 个数据</el-tag>
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
        <el-table-column label="无人机序号" prop="snCode" min-width="170" show-overflow-tooltip />
        <el-table-column
          label="无人机名称"
          prop="droneName"
          min-width="130"
          show-overflow-tooltip
        />
        <el-table-column label="品牌" prop="brand" min-width="80" align="center" />
        <el-table-column label="型号" prop="model" min-width="110" show-overflow-tooltip />
        <el-table-column label="控制模式" prop="controlMode" width="110" align="center">
          <template #default="scope">
            {{ getControlModeLabel(scope.row.controlMode) }}
          </template>
        </el-table-column>
        <el-table-column
          label="所属机场"
          prop="airportName"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          label="所属组织"
          prop="organization"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column label="控制权" min-width="160" align="center">
          <template #default="scope">
            <div class="authority-tags">
              <el-tag
                v-for="item in scope.row.controlAuthority"
                :key="item"
                size="small"
                effect="dark"
              >
                {{ getControlAuthorityLabel(item) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="使用状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getDroneStatusTagType(scope.row.status)">
              {{ getDroneStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="保养状态" prop="maintenanceStatus" width="100" align="center">
          <template #default="scope">
            <span :class="getMaintenanceTextClass(scope.row.maintenanceStatus)">
              {{ getMaintenanceStatusLabel(scope.row.maintenanceStatus) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="保险状态" prop="insuranceStatus" width="100" align="center">
          <template #default="scope">
            <span :class="getInsuranceTextClass(scope.row.insuranceStatus)">
              {{ getInsuranceStatusLabel(scope.row.insuranceStatus) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" min-width="160" />
        <el-table-column fixed="right" label="操作" align="center" width="180">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleDetailClick(scope.row)">
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleEditClick(scope.row)">
              编辑
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

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="860px"
      custom-class="dialog-form-decorated dialog-form-layout"
      class="dialog-form-decorated dialog-form-layout"
      @close="closeDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
        <div class="dialog-form-section">
          <div class="dialog-form-section__title">基础信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="无人机序号" prop="snCode">
                <el-input v-model="formData.snCode" placeholder="请输入无人机序号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="无人机名称" prop="droneName">
                <el-input v-model="formData.droneName" placeholder="请输入无人机名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="品牌" prop="brand">
                <el-select v-model="formData.brand" placeholder="请选择品牌" class="w-full">
                  <el-option v-for="item in brandOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="型号" prop="model">
                <el-input v-model="formData.model" placeholder="请输入型号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="控制模式" prop="controlMode">
                <el-select v-model="formData.controlMode" placeholder="请选择" class="w-full">
                  <el-option
                    v-for="item in controlModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属机场" prop="airportName">
                <el-select v-model="formData.airportName" placeholder="请选择" class="w-full">
                  <el-option
                    v-for="item in airportOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属组织" prop="organization">
                <el-select v-model="formData.organization" placeholder="请选择" class="w-full">
                  <el-option
                    v-for="item in organizationOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="控制权" prop="controlAuthority">
                <el-select
                  v-model="formData.controlAuthority"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="请选择控制权"
                  class="w-full"
                >
                  <el-option
                    v-for="item in controlAuthorityOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="dialog-form-section">
          <div class="dialog-form-section__title">运维信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="使用状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择" class="w-full">
                  <el-option
                    v-for="item in droneStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养状态" prop="maintenanceStatus">
                <el-select v-model="formData.maintenanceStatus" placeholder="请选择" class="w-full">
                  <el-option
                    v-for="item in maintenanceStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保险状态" prop="insuranceStatus">
                <el-select v-model="formData.insuranceStatus" placeholder="请选择" class="w-full">
                  <el-option
                    v-for="item in insuranceStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="formData.remark" placeholder="请输入备注信息" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  DroneControlAuthority,
  DroneControlMode,
  DroneInsuranceStatus,
  DroneMaintenanceStatus,
  DroneStatus,
  type DroneForm,
  type DroneInfo,
  type DroneQuery,
} from "@/api/resource/types";

defineOptions({
  name: "ResourceDrone",
  inheritAttrs: false,
});

const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

const organizationOptions = ["公安局", "交通局", "应急局", "生态环境局", "林业局"];
const airportOptions = [
  "珠海分局机场-01",
  "香洲移动站",
  "珠海高栏机场",
  "湿地森林公园站",
  "香洲区环保方舱",
];
const brandOptions = ["大疆", "纵横", "极飞", "科比特"];

const controlModeOptions = [
  { label: "平台控制", value: DroneControlMode.PLATFORM },
  { label: "遥控器控制", value: DroneControlMode.REMOTE },
];

const controlAuthorityOptions = [
  { label: "诸葛亮", value: DroneControlAuthority.EXCLUSIVE },
  { label: "孙策", value: DroneControlAuthority.SHARED },
  { label: "赵云", value: DroneControlAuthority.TEAM },
];

const droneStatusOptions = [
  { label: "在线", value: DroneStatus.ONLINE },
  { label: "未对接", value: DroneStatus.OFFLINE },
  { label: "离线", value: DroneStatus.MAINTENANCE },
];

const maintenanceStatusOptions = [
  { label: "正常", value: DroneMaintenanceStatus.NORMAL },
  { label: "需保养", value: DroneMaintenanceStatus.NEEDS_MAINTENANCE },
  { label: "超期", value: DroneMaintenanceStatus.OVERDUE },
];

const insuranceStatusOptions = [
  { label: "正常", value: DroneInsuranceStatus.NORMAL },
  { label: "即将到期", value: DroneInsuranceStatus.EXPIRING_SOON },
  { label: "已过期", value: DroneInsuranceStatus.EXPIRED },
];

const initialFormData: DroneForm = {
  snCode: "",
  droneName: "",
  brand: "",
  model: "",
  controlMode: DroneControlMode.PLATFORM,
  airportName: undefined,
  organization: undefined,
  controlAuthority: [],
  status: DroneStatus.ONLINE,
  maintenanceStatus: DroneMaintenanceStatus.NORMAL,
  insuranceStatus: DroneInsuranceStatus.NORMAL,
  remark: "",
};

const queryParams = reactive<DroneQuery>({
  pageNum: 1,
  pageSize: 10,
});

const formData = reactive<DroneForm>({ ...initialFormData });
const tableData = ref<DroneInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const submitLoading = ref(false);
const selectedIds = ref<number[]>([]);

const dialogState = reactive({
  visible: false,
  title: "新增无人机",
});

const rules: FormRules<DroneForm> = {
  snCode: [{ required: true, message: "请输入无人机序号", trigger: "blur" }],
  droneName: [{ required: true, message: "请输入无人机名称", trigger: "blur" }],
  brand: [{ required: true, message: "请选择品牌", trigger: "change" }],
  model: [{ required: true, message: "请输入型号", trigger: "blur" }],
  controlMode: [{ required: true, message: "请选择控制模式", trigger: "change" }],
  organization: [{ required: true, message: "请选择所属组织", trigger: "change" }],
  controlAuthority: [{ required: true, message: "请选择控制权", trigger: "change" }],
  status: [{ required: true, message: "请选择使用状态", trigger: "change" }],
  maintenanceStatus: [{ required: true, message: "请选择保养状态", trigger: "change" }],
  insuranceStatus: [{ required: true, message: "请选择保险状态", trigger: "change" }],
};

function getControlModeLabel(value?: DroneControlMode): string {
  return controlModeOptions.find((item) => item.value === value)?.label ?? "-";
}

function getControlAuthorityLabel(value?: DroneControlAuthority): string {
  return controlAuthorityOptions.find((item) => item.value === value)?.label ?? "-";
}

function getDroneStatusLabel(value?: DroneStatus): string {
  return droneStatusOptions.find((item) => item.value === value)?.label ?? "-";
}

function getDroneStatusTagType(value?: DroneStatus): "success" | "info" | "danger" {
  switch (value) {
    case DroneStatus.ONLINE:
      return "success";
    case DroneStatus.MAINTENANCE:
      return "danger";
    default:
      return "info";
  }
}

function getMaintenanceStatusLabel(value?: DroneMaintenanceStatus): string {
  return maintenanceStatusOptions.find((item) => item.value === value)?.label ?? "-";
}

function getInsuranceStatusLabel(value?: DroneInsuranceStatus): string {
  return insuranceStatusOptions.find((item) => item.value === value)?.label ?? "-";
}

function getMaintenanceTextClass(value?: DroneMaintenanceStatus): string {
  if (value === DroneMaintenanceStatus.OVERDUE) return "status-text status-text--danger";
  if (value === DroneMaintenanceStatus.NEEDS_MAINTENANCE) return "status-text status-text--warning";
  return "status-text";
}

function getInsuranceTextClass(value?: DroneInsuranceStatus): string {
  if (value === DroneInsuranceStatus.EXPIRED) return "status-text status-text--danger";
  if (value === DroneInsuranceStatus.EXPIRING_SOON) return "status-text status-text--warning";
  return "status-text";
}

function buildMockData(): DroneInfo[] {
  return [
    {
      id: 1,
      snCode: "0ABCD1EFGH2JK345",
      droneName: "珠海巡警-01",
      brand: "大疆",
      model: "Matrice 350 RTK",
      controlMode: DroneControlMode.PLATFORM,
      airportName: "珠海分局机场-01",
      organization: "公安局",
      controlAuthority: [DroneControlAuthority.EXCLUSIVE],
      status: DroneStatus.ONLINE,
      maintenanceStatus: DroneMaintenanceStatus.NEEDS_MAINTENANCE,
      insuranceStatus: DroneInsuranceStatus.NORMAL,
      createdAt: "2025-11-14 08:43:30",
      remark: "日常巡逻机组",
    },
    {
      id: 2,
      snCode: "3LMN4OPQR5ST678UV",
      droneName: "河道巡检-03",
      brand: "大疆",
      model: "Mavic 3E",
      controlMode: DroneControlMode.REMOTE,
      airportName: "-",
      organization: "公安局",
      controlAuthority: [DroneControlAuthority.EXCLUSIVE, DroneControlAuthority.SHARED],
      status: DroneStatus.OFFLINE,
      maintenanceStatus: DroneMaintenanceStatus.NORMAL,
      insuranceStatus: DroneInsuranceStatus.EXPIRING_SOON,
      createdAt: "2025-11-14 08:43:35",
      remark: "河道日常巡查",
    },
    {
      id: 3,
      snCode: "9WXY0ZABC1DEF234G",
      droneName: "城管执法-02",
      brand: "大疆",
      model: "Mavic 3T",
      controlMode: DroneControlMode.REMOTE,
      airportName: "-",
      organization: "交通局",
      controlAuthority: [DroneControlAuthority.EXCLUSIVE, DroneControlAuthority.SHARED],
      status: DroneStatus.OFFLINE,
      maintenanceStatus: DroneMaintenanceStatus.NORMAL,
      insuranceStatus: DroneInsuranceStatus.NORMAL,
      createdAt: "2025-11-14 09:30:55",
      remark: "城区巡查执法",
    },
    {
      id: 4,
      snCode: "5HIJ6KLM7NOP890RS",
      droneName: "演示测试机",
      brand: "大疆",
      model: "Air 2S",
      controlMode: DroneControlMode.REMOTE,
      airportName: "-",
      organization: "交通局",
      controlAuthority: [DroneControlAuthority.TEAM, DroneControlAuthority.SHARED],
      status: DroneStatus.OFFLINE,
      maintenanceStatus: DroneMaintenanceStatus.OVERDUE,
      insuranceStatus: DroneInsuranceStatus.NORMAL,
      createdAt: "2025-11-14 08:43:40",
      remark: "演示培训使用",
    },
    {
      id: 5,
      snCode: "2TUV3WXY4ZAB567CD",
      droneName: "应急测绘-01",
      brand: "纵横",
      model: "CW-15",
      controlMode: DroneControlMode.PLATFORM,
      airportName: "香洲移动站",
      organization: "交通局",
      controlAuthority: [DroneControlAuthority.TEAM],
      status: DroneStatus.ONLINE,
      maintenanceStatus: DroneMaintenanceStatus.NORMAL,
      insuranceStatus: DroneInsuranceStatus.EXPIRED,
      createdAt: "2025-11-14 09:30:55",
      remark: "应急响应使用",
    },
    {
      id: 6,
      snCode: "8EFG9HIJ0KLM123NP",
      droneName: "珠海交警-01",
      brand: "大疆",
      model: "Matrice 30",
      controlMode: DroneControlMode.PLATFORM,
      airportName: "珠海高栏机场",
      organization: "交通局",
      controlAuthority: [
        DroneControlAuthority.TEAM,
        DroneControlAuthority.SHARED,
        DroneControlAuthority.EXCLUSIVE,
      ],
      status: DroneStatus.MAINTENANCE,
      maintenanceStatus: DroneMaintenanceStatus.NORMAL,
      insuranceStatus: DroneInsuranceStatus.NORMAL,
      createdAt: "2025-11-14 08:43:40",
      remark: "高速巡查任务",
    },
    {
      id: 7,
      snCode: "4QRS5TUV6WXY789ZA",
      droneName: "林业巡查-01",
      brand: "大疆",
      model: "Mavic 3M",
      controlMode: DroneControlMode.PLATFORM,
      airportName: "湿地森林公园站",
      organization: "交通局",
      controlAuthority: [
        DroneControlAuthority.TEAM,
        DroneControlAuthority.SHARED,
        DroneControlAuthority.EXCLUSIVE,
      ],
      status: DroneStatus.ONLINE,
      maintenanceStatus: DroneMaintenanceStatus.NORMAL,
      insuranceStatus: DroneInsuranceStatus.NORMAL,
      createdAt: "2025-11-14 09:30:55",
      remark: "林业资源巡护",
    },
    {
      id: 8,
      snCode: "1BCDE2FGHIJ45K6LM",
      droneName: "环保监测-01",
      brand: "极飞",
      model: "XB2025",
      controlMode: DroneControlMode.PLATFORM,
      airportName: "香洲区环保方舱",
      organization: "交通局",
      controlAuthority: [
        DroneControlAuthority.TEAM,
        DroneControlAuthority.SHARED,
        DroneControlAuthority.EXCLUSIVE,
      ],
      status: DroneStatus.ONLINE,
      maintenanceStatus: DroneMaintenanceStatus.NEEDS_MAINTENANCE,
      insuranceStatus: DroneInsuranceStatus.EXPIRING_SOON,
      createdAt: "2025-11-14 08:43:40",
      remark: "环保监测任务",
    },
  ];
}

function fetchData(): void {
  loading.value = true;

  setTimeout(() => {
    let mockData = buildMockData();

    if (queryParams.snCode) {
      mockData = mockData.filter((item) => item.snCode.includes(queryParams.snCode!));
    }

    if (queryParams.droneName) {
      mockData = mockData.filter((item) => item.droneName.includes(queryParams.droneName!));
    }

    if (queryParams.organization) {
      mockData = mockData.filter((item) => item.organization === queryParams.organization);
    }

    if (queryParams.controlMode) {
      mockData = mockData.filter((item) => item.controlMode === queryParams.controlMode);
    }

    if (queryParams.controlAuthority) {
      mockData = mockData.filter((item) =>
        item.controlAuthority.includes(queryParams.controlAuthority as DroneControlAuthority)
      );
    }

    if (queryParams.maintenanceStatus) {
      mockData = mockData.filter(
        (item) => item.maintenanceStatus === queryParams.maintenanceStatus
      );
    }

    if (queryParams.insuranceStatus) {
      mockData = mockData.filter((item) => item.insuranceStatus === queryParams.insuranceStatus);
    }

    tableData.value = mockData;
    total.value = 85;
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
  fetchData();
}

function handleSelectionChange(selection: DroneInfo[]): void {
  selectedIds.value = selection.map((item) => item.id);
}

function resetForm(): void {
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  Object.assign(formData, initialFormData);
}

function handleCreateClick(): void {
  resetForm();
  dialogState.title = "新增无人机";
  dialogState.visible = true;
}

function handleEditClick(row: DroneInfo): void {
  resetForm();
  dialogState.title = "编辑无人机";
  Object.assign(formData, {
    id: row.id,
    snCode: row.snCode,
    droneName: row.droneName,
    brand: row.brand,
    model: row.model,
    controlMode: row.controlMode,
    airportName: row.airportName,
    organization: row.organization,
    controlAuthority: [...row.controlAuthority],
    status: row.status,
    maintenanceStatus: row.maintenanceStatus,
    insuranceStatus: row.insuranceStatus,
    remark: row.remark ?? "",
  });
  dialogState.visible = true;
}

function handleDetailClick(row: DroneInfo): void {
  ElMessageBox.alert(
    `型号：${row.model}<br/>控制模式：${getControlModeLabel(row.controlMode)}<br/>所属机场：${row.airportName ?? "-"}<br/>保养状态：${getMaintenanceStatusLabel(row.maintenanceStatus)}<br/>保险状态：${getInsuranceStatusLabel(row.insuranceStatus)}`,
    `无人机详情：${row.droneName}`,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "确定",
    }
  );
}

function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (!valid) return;

    submitLoading.value = true;
    setTimeout(() => {
      ElMessage.success(formData.id ? "无人机信息修改成功" : "无人机新增成功");
      submitLoading.value = false;
      closeDialog();
      handleQuery();
    }, 400);
  });
}

function closeDialog(): void {
  dialogState.visible = false;
  resetForm();
}

function handleDelete(id?: number): void {
  const ids = id ? String(id) : selectedIds.value.join(",");
  if (!ids) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除选中的无人机数据吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      setTimeout(() => {
        ElMessage.success("删除成功");
        loading.value = false;
        handleQuery();
      }, 300);
    },
    () => {
      /* 用户取消 */
    }
  );
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.w-full {
  width: 100%;
}

.authority-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.status-text {
  font-weight: 600;
  color: var(--el-color-success);
}

.status-text--warning {
  color: var(--el-color-warning);
}

.status-text--danger {
  color: var(--el-color-danger);
}
</style>
