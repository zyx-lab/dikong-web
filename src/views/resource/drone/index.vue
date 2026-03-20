<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Aircraft Readiness Matrix</p>
            <h2 class="command-page__title">无人机管理</h2>
            <p class="command-page__description">
              将可用性、维护压力和保险风险收拢到同一张资源态势面里，让机队状态在进入列表前就先有重点与轻重缓急。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">机队就绪态势</span>
            <span class="command-page__signal">维护风险前置</span>
            <span class="command-page__signal">控制权一眼可见</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">无人机总量</div>
            <div class="command-page__metric-value">{{ total }}</div>
            <div class="command-page__metric-note">当前筛选范围内的机队资源</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">在线就绪</div>
            <div class="command-page__metric-value">
              {{ onlineDroneCount }}
              <span class="command-page__metric-sub">/ {{ total || 0 }}</span>
            </div>
            <div class="command-page__metric-note">实时可调度的机体数量</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">保养提醒</div>
            <div class="command-page__metric-value">{{ maintenanceAlertCount }}</div>
            <div class="command-page__metric-note">需要安排维护窗口的机体</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">保险风险</div>
            <div class="command-page__metric-value">{{ insuranceRiskCount }}</div>
            <div class="command-page__metric-note">存在保险到期或过期风险</div>
          </div>
        </div>
      </div>
    </section>

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
            class="filter-field"
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
            class="filter-field"
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
            class="filter-field"
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
            class="filter-field"
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
            class="filter-field"
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
          <div class="table-toolbar-summary">
            <el-tag type="info">共 {{ total }} 架无人机</el-tag>
            <el-tag type="warning">保养提醒 {{ maintenanceAlertCount }} 架</el-tag>
            <el-tag type="danger">保险风险 {{ insuranceRiskCount }} 架</el-tag>
            <el-tag v-if="selectedIds.length > 0" type="primary">
              已选 {{ selectedIds.length }} 项
            </el-tag>
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
                :type="getControlAuthorityTagType(item)"
                class="authority-tag"
                size="small"
                effect="plain"
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
        <template #empty>
          <div class="table-empty-state">
            <el-empty
              :description="hasActiveFilters ? '当前筛选条件下暂无无人机' : '暂无无人机数据'"
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

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      :width="dialogWidth"
      align-center
      destroy-on-close
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
                <el-input
                  v-model="formData.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
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
import { computed, onMounted, reactive, ref } from "vue";
import { useWindowSize } from "@vueuse/core";
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
import { buildDroneMockData } from "../shared/mock-data";

defineOptions({
  name: "ResourceDrone",
  inheritAttrs: false,
});

const { width } = useWindowSize();
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
  { label: "独占控制", value: DroneControlAuthority.EXCLUSIVE },
  { label: "共享控制", value: DroneControlAuthority.SHARED },
  { label: "团队控制", value: DroneControlAuthority.TEAM },
];

const droneStatusOptions = [
  { label: "在线", value: DroneStatus.ONLINE },
  { label: "未对接", value: DroneStatus.OFFLINE },
  { label: "维护中", value: DroneStatus.MAINTENANCE },
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
const filteredDroneList = ref<DroneInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const submitLoading = ref(false);
const selectedIds = ref<number[]>([]);

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "860px"));
const hasActiveFilters = computed(() =>
  Boolean(
    queryParams.snCode ||
    queryParams.droneName ||
    queryParams.organization ||
    queryParams.controlMode ||
    queryParams.controlAuthority ||
    queryParams.maintenanceStatus ||
    queryParams.insuranceStatus
  )
);
const maintenanceAlertCount = computed(
  () =>
    filteredDroneList.value.filter(
      (item) => item.maintenanceStatus !== DroneMaintenanceStatus.NORMAL
    ).length
);
const onlineDroneCount = computed(
  () => filteredDroneList.value.filter((item) => item.status === DroneStatus.ONLINE).length
);
const insuranceRiskCount = computed(
  () =>
    filteredDroneList.value.filter((item) => item.insuranceStatus !== DroneInsuranceStatus.NORMAL)
      .length
);

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

function getControlAuthorityTagType(value?: DroneControlAuthority): "info" | "success" | "warning" {
  switch (value) {
    case DroneControlAuthority.SHARED:
      return "success";
    case DroneControlAuthority.TEAM:
      return "warning";
    default:
      return "info";
  }
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
  return buildDroneMockData();
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

    filteredDroneList.value = mockData;
    total.value = mockData.length;

    const pageNum = queryParams.pageNum ?? 1;
    const pageSize = queryParams.pageSize ?? 10;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    tableData.value = mockData.slice(startIndex, endIndex);
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
    `无人机序号：${row.snCode}<br/>型号：${row.model}<br/>控制模式：${getControlModeLabel(row.controlMode)}<br/>控制权：${row.controlAuthority.map((item) => getControlAuthorityLabel(item)).join("、")}<br/>所属机场：${row.airportName ?? "-"}<br/>保养状态：${getMaintenanceStatusLabel(row.maintenanceStatus)}<br/>保险状态：${getInsuranceStatusLabel(row.insuranceStatus)}`,
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
  const ids = id ? [String(id)] : selectedIds.value.map(String);
  if (ids.length === 0) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  const message =
    ids.length === 1 ? "确认删除当前无人机数据吗？" : `确认删除选中的 ${ids.length} 架无人机吗？`;

  ElMessageBox.confirm(message, "警告", {
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

.authority-tag {
  margin-right: 0;
}
</style>
