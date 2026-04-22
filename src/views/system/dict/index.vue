<template>
  <div class="app-container system-dict-page">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="字典名称/编码"
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
          <Button @click="handleCreateClick()">新增</Button>
          <Button variant="destructive" :disabled="ids.length === 0" @click="handleDelete()">
            删除
          </Button>
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
        <el-table-column label="字典名称" prop="name" />
        <el-table-column label="字典编码" prop="dictCode" />
        <el-table-column label="状态" prop="status">
          <template #default="scope">
            <Badge :variant="scope.row.status === 1 ? 'secondary' : 'outline'">
              {{ scope.row.status === 1 ? "启用" : "禁用" }}
            </Badge>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" align="center" width="220">
          <template #default="scope">
            <Button
              class="system-dict-page__action"
              variant="ghost"
              size="sm"
              @click.stop="openDictData(scope.row)"
            >
              字典数据
            </Button>

            <Button
              class="system-dict-page__action"
              variant="ghost"
              size="sm"
              @click.stop="handleEditClick(scope.row.id)"
            >
              编辑
            </Button>
            <Button
              class="system-dict-page__action system-dict-page__action--danger"
              variant="ghost"
              size="sm"
              @click.stop="handleDelete(scope.row.id)"
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
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入字典名称" />
        </el-form-item>

        <el-form-item label="字典编码" prop="dictCode">
          <el-input v-model="formData.dictCode" placeholder="请输入字典编码" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <Button @click="handleSubmit">确 定</Button>
          <Button variant="outline" @click="closeDialog">取 消</Button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
defineOptions({
  name: "Dict",
  inheritAttrs: false,
});

import DictAPI from "@/api/system/dict";
import type { DictTypeQueryParams, DictTypeItem, DictTypeForm } from "@/types/api";
import type { FormInstance, FormRules } from "element-plus";
import router from "@/router";

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<DictTypeQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

// 列表数据
const tableData = ref<DictTypeItem[]>();
const total = ref(0);
const loading = ref(false);
const ids = ref<string[]>([]);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<DictTypeForm>({
  status: 1,
});

// 验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入字典名称", trigger: "blur" }],
  dictCode: [{ required: true, message: "请输入字典编码", trigger: "blur" }],
};

/**
 * 加载字典列表数据
 */
function fetchData(): void {
  loading.value = true;
  DictAPI.getPage(queryParams)
    .then((data) => {
      tableData.value = data.list;
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
function handleSelectionChange(selection: DictTypeItem[]): void {
  ids.value = selection.map((item) => item.id);
}

/**
 * 新增按钮点击事件
 */
function handleCreateClick(): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "新增字典";
}

/**
 * 编辑按钮点击事件
 * @param id 字典ID
 */
function handleEditClick(id: string): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "修改字典";
  DictAPI.getFormData(id).then((data) => {
    Object.assign(formData, data);
  });
}

function resetForm(): void {
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
  formData.name = undefined;
  formData.dictCode = undefined;
  formData.status = 1;
  formData.remark = undefined;
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  dataFormRef.value?.validate((isValid) => {
    if (isValid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        DictAPI.update(id, formData)
          .then(() => {
            ElMessage.success("修改成功");
            closeDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        DictAPI.create(formData)
          .then(() => {
            ElMessage.success("新增成功");
            closeDialog();
            handleQuery();
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
  resetForm();
}

/**
 * 删除字典
 * @param id 字典ID
 */
function handleDelete(id?: number): void {
  const attrGroupIds = [id || ids.value].join(",");
  if (!attrGroupIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }
  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      DictAPI.deleteByIds(attrGroupIds).then(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
      });
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

/**
 * 打开字典数据页面
 * @param row 字典数据
 */
function openDictData(row: DictTypeItem): void {
  try {
    const route = router.resolve({
      name: "DictItem",
      query: { dictCode: row.dictCode, title: `【${row.name}】字典数据` },
    });
    if (route.matched.length === 0) {
      ElMessage.error("路由未注册，请刷新页面后重试");
      return;
    }
    router.push(route);
  } catch (error) {
    console.error("路由跳转失败:", error);
    ElMessage.error("页面跳转失败，请刷新页面后重试");
  }
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.system-dict-page :deep(.filter-section) {
  border-radius: 20px;
}

.system-dict-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.system-dict-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.system-dict-page :deep(.filter-section .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-dict-page :deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.system-dict-page :deep(.table-section__toolbar) {
  align-items: flex-start;
}

.system-dict-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.system-dict-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.system-dict-page :deep(.el-dialog) {
  border-radius: 24px;
}

.system-dict-page__action {
  padding-right: 0;
  padding-left: 0;
}

.system-dict-page__action--danger {
  color: var(--destructive);
}
</style>
