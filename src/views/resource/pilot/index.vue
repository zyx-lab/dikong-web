<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Pilot Duty Matrix</p>
            <h2 class="command-page__title">飞手管理</h2>
            <p class="command-page__description">
              把飞手账号、证件合规与机体分配关系放到同一张值守工作面中，便于快速判断谁可立即投入执行、谁需要补齐资料或调配。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">值守人员编组</span>
            <span class="command-page__signal">证件合规检查</span>
            <span class="command-page__signal">机体分配联动</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">飞手总量</div>
            <div class="command-page__metric-value">{{ total }}</div>
            <div class="command-page__metric-note">当前筛选结果中的飞手资源池</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">启用账号</div>
            <div class="command-page__metric-value">{{ enabledPilotCount }}</div>
            <div class="command-page__metric-note">可直接投入排班的账号数量</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">已分配机体</div>
            <div class="command-page__metric-value">{{ assignedPilotCount }}</div>
            <div class="command-page__metric-note">具备明确机体协同关系的飞手</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">资料完备</div>
            <div class="command-page__metric-value">{{ certificateReadyCount }}</div>
            <div class="command-page__metric-note">证件扫描件已齐备的飞手数量</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="用户账号" prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户账号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="用户姓名" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入飞手姓名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="组织部门" prop="organization">
          <el-select
            v-model="queryParams.organization"
            placeholder="请选择组织部门"
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

        <el-form-item label="证件类型" prop="certificateType">
          <el-select
            v-model="queryParams.certificateType"
            placeholder="请选择证件类型"
            clearable
            class="filter-field"
          >
            <el-option
              v-for="item in certificateTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="控制模式" prop="controlMode">
          <el-select
            v-model="queryParams.controlMode"
            placeholder="请选择控制模式"
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

        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">查询</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <el-button type="primary" icon="plus" @click="handleCreateClick">新增飞手</el-button>
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
            <el-tag type="info">共 {{ total }} 位飞手</el-tag>
            <el-tag type="success">启用 {{ enabledPilotCount }} 位</el-tag>
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
        <el-table-column label="用户账号" prop="username" min-width="120" show-overflow-tooltip />
        <el-table-column label="用户姓名" prop="name" min-width="100" show-overflow-tooltip />
        <el-table-column label="手机号码" prop="phone" min-width="120" />
        <el-table-column
          label="组织部门"
          prop="organization"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="证件类型" prop="certificateType" width="110" align="center">
          <template #default="scope">
            {{ getCertificateTypeLabel(scope.row.certificateType) }}
          </template>
        </el-table-column>
        <el-table-column
          label="所控无人机"
          prop="assignedDroneName"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column label="账号状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
              :active-value="PilotAccountStatus.ENABLED"
              :inactive-value="PilotAccountStatus.DISABLED"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" min-width="160" />
        <el-table-column fixed="right" label="操作" align="center" width="290">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleDetailClick(scope.row)">
              详情
            </el-button>
            <el-button type="primary" link size="small" @click="handleEditClick(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row.id)">
              删除
            </el-button>
            <el-button type="primary" link size="small" @click="handleResetPassword(scope.row)">
              重置密码
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-state">
            <el-empty :description="hasActiveFilters ? '当前筛选条件下暂无飞手' : '暂无飞手数据'" />
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
              <el-form-item label="飞手名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入飞手名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入手机号码" maxlength="11" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属组织" prop="organization">
                <el-select
                  v-model="formData.organization"
                  placeholder="请选择所属组织"
                  class="w-full"
                >
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
              <el-form-item label="所属部门" prop="department">
                <el-select
                  v-model="formData.department"
                  placeholder="请选择所属部门"
                  class="w-full"
                >
                  <el-option
                    v-for="item in departmentOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户账号" prop="username">
                <el-input v-model="formData.username" placeholder="请输入登录账号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户密码" prop="password">
                <el-input
                  v-model="formData.password"
                  type="password"
                  show-password
                  :placeholder="passwordPlaceholder"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱地址" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="formData.remark" placeholder="请输入备注信息" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="dialog-form-section">
          <div class="dialog-form-section__title">证件信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="证件类型" prop="certificateType">
                <el-select
                  v-model="formData.certificateType"
                  placeholder="请选择证件类型"
                  class="w-full"
                >
                  <el-option
                    v-for="item in certificateTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="证件编号" prop="certificateNo">
                <el-input v-model="formData.certificateNo" placeholder="请输入证件编号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发证日期" prop="issuedDate">
                <el-date-picker
                  v-model="formData.issuedDate"
                  type="date"
                  placeholder="请选择发证日期"
                  value-format="YYYY-MM-DD"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="有效期限" prop="validityYears">
                <div class="dialog-inline-field">
                  <el-input-number
                    v-model="formData.validityYears"
                    :min="1"
                    :max="20"
                    controls-position="right"
                    class="dialog-inline-field__input"
                  />
                  <span class="dialog-inline-field__suffix">年</span>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="证件扫描件" prop="certificateScanUrl">
                <SingleImageUpload
                  v-model:model-value="formData.certificateScanUrl"
                  :style="{ width: '96px', height: '96px' }"
                  accept="image/*"
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
  PilotAccountStatus,
  PilotCertificateType,
  PilotControlMode,
  type PilotForm,
  type PilotInfo,
  type PilotQuery,
} from "@/api/resource/types";
import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import { buildPilotMockData } from "../shared/mock-data";

defineOptions({
  name: "ResourcePilot",
  inheritAttrs: false,
});

const { width } = useWindowSize();
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

const organizationOptions = [
  "市公安局-珠海分局",
  "市交通运输局-路政支队",
  "市生态环境局-监察支队",
  "市应急管理局-救援队",
  "市城市管理局-执法大队",
  "市林业局-巡查科",
  "市水务局-河湖管理处",
];

const departmentOptions = [
  "警务飞巡中心",
  "路政巡检组",
  "环境监测组",
  "应急测绘组",
  "城管执法组",
  "林区巡查组",
  "河湖管理组",
];

const certificateTypeOptions = [
  { label: "AOPA合格证", value: PilotCertificateType.AOPA },
  { label: "ALPA合格证", value: PilotCertificateType.ALPA },
  { label: "UTC认证", value: PilotCertificateType.UTC },
];

const controlModeOptions = [
  { label: "自动控制", value: PilotControlMode.AUTO },
  { label: "手动控制", value: PilotControlMode.MANUAL },
  { label: "协同控制", value: PilotControlMode.HYBRID },
];

const initialFormData: PilotForm = {
  username: "",
  password: "",
  name: "",
  phone: "",
  organization: undefined,
  department: undefined,
  email: "",
  remark: "",
  certificateType: undefined,
  certificateNo: "",
  issuedDate: "",
  validityYears: 1,
  certificateScanUrl: "",
  controlMode: PilotControlMode.AUTO,
  assignedDroneName: "",
  status: PilotAccountStatus.ENABLED,
};

const queryParams = reactive<PilotQuery>({
  pageNum: 1,
  pageSize: 10,
});

const formData = reactive<PilotForm>({ ...initialFormData });
const tableData = ref<PilotInfo[]>([]);
const filteredPilotList = ref<PilotInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const submitLoading = ref(false);
const selectedIds = ref<number[]>([]);

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "860px"));
const passwordPlaceholder = computed(() =>
  formData.id ? "如需重置密码，请直接输入新密码" : "请输入登录密码"
);
const hasActiveFilters = computed(() =>
  Boolean(
    queryParams.username ||
    queryParams.name ||
    queryParams.organization ||
    queryParams.certificateType ||
    queryParams.controlMode
  )
);
const enabledPilotCount = computed(
  () => filteredPilotList.value.filter((item) => item.status === PilotAccountStatus.ENABLED).length
);
const assignedPilotCount = computed(
  () =>
    filteredPilotList.value.filter(
      (item) => item.assignedDroneName && item.assignedDroneName !== "暂未分配"
    ).length
);
const certificateReadyCount = computed(
  () => filteredPilotList.value.filter((item) => Boolean(item.certificateScanUrl)).length
);

const dialogState = reactive({
  visible: false,
  title: "新增飞手",
});

const rules: FormRules<PilotForm> = {
  name: [{ required: true, message: "请输入飞手名称", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号码", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" },
  ],
  organization: [{ required: true, message: "请选择所属组织", trigger: "change" }],
  department: [{ required: true, message: "请选择所属部门", trigger: "change" }],
  username: [{ required: true, message: "请输入用户账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入用户密码", trigger: "blur" }],
  certificateType: [{ required: true, message: "请选择证件类型", trigger: "change" }],
  certificateNo: [{ required: true, message: "请输入证件编号", trigger: "blur" }],
  issuedDate: [{ required: true, message: "请选择发证日期", trigger: "change" }],
  validityYears: [{ required: true, message: "请输入有效期限", trigger: "change" }],
  certificateScanUrl: [{ required: true, message: "请上传证件扫描件", trigger: "change" }],
};

function getCertificateTypeLabel(type?: PilotCertificateType): string {
  return certificateTypeOptions.find((item) => item.value === type)?.label ?? type ?? "-";
}

function getControlModeLabel(mode?: PilotControlMode): string {
  return controlModeOptions.find((item) => item.value === mode)?.label ?? mode ?? "-";
}

function buildMockData(): PilotInfo[] {
  return buildPilotMockData();
}

function fetchData(): void {
  loading.value = true;

  setTimeout(() => {
    let mockData = buildMockData();

    if (queryParams.username) {
      mockData = mockData.filter((item) => item.username.includes(queryParams.username!));
    }

    if (queryParams.name) {
      mockData = mockData.filter((item) => item.name.includes(queryParams.name!));
    }

    if (queryParams.organization) {
      mockData = mockData.filter((item) => item.organization === queryParams.organization);
    }

    if (queryParams.certificateType) {
      mockData = mockData.filter((item) => item.certificateType === queryParams.certificateType);
    }

    if (queryParams.controlMode) {
      mockData = mockData.filter((item) => item.controlMode === queryParams.controlMode);
    }

    filteredPilotList.value = mockData;
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

function handleSelectionChange(selection: PilotInfo[]): void {
  selectedIds.value = selection.map((item) => item.id);
}

function resetForm(): void {
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  Object.assign(formData, initialFormData);
}

function handleCreateClick(): void {
  resetForm();
  dialogState.title = "新增飞手";
  dialogState.visible = true;
}

function handleEditClick(row: PilotInfo): void {
  resetForm();
  dialogState.title = "编辑飞手";
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    password: "123456",
    name: row.name,
    phone: row.phone.replace(/\*/g, "0"),
    organization: row.organization,
    department: row.department,
    email: row.email ?? "",
    remark: row.remark ?? "",
    certificateType: row.certificateType,
    certificateNo: row.certificateNo,
    issuedDate: row.issuedDate ?? "",
    validityYears: row.validityYears ?? 1,
    certificateScanUrl: row.certificateScanUrl ?? "",
    controlMode: row.controlMode,
    assignedDroneName: row.assignedDroneName ?? "",
    status: row.status,
  });
  dialogState.visible = true;
}

function handleDetailClick(row: PilotInfo): void {
  ElMessageBox.alert(
    `登录账号：${row.username}<br/>证件类型：${getCertificateTypeLabel(row.certificateType)}<br/>控制模式：${getControlModeLabel(row.controlMode)}<br/>所属部门：${row.department}<br/>所控无人机：${row.assignedDroneName ?? "暂未分配"}`,
    `飞手详情：${row.name}`,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "确定",
    }
  );
}

function handleResetPassword(row: PilotInfo): void {
  ElMessageBox.confirm(`确认重置飞手【${row.name}】的登录密码吗？`, "重置密码", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      ElMessage.success("密码已重置为初始密码");
    },
    () => {
      /* 用户取消 */
    }
  );
}

function handleStatusChange(row: PilotInfo): void {
  const action = row.status === PilotAccountStatus.ENABLED ? "启用" : "停用";
  ElMessage.success(`已${action}飞手账号：${row.name}`);
}

function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (!valid) return;

    submitLoading.value = true;
    setTimeout(() => {
      ElMessage.success(formData.id ? "飞手信息修改成功" : "飞手新增成功");
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
    ids.length === 1 ? "确认删除当前飞手数据吗？" : `确认删除选中的 ${ids.length} 位飞手吗？`;

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

<style scoped>
.w-full {
  width: 100%;
}
</style>
