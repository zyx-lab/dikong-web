<template>
  <div class="app-container system-tenant-plan-page">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="套餐名称/套餐编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
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
          <Button v-hasPerm="['sys:tenant-plan:create']" @click="openDialog()">新增</Button>
        </div>
      </div>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        border
        class="table-section__content"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="套餐名称" prop="name" min-width="120" />
        <el-table-column label="套餐编码" prop="code" width="160" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <Badge :variant="scope.row.status === 1 ? 'secondary' : 'outline'">
              {{ scope.row.status === 1 ? "启用" : "停用" }}
            </Badge>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort" width="80" align="center" />
        <el-table-column label="备注" prop="remark" min-width="140" />
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column fixed="right" label="操作" width="240">
          <template #default="scope">
            <Button
              v-hasPerm="['sys:tenant-plan:assign']"
              class="system-tenant-plan-page__action"
              size="sm"
              @click="openPlanMenuDialog(scope.row)"
            >
              菜单配置
            </Button>
            <Button
              v-hasPerm="['sys:tenant-plan:update']"
              class="system-tenant-plan-page__action"
              size="sm"
              @click="openDialog(scope.row.id)"
            >
              编辑
            </Button>
            <Button
              v-hasPerm="['sys:tenant-plan:delete']"
              class="system-tenant-plan-page__action system-tenant-plan-page__action--danger"
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
      width="520px"
      @close="closeDialog"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="system-tenant-plan-page__dialog-form"
      >
        <section class="system-tenant-plan-page__form-section">
          <div class="system-tenant-plan-page__form-title">套餐基础资料</div>
          <div class="system-tenant-plan-page__form-grid">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入套餐名称" />
            </el-form-item>
            <el-form-item label="套餐编码" prop="code">
              <el-input v-model="formData.code" placeholder="请输入套餐编码" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="formData.sort"
                controls-position="right"
                :min="0"
                style="width: 120px"
              />
            </el-form-item>
            <el-form-item
              class="system-tenant-plan-page__form-item--full"
              label="备注"
              prop="remark"
            >
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="可选" />
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

    <el-drawer
      v-model="planMenuDialogVisible"
      :title="'【' + checkedPlan.name + '】菜单配置'"
      size="600px"
      @close="closePlanMenuDialog"
    >
      <div class="flex-x-between">
        <el-input v-model="menuKeywords" clearable class="w-[150px]" placeholder="菜单名称">
          <template #prefix>
            <Search />
          </template>
        </el-input>

        <div class="flex-center ml-5">
          <el-button type="primary" size="small" plain @click="toggleMenuTree">
            <template #icon>
              <Switch />
            </template>
            {{ menuExpanded ? "收缩" : "展开" }}
          </el-button>
          <el-checkbox v-model="menuParentChildLinked" class="ml-5" @change="handleMenuLinkChange">
            父子联动
          </el-checkbox>

          <el-tooltip placement="bottom">
            <template #content>
              如果只需勾选菜单权限，不需要勾选子菜单或者按钮权限，请关闭父子联动
            </template>
            <el-icon class="ml-1 color-[--el-color-primary] inline-block cursor-pointer">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </div>
      </div>

      <el-tree
        ref="menuTreeRef"
        node-key="value"
        show-checkbox
        :data="menuPermOptions"
        :filter-node-method="handleMenuFilter"
        :default-expand-all="true"
        :check-strictly="!menuParentChildLinked"
        class="mt-5"
      >
        <template #default="{ data }">
          {{ data.label }}
        </template>
      </el-tree>

      <template #footer>
        <div class="dialog-footer">
          <Button v-hasPerm="['sys:tenant-plan:assign']" @click="handlePlanMenuSubmit">确定</Button>
          <Button variant="outline" @click="planMenuDialogVisible = false">取消</Button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "TenantPlan",
  inheritAttrs: false,
});

import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MenuAPI from "@/api/system/menu";
import TenantPlanAPI from "@/api/system/tenant-plan";
import type {
  TenantPlanForm,
  TenantPlanItem,
  TenantPlanQueryParams,
  OptionItem,
} from "@/types/api";
import { MenuScopeEnum } from "@/enums/business";

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();
const dataTableRef = ref();
const menuTreeRef = ref();

// 查询参数
const queryParams = reactive<TenantPlanQueryParams>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
});

// 列表数据
const pageData = ref<TenantPlanItem[]>([]);
const menuPermOptions = ref<OptionItem[]>([]);
const total = ref(0);
const loading = ref(false);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<TenantPlanForm>({
  id: undefined,
  name: "",
  code: "",
  status: 1,
  sort: 1,
  remark: "",
});

// 验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入套餐名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入套餐编码", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

// 菜单配置弹窗状态
const planMenuDialogVisible = ref(false);
const checkedPlan = ref<{ id?: number; name?: string }>({});
const menuKeywords = ref("");
const menuExpanded = ref(true);
const menuParentChildLinked = ref(true);

/**
 * 加载租户套餐分页数据
 */
function fetchData(): void {
  loading.value = true;
  TenantPlanAPI.getPage(queryParams)
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
 * 打开弹窗
 * @param planId 套餐ID（编辑时传入）
 */
async function openDialog(planId?: number): Promise<void> {
  dialogState.visible = true;
  if (planId) {
    dialogState.title = "修改套餐";
    const data = await TenantPlanAPI.getFormData(String(planId));
    Object.assign(formData, data);
    if (formData.status == null) {
      formData.status = 1;
    }
    if (formData.sort == null) {
      formData.sort = 1;
    }
  } else {
    dialogState.title = "新增套餐";
    Object.assign(formData, {
      id: undefined,
      name: "",
      code: "",
      status: 1,
      sort: 1,
      remark: "",
    });
  }
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  Object.assign(formData, {
    id: undefined,
    name: "",
    code: "",
    status: 1,
    sort: 1,
    remark: "",
  });
}

/**
 * 提交表单
 */
const handleSubmit = useDebounceFn(async (): Promise<void> => {
  const valid = await dataFormRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    if (formData.id) {
      await TenantPlanAPI.update(String(formData.id), formData);
      ElMessage.success("修改成功");
    } else {
      await TenantPlanAPI.create(formData);
      ElMessage.success("新增成功");
    }
    closeDialog();
    handleResetQuery();
  } finally {
    loading.value = false;
  }
}, 300);

/**
 * 删除套餐
 * @param planId 套餐ID
 */
function handleDelete(planId?: number): void {
  if (!planId) return;
  ElMessageBox.confirm("确认删除该租户套餐吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    loading.value = true;
    TenantPlanAPI.deleteByIds(String(planId))
      .then(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

/**
 * 打开菜单配置弹窗
 */
async function openPlanMenuDialog(row: TenantPlanItem): Promise<void> {
  if (!row.id) return;
  planMenuDialogVisible.value = true;
  loading.value = true;
  checkedPlan.value = { id: row.id, name: row.name };

  try {
    const menuOptions = await MenuAPI.getOptions(false, MenuScopeEnum.TENANT);
    menuPermOptions.value = menuOptions;
    const menuIds = await TenantPlanAPI.getPlanMenuIds(row.id);
    await nextTick();
    menuTreeRef.value?.setCheckedKeys([], false);
    menuIds.forEach((menuId) => menuTreeRef.value?.setChecked(menuId, true, false));
  } finally {
    loading.value = false;
  }
}

/**
 * 关闭菜单配置弹窗
 */
function closePlanMenuDialog(): void {
  planMenuDialogVisible.value = false;
  menuKeywords.value = "";
  menuExpanded.value = true;
  menuParentChildLinked.value = true;
  menuTreeRef.value?.setCheckedKeys([], false);
}

/**
 * 展开/收缩菜单树
 */
function toggleMenuTree(): void {
  menuExpanded.value = !menuExpanded.value;
  if (menuTreeRef.value) {
    Object.values(menuTreeRef.value.store.nodesMap).forEach((node: any) => {
      if (menuExpanded.value) {
        node.expand();
      } else {
        node.collapse();
      }
    });
  }
}

/**
 * 切换父子联动
 */
function handleMenuLinkChange(val: string | number | boolean): void {
  menuParentChildLinked.value = Boolean(val);
}

/**
 * 菜单树过滤逻辑
 */
function handleMenuFilter(value: string, data: { [key: string]: any }): boolean {
  if (!value) return true;
  return data.label.includes(value);
}

/**
 * 提交菜单配置
 */
async function handlePlanMenuSubmit(): Promise<void> {
  const planId = checkedPlan.value.id;
  if (!planId) return;

  const checkedMenuIds: number[] = menuTreeRef
    .value!.getCheckedNodes(false, true)
    .map((node: any) => node.value);

  loading.value = true;
  try {
    await TenantPlanAPI.updatePlanMenus(planId, checkedMenuIds);
    ElMessage.success("菜单配置成功");
    planMenuDialogVisible.value = false;
  } finally {
    loading.value = false;
  }
}

// 菜单树关键字过滤
watch(menuKeywords, (val) => {
  menuTreeRef.value?.filter(val);
});

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.system-tenant-plan-page :deep(.filter-section) {
  border-radius: 20px;
}

.system-tenant-plan-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.system-tenant-plan-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.system-tenant-plan-page :deep(.filter-section .el-input__wrapper),
.system-tenant-plan-page :deep(.filter-section .el-select__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-tenant-plan-page :deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.system-tenant-plan-page :deep(.table-section__toolbar) {
  align-items: flex-start;
}

.system-tenant-plan-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.system-tenant-plan-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.system-tenant-plan-page :deep(.el-dialog),
.system-tenant-plan-page :deep(.el-drawer) {
  border-radius: 24px;
}

.system-tenant-plan-page :deep(.el-dialog .el-form-item__label),
.system-tenant-plan-page :deep(.el-drawer .el-form-item__label) {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 0.04em;
}

.system-tenant-plan-page :deep(.el-dialog .el-input__wrapper),
.system-tenant-plan-page :deep(.el-dialog .el-select__wrapper),
.system-tenant-plan-page :deep(.el-drawer .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-tenant-plan-page :deep(.el-dialog .el-form-item__label),
.system-tenant-plan-page :deep(.el-drawer .el-form-item__label) {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 0.04em;
}

.system-tenant-plan-page :deep(.el-drawer .el-tree) {
  padding: 12px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.system-tenant-plan-page__dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.system-tenant-plan-page__form-section {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.system-tenant-plan-page__form-title {
  margin-bottom: 14px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.04em;
}

.system-tenant-plan-page__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.system-tenant-plan-page__form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.system-tenant-plan-page__form-item--full {
  grid-column: 1 / -1;
}

.system-tenant-plan-page__action {
  padding-right: 0;
  padding-left: 0;
}

.system-tenant-plan-page__action--danger {
  color: var(--destructive);
}

@media (max-width: 768px) {
  .system-tenant-plan-page__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
