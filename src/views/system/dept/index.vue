<template>
  <div class="app-container system-dept-page">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="部门名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="部门状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="禁用" />
          </el-select>
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
          <Button v-hasPerm="['sys:dept:create']" @click="openDialog()">新增</Button>
          <Button
            v-hasPerm="['sys:dept:delete']"
            variant="destructive"
            :disabled="selectIds.length === 0"
            @click="handleDelete()"
          >
            删除
          </Button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="deptList"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        class="table-section__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门编号" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <Badge :variant="scope.row.status == 1 ? 'secondary' : 'outline'">
              {{ scope.row.status == 1 ? "正常" : "禁用" }}
            </Badge>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" width="100" />

        <el-table-column label="操作" fixed="right" align="left" width="200">
          <template #default="scope">
            <Button
              v-hasPerm="['sys:dept:create']"
              class="system-dept-page__action"
              size="sm"
              @click.stop="openDialog(scope.row.id, undefined)"
            >
              新增
            </Button>
            <Button
              v-hasPerm="['sys:dept:update']"
              class="system-dept-page__action"
              size="sm"
              @click.stop="openDialog(scope.row.parentId, scope.row.id)"
            >
              编辑
            </Button>
            <Button
              v-hasPerm="['sys:dept:delete']"
              class="system-dept-page__action system-dept-page__action--danger"
              size="sm"
              @click.stop="handleDelete(scope.row.id)"
            >
              删除
            </Button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="600px"
      @closed="closeDialog"
    >
      <el-form ref="deptFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            placeholder="选择上级部门"
            :data="deptOptions"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编号" prop="code">
          <el-input v-model="formData.code" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="显示排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            controls-position="right"
            style="width: 100px"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="部门状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
defineOptions({
  name: "Dept",
  inheritAttrs: false,
});

import DeptAPI from "@/api/system/dept";
import type { DeptItem, DeptForm, DeptQueryParams } from "@/types/api";
import type { FormInstance, FormRules } from "element-plus";

// 表单引用
const queryFormRef = ref<FormInstance>();
const deptFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<DeptQueryParams>({});

// 列表数据
const deptList = ref<DeptItem[]>();
const deptOptions = ref<OptionItem[]>();
const loading = ref(false);
const selectIds = ref<string[]>([]);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<DeptForm>({
  status: 1,
  parentId: "0",
  sort: 1,
});

// 验证规则
const rules: FormRules = {
  parentId: [{ required: true, message: "上级部门不能为空", trigger: "change" }],
  name: [{ required: true, message: "部门名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "部门编号不能为空", trigger: "blur" }],
  sort: [{ required: true, message: "显示排序不能为空", trigger: "blur" }],
};

/**
 * 加载部门列表数据
 */
function fetchData(): void {
  loading.value = true;
  DeptAPI.getList(queryParams)
    .then((data) => {
      deptList.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 查询按钮点击事件
 */
function handleQuery(): void {
  fetchData();
}

/**
 * 重置查询
 */
function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  fetchData();
}

/**
 * 表格选择变化事件
 */
function handleSelectionChange(selection: DeptItem[]): void {
  selectIds.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

/**
 * 打开弹窗
 * @param parentId 父部门ID
 * @param deptId 部门ID（编辑时传入）
 */
async function openDialog(parentId?: string, deptId?: string): Promise<void> {
  const data = await DeptAPI.getOptions();
  deptOptions.value = [
    {
      value: "0",
      label: "顶级部门",
      children: data,
    },
  ];

  dialogState.visible = true;
  if (deptId) {
    dialogState.title = "修改部门";
    DeptAPI.getFormData(deptId).then((data) => {
      Object.assign(formData, data);
    });
  } else {
    dialogState.title = "新增部门";
    formData.parentId = parentId || "0";
  }
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  deptFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      const deptId = formData.id;
      if (deptId) {
        DeptAPI.update(deptId, formData)
          .then(() => {
            ElMessage.success("修改成功");
            closeDialog();
            fetchData();
          })
          .finally(() => (loading.value = false));
      } else {
        DeptAPI.create(formData)
          .then(() => {
            ElMessage.success("新增成功");
            closeDialog();
            fetchData();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}

/**
 * 删除部门
 * @param deptId 部门ID
 */
function handleDelete(deptId?: number): void {
  const deptIds = [deptId || selectIds.value].join(",");

  if (!deptIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      DeptAPI.deleteByIds(deptIds)
        .then(() => {
          ElMessage.success("删除成功");
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  deptFormRef.value?.resetFields();
  deptFormRef.value?.clearValidate();
  formData.id = undefined;
  formData.parentId = "0";
  formData.status = 1;
  formData.sort = 1;
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.system-dept-page :deep(.filter-section) {
  border-radius: 20px;
}

.system-dept-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.system-dept-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.system-dept-page :deep(.filter-section .el-input__wrapper),
.system-dept-page :deep(.filter-section .el-select__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-dept-page :deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.system-dept-page :deep(.table-section__toolbar) {
  align-items: flex-start;
}

.system-dept-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.system-dept-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.system-dept-page :deep(.el-dialog) {
  border-radius: 24px;
}

.system-dept-page__action {
  padding-right: 0;
  padding-left: 0;
}

.system-dept-page__action--danger {
  color: var(--destructive);
}
</style>
