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
            <div class="command-page__metric-value">{{ total }}</div>
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
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="任务名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="执行状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            class="filter-field filter-field--md"
          >
            <el-option label="待执行" :value="0" />
            <el-option label="执行中" :value="1" />
            <el-option label="已暂停" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="执行失败" :value="5" />
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
          <el-button type="primary" icon="plus" @click="handleCreateClick">新增任务</el-button>
          <el-button
            type="danger"
            :disabled="ids.length === 0"
            icon="delete"
            @click="handleDelete()"
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
        <el-table-column label="任务名称" prop="name" min-width="150" show-overflow-tooltip />
        <el-table-column label="任务航线" prop="routeName" min-width="150" show-overflow-tooltip />
        <el-table-column label="所属部门" prop="department" min-width="120" show-overflow-tooltip />
        <el-table-column
          label="执行机场"
          prop="airportName"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column
          label="执行无人机"
          prop="droneName"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column label="执行飞手" prop="pilotName" min-width="100" show-overflow-tooltip />
        <el-table-column label="应用算法" prop="algorithm" min-width="150" show-overflow-tooltip />
        <el-table-column label="任务策略" prop="strategy" min-width="100" />
        <el-table-column label="执行状态" prop="status" align="center" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="info">待执行</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="primary">执行中</el-tag>
            <el-tag v-else-if="scope.row.status === 2" type="warning">已暂停</el-tag>
            <el-tag v-else-if="scope.row.status === 3" type="success">已完成</el-tag>
            <el-tag v-else-if="scope.row.status === 4" type="info">已取消</el-tag>
            <el-tag v-else-if="scope.row.status === 5" type="danger">执行失败</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="creatorName" min-width="100" />
        <el-table-column label="创建时间" prop="createdAt" min-width="160" />
        <el-table-column fixed="right" label="操作" align="center" width="260">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleFlightRecords(scope.row)"
            >
              飞行记录
            </el-button>
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
            <el-button
              type="danger"
              link
              size="small"
              icon="delete"
              @click.stop="handleDelete(scope.row.id)"
            >
              删除
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
            <el-option label="前山河汛前岸线勘察" :value="1" />
            <el-option label="珠海岸线巡查航线" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-input v-model="formData.department" placeholder="请输入所属部门" />
        </el-form-item>
        <el-form-item label="执行机场" prop="airportName">
          <el-input v-model="formData.airportName" placeholder="请选择或输入执行机场" />
        </el-form-item>
        <el-form-item label="执行机型">
          <el-select v-model="formData.droneId" placeholder="请选择无人机" class="w-full">
            <el-option label="应急测绘-01 (CW-15)" :value="1" />
            <el-option label="河道巡检-03 (M3E)" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行飞手" prop="pilotId">
          <el-select v-model="formData.pilotId" placeholder="请选择飞手" class="w-full">
            <el-option label="孙工" :value="1" />
            <el-option label="李主任" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用算法" prop="algorithm">
          <el-input v-model="formData.algorithm" placeholder="例如：水面漂浮物检测" />
        </el-form-item>
        <el-form-item label="任务策略" prop="strategy">
          <el-select v-model="formData.strategy" placeholder="请选择策略" class="w-full">
            <el-option label="手动执行" value="手动执行" />
            <el-option label="周期定时" value="周期定时" />
            <el-option label="定时执行" value="定时执行" />
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useWindowSize } from "@vueuse/core";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import type { TaskPageQuery, TaskVO, TaskForm } from "@/api/flight/task";

defineOptions({
  name: "FlightTask",
  inheritAttrs: false,
});

const router = useRouter();
const { width } = useWindowSize();

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<TaskPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

// 列表数据
const tableData = ref<TaskVO[]>([]);
const filteredTaskList = ref<TaskVO[]>([]);
const total = ref(0);
const loading = ref(false);
const submitLoading = ref(false);
const ids = ref<string[]>([]);

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "600px"));
const hasActiveFilters = computed(() =>
  Boolean(queryParams.name || queryParams.status !== undefined)
);
const activeTaskCount = computed(
  () => filteredTaskList.value.filter((item) => item.status === 1).length
);
const completedTaskCount = computed(
  () => filteredTaskList.value.filter((item) => item.status === 3).length
);
const attentionTaskCount = computed(
  () => filteredTaskList.value.filter((item) => item.status === 2 || item.status === 5).length
);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<TaskForm>({
  name: "",
  routeId: undefined,
  droneId: undefined,
  pilotId: undefined,
  scheduledAt: "",
  remark: "",
  algorithm: "",
  strategy: "",
  department: "",
  airportName: "",
});

// 验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  routeId: [{ required: true, message: "请选择任务航线", trigger: "change" }],
};

/**
 * 加载任务列表数据 (Mock由于没有真实后端)
 */
function fetchData(): void {
  loading.value = true;

  // TODO: 后续接入真实接口
  // TaskAPI.getPage(queryParams).then(...);

  // 这里使用前端Mock以实现原型页面效果
  setTimeout(() => {
    let mockData: TaskVO[] = [
      {
        id: 1,
        name: "前山河汛前岸线勘察",
        routeId: 1,
        routeName: "珠海岸线巡查航线",
        department: "市应急局",
        airportName: "市应急基地主舱",
        droneId: 1,
        droneName: "应急测绘-01 (CW-15)",
        pilotId: 1,
        pilotName: "孙工",
        algorithm: "岸线变化分析、三维建模",
        strategy: "周期定时",
        status: 3,
        creatorName: "孙工",
        createdAt: "2025-11-14 08:43:35",
      },
      {
        id: 2,
        name: "秦淮河河道日常巡检",
        routeId: 2,
        routeName: "秦淮河东段航线",
        department: "市水务局",
        airportName: "城西河道机巢-A1",
        droneId: 2,
        droneName: "河道巡检-03 (M3E)",
        pilotId: 2,
        pilotName: "李主任",
        algorithm: "水面漂浮物检测、排污口识别",
        strategy: "定时执行",
        status: 0,
        creatorName: "李主任",
        createdAt: "2025-11-14 09:30:55",
      },
      {
        id: 3,
        name: "紫金山林火预警巡飞",
        routeId: 3,
        routeName: "紫金山核心区航线",
        department: "市林业局",
        airportName: "紫金山顶停机坪",
        droneId: 3,
        droneName: "林火监测-02 (M3T)",
        pilotId: 1,
        pilotName: "王伟",
        algorithm: "热成像火点识别",
        strategy: "手动执行",
        status: 1,
        creatorName: "王工",
        createdAt: "2025-11-14 10:15:20",
      },
    ];

    // 本地过滤
    if (queryParams.name) {
      mockData = mockData.filter((m) => m.name.includes(queryParams.name!));
    }
    if (queryParams.status !== undefined && queryParams.status !== null) {
      mockData = mockData.filter((m) => m.status === queryParams.status);
    }

    filteredTaskList.value = mockData;
    total.value = mockData.length;

    const pageNum = queryParams.pageNum ?? 1;
    const pageSize = queryParams.pageSize ?? 10;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    tableData.value = mockData.slice(startIndex, endIndex);
    loading.value = false;
  }, 500);
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
  queryFormRef.value?.resetFields();
  queryParams.status = undefined; // 强制重置
  queryParams.pageNum = 1;
  fetchData();
}

/**
 * 表格选择变化事件
 */
function handleSelectionChange(selection: TaskVO[]): void {
  ids.value = selection.map((item) => String(item.id));
}

/**
 * 新增按钮点击事件
 */
function handleCreateClick(): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "新增任务";
}

/**
 * 编辑按钮点击事件
 */
function handleEditClick(row: TaskVO): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "修改任务";

  // 表单回显
  formData.id = row.id;
  formData.name = row.name;
  formData.routeId = row.routeId;
  formData.droneId = row.droneId;
  formData.pilotId = row.pilotId;
  formData.department = row.department;
  formData.airportName = row.airportName;
  formData.algorithm = row.algorithm;
  formData.strategy = row.strategy;
}

/**
 * 详情按钮点击事件
 */
function handleDetailClick(row: TaskVO): void {
  ElMessageBox.alert(
    `任务航线：${row.routeName}<br/>执行机场：${row.airportName}<br/>执行无人机：${row.droneName}<br/>执行飞手：${row.pilotName}<br/>任务策略：${row.strategy}<br/>应用算法：${row.algorithm}`,
    `任务详情：${row.name}`,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "确定",
    }
  );
}

/**
 * 飞行记录按钮点击事件
 */
function handleFlightRecords(row: TaskVO): void {
  router.push({
    path: "/flight/record",
    query: {
      taskName: row.name,
    },
  });
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
  formData.algorithm = "";
  formData.strategy = "";
  formData.department = "";
  formData.airportName = "";
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  dataFormRef.value?.validate((isValid) => {
    if (isValid) {
      submitLoading.value = true;
      // 模拟提交
      setTimeout(() => {
        if (formData.id) {
          ElMessage.success("修改成功");
        } else {
          ElMessage.success("新增成功");
        }
        closeDialog();
        handleQuery();
        submitLoading.value = false;
      }, 500);
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
 * 删除任务
 * @param id 任务ID
 */
function handleDelete(id?: number): void {
  const taskIds = id ? [String(id)] : [...ids.value];
  if (taskIds.length === 0) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  const message =
    taskIds.length === 1 ? "确认删除当前任务吗？" : `确认删除已选中的 ${taskIds.length} 个任务吗？`;

  ElMessageBox.confirm(message, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      // 模拟调接口
      loading.value = true;
      setTimeout(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
        loading.value = false;
      }, 500);
    },
    () => {
      ElMessage.info("已取消删除");
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
