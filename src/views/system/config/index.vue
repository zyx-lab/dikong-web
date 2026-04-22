<template>
  <div class="app-container system-config-page">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="请输入配置键\配置名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item class="search-buttons">
          <Button size="sm" @click="handleQuery">搜索</Button>
          <Button size="sm" variant="outline" @click="handleResetQuery">重置</Button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <Button v-hasPerm="['sys:config:create']" @click="openDialog()">新增</Button>
          <Button v-hasPerm="['sys:config:refresh']" variant="outline" @click="refreshCache">
            刷新缓存
          </Button>
        </div>
      </div>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        class="table-section__content"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column key="configName" label="配置名称" prop="configName" min-width="100" />
        <el-table-column key="configKey" label="配置项" prop="configKey" min-width="100" />
        <el-table-column key="configValue" label="配置项" prop="configValue" min-width="100" />
        <el-table-column key="remark" label="描述" prop="remark" min-width="100" />
        <el-table-column fixed="right" label="操作" width="220">
          <template #default="scope">
            <Button
              v-hasPerm="['sys:config:update']"
              class="system-config-page__action"
              variant="ghost"
              size="sm"
              @click="openDialog(scope.row.id)"
            >
              编辑
            </Button>
            <Button
              v-hasPerm="['sys:config:delete']"
              class="system-config-page__action system-config-page__action--danger"
              variant="ghost"
              size="sm"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </Button>
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
      width="500px"
      @close="closeDialog"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-suffix=":"
        label-width="100px"
        class="system-config-page__dialog-form"
      >
        <section class="system-config-page__form-section">
          <div class="system-config-page__form-title">基础配置</div>
          <div class="system-config-page__form-grid">
            <el-form-item label="配置名称" prop="configName">
              <el-input
                v-model="formData.configName"
                placeholder="请输入配置名称"
                :maxlength="50"
              />
            </el-form-item>
            <el-form-item label="配置项" prop="configKey">
              <el-input v-model="formData.configKey" placeholder="请输入配置键" :maxlength="50" />
            </el-form-item>
            <el-form-item
              class="system-config-page__form-item--full"
              label="配置值"
              prop="configValue"
            >
              <el-input
                v-model="formData.configValue"
                placeholder="请输入配置项"
                :maxlength="100"
              />
            </el-form-item>
          </div>
        </section>

        <section class="system-config-page__form-section">
          <div class="system-config-page__form-title">补充说明</div>
          <div class="system-config-page__form-grid">
            <el-form-item class="system-config-page__form-item--full" label="描述" prop="remark">
              <el-input
                v-model="formData.remark"
                :rows="4"
                :maxlength="100"
                show-word-limit
                type="textarea"
                placeholder="请输入描述"
              />
            </el-form-item>
          </div>
        </section>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <Button @click="handleSubmit">确定</Button>
          <Button variant="outline" @click="closeDialog">取消</Button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Config",
  inheritAttrs: false,
});

import ConfigAPI from "@/api/system/config";
import { Button } from "@/components/ui/button";
import type { ConfigItem, ConfigForm, ConfigQueryParams } from "@/types/api";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<ConfigQueryParams>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
});

// 列表数据
const pageData = ref<ConfigItem[]>([]);
const total = ref(0);
const loading = ref(false);
const selectIds = ref<string[]>([]);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<ConfigForm>({
  id: undefined,
  configName: "",
  configKey: "",
  configValue: "",
  remark: "",
});

// 验证规则
const rules: FormRules = {
  configName: [{ required: true, message: "请输入系统配置名称", trigger: "blur" }],
  configKey: [{ required: true, message: "请输入系统配置编码", trigger: "blur" }],
  configValue: [{ required: true, message: "请输入系统配置值", trigger: "blur" }],
};

/**
 * 加载配置列表数据
 */
function fetchData(): void {
  loading.value = true;
  ConfigAPI.getPage(queryParams)
    .then((data) => {
      pageData.value = data.list;
      total.value = data.total ?? 0;
    })
    .finally(() => {
      loading.value = false;
    });
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
  queryParams.pageNum = 1;
  fetchData();
}

/**
 * 表格选择变化事件
 */
function handleSelectionChange(selection: ConfigItem[]): void {
  selectIds.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

/**
 * 打开弹窗
 * @param id 配置ID（编辑时传入）
 */
function openDialog(id?: string): void {
  dialogState.visible = true;
  if (id) {
    dialogState.title = "修改系统配置";
    ConfigAPI.getFormData(id).then((data) => {
      Object.assign(formData, data);
    });
  } else {
    dialogState.title = "新增系统配置";
    formData.id = undefined;
  }
}

/**
 * 刷新缓存
 */
const refreshCache = useDebounceFn(() => {
  ConfigAPI.refreshCache().then(() => {
    ElMessage.success("刷新成功");
  });
}, 1000);

/**
 * 提交表单
 */
function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        ConfigAPI.update(id, formData)
          .then(() => {
            ElMessage.success("修改成功");
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        ConfigAPI.create(formData)
          .then(() => {
            ElMessage.success("新增成功");
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
}

/**
 * 删除配置
 * @param id 配置ID
 */
function handleDelete(id: string): void {
  ElMessageBox.confirm("确认删除该项配置?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    loading.value = true;
    ConfigAPI.deleteById(id)
      .then(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
      })
      .finally(() => (loading.value = false));
  });
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.system-config-page :deep(.filter-section) {
  border-radius: 20px;
}

.system-config-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.system-config-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.system-config-page :deep(.filter-section .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-config-page :deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.system-config-page :deep(.table-section__toolbar) {
  align-items: flex-start;
}

.system-config-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.system-config-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.system-config-page :deep(.el-dialog) {
  border-radius: 24px;
}

.system-config-page :deep(.el-dialog .el-form-item__label) {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 0.04em;
}

.system-config-page :deep(.el-dialog .el-input__wrapper),
.system-config-page :deep(.el-dialog .el-textarea__inner) {
  border-radius: 12px;
  box-shadow: none;
}

.system-config-page__dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.system-config-page__form-section {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.system-config-page__form-title {
  margin-bottom: 14px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.04em;
}

.system-config-page__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.system-config-page__form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.system-config-page__form-item--full {
  grid-column: 1 / -1;
}

.system-config-page__action {
  padding-right: 0;
  padding-left: 0;
}

.system-config-page__action--danger {
  color: var(--destructive);
}

@media (max-width: 768px) {
  .system-config-page__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
