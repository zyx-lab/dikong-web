<template>
  <div class="app-container system-notice-page">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-suffix=":">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="标题"
            clearable
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

        <el-form-item label="发布状态" prop="publishStatus">
          <el-select
            v-model="queryParams.publishStatus"
            clearable
            placeholder="全部"
            style="width: 100px"
          >
            <el-option :value="0" label="未发布" />
            <el-option :value="1" label="已发布" />
            <el-option :value="-1" label="已撤回" />
          </el-select>
        </el-form-item>

        <el-form-item class="search-buttons">
          <Button size="sm" @click="handleQuery()">搜索</Button>
          <Button size="sm" variant="outline" @click="handleResetQuery()">重置</Button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <Button v-hasPerm="['sys:notice:create']" @click="openDialog()">新增通知</Button>
          <Button
            v-hasPerm="['sys:notice:delete']"
            variant="destructive"
            :disabled="selectIds.length === 0"
            @click="handleDelete()"
          >
            删除
          </Button>
        </div>
      </div>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        class="table-section__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="通知标题" prop="title" min-width="200" />
        <el-table-column align="center" label="通知类型" width="150">
          <template #default="scope">
            <DictTag v-model="scope.row.type" :code="'notice_type'" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="发布人" prop="publisherName" width="150" />
        <el-table-column align="center" label="通知等级" width="100">
          <template #default="scope">
            <DictTag v-model="scope.row.level" code="notice_level" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="通告目标类型" prop="targetType" min-width="100">
          <template #default="scope">
            <Badge :variant="scope.row.targetType == 1 ? 'outline' : 'secondary'">
              {{ scope.row.targetType == 1 ? "全体" : "指定" }}
            </Badge>
          </template>
        </el-table-column>
        <el-table-column align="center" label="发布状态" min-width="100">
          <template #default="scope">
            <Badge :variant="getPublishBadgeVariant(scope.row.publishStatus)">
              {{ getPublishText(scope.row.publishStatus) }}
            </Badge>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="250">
          <template #default="scope">
            <div class="flex-x-start">
              <span>创建时间：</span>
              <span>{{ scope.row.createTime || "-" }}</span>
            </div>

            <div v-if="scope.row.publishStatus === 1" class="flex-x-start">
              <span>发布时间：</span>
              <span>{{ scope.row.publishTime || "-" }}</span>
            </div>
            <div v-else-if="scope.row.publishStatus === -1" class="flex-x-start">
              <span>撤回时间：</span>
              <span>{{ scope.row.revokeTime || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="150">
          <template #default="scope">
            <Button
              class="system-notice-page__action"
              variant="ghost"
              size="sm"
              @click="openDetailDialog(scope.row.id)"
            >
              查看
            </Button>
            <Button
              v-if="scope.row.publishStatus != 1"
              v-hasPerm="['sys:notice:publish']"
              class="system-notice-page__action"
              variant="ghost"
              size="sm"
              @click="handlePublish(scope.row.id)"
            >
              发布
            </Button>
            <Button
              v-if="scope.row.publishStatus == 1"
              v-hasPerm="['sys:notice:revoke']"
              class="system-notice-page__action"
              variant="ghost"
              size="sm"
              @click="handleRevoke(scope.row.id)"
            >
              撤回
            </Button>
            <Button
              v-if="scope.row.publishStatus != 1"
              v-hasPerm="['sys:notice:update']"
              class="system-notice-page__action"
              variant="ghost"
              size="sm"
              @click="openDialog(scope.row.id)"
            >
              编辑
            </Button>
            <Button
              v-if="scope.row.publishStatus != 1"
              v-hasPerm="['sys:notice:delete']"
              class="system-notice-page__action system-notice-page__action--danger"
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
        @pagination="fetchData()"
      />
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :show-close="false"
      :fullscreen="dialogState.fullscreen"
      top="6vh"
      width="70%"
      custom-class="notice-dialog"
      @close="closeDialog"
    >
      <template #header>
        <div class="flex-x-between">
          <span>{{ dialogState.title }}</span>
          <div class="dialog-toolbar">
            <Button variant="outline" size="icon-sm" @click="toggleDialogFullscreen">
              <template #icon>
                <FullScreen v-if="!dialogState.fullscreen" />
                <CopyDocument v-else />
              </template>
            </Button>
            <Button variant="outline" size="icon-sm" @click="closeDialog">
              <template #icon>
                <Close />
              </template>
            </Button>
          </div>
        </div>
      </template>
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="system-notice-page__dialog-form"
      >
        <section class="system-notice-page__form-section">
          <div class="system-notice-page__form-title">基础信息</div>
          <div class="system-notice-page__form-grid">
            <el-form-item class="system-notice-page__form-item--full" label="通知标题" prop="title">
              <el-input v-model="formData.title" placeholder="通知标题" clearable />
            </el-form-item>

            <el-form-item label="通知类型" prop="type">
              <DictSelect v-model="formData.type" code="notice_type" />
            </el-form-item>
            <el-form-item label="通知等级" prop="level">
              <DictSelect v-model="formData.level" code="notice_level" />
            </el-form-item>
            <el-form-item
              class="system-notice-page__form-item--full"
              label="目标类型"
              prop="targetType"
            >
              <el-radio-group v-model="formData.targetType">
                <el-radio :value="1">全体</el-radio>
                <el-radio :value="2">指定</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="formData.targetType == 2"
              class="system-notice-page__form-item--full"
              label="指定用户"
              prop="targetUsers"
            >
              <el-select
                v-model="formData.targetUsers"
                multiple
                search
                placeholder="请选择指定用户"
              >
                <el-option
                  v-for="item in userOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="system-notice-page__form-section">
          <div class="system-notice-page__form-title">通知内容</div>
          <div class="system-notice-page__form-grid">
            <el-form-item
              class="system-notice-page__form-item--full"
              label="通知内容"
              prop="content"
            >
              <WangEditor v-model="formData.content" height="350px" />
            </el-form-item>
          </div>
        </section>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <Button @click="handleSubmit()">确定</Button>
          <Button variant="outline" @click="closeDialog()">取消</Button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="detailDialog.visible"
      :show-close="false"
      width="50%"
      append-to-body
      @close="closeDetailDialog"
    >
      <template #header>
        <div class="flex-x-between">
          <span>通知公告详情</span>
          <div class="dialog-toolbar">
            <Button variant="outline" size="icon-sm" @click="closeDetailDialog">
              <template #icon>
                <Close />
              </template>
            </Button>
          </div>
        </div>
      </template>
      <el-descriptions :column="1">
        <el-descriptions-item label="标题：">
          {{ currentNotice.title }}
        </el-descriptions-item>
        <el-descriptions-item label="发布状态：">
          <Badge :variant="getPublishBadgeVariant(currentNotice.publishStatus)">
            {{ getPublishText(currentNotice.publishStatus) }}
          </Badge>
        </el-descriptions-item>
        <el-descriptions-item label="发布人：">
          {{ currentNotice.publisherName }}
        </el-descriptions-item>
        <el-descriptions-item label="发布时间：">
          {{ currentNotice.publishTime }}
        </el-descriptions-item>
        <el-descriptions-item label="公告内容：">
          <div class="notice-content" v-html="currentNotice.content" />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Notice",
  inheritAttrs: false,
});

import NoticeAPI from "@/api/system/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NoticeItem, NoticeForm, NoticeQueryParams, NoticeDetail } from "@/types/api";
import UserAPI from "@/api/system/user";
import type { FormInstance, FormRules } from "element-plus";

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<NoticeQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

// 列表数据
const pageData = ref<NoticeItem[]>([]);
const userOptions = ref<OptionItem[]>([]);
const total = ref(0);
const loading = ref(false);
const selectIds = ref<number[]>([]);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
  fullscreen: false,
});

// 表单数据
const formData = reactive<NoticeForm>({
  level: "L",
  targetType: 1,
});

function getPublishBadgeVariant(status?: number) {
  if (status === 1) return "secondary";
  if (status === -1) return "outline";
  return "outline";
}

function getPublishText(status?: number) {
  if (status === 1) return "已发布";
  if (status === -1) return "已撤回";
  return "未发布";
}

// 验证规则
const rules: FormRules = {
  title: [{ required: true, message: "请输入通知标题", trigger: "blur" }],
  content: [
    {
      required: true,
      message: "请输入通知内容",
      trigger: "blur",
      validator: (rule, value: string, callback) => {
        if (!value.replace(/<[^>]+>/g, "").trim()) {
          callback(new Error("请输入通知内容"));
        } else {
          callback();
        }
      },
    },
  ],
  type: [{ required: true, message: "请选择通知类型", trigger: "change" }],
};

// 详情弹窗状态
const detailDialog = reactive({
  visible: false,
});
const currentNotice = ref<NoticeDetail>({});

/**
 * 查询按钮点击事件
 */
function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchData();
}

/**
 * 加载通知公告列表数据
 */
function fetchData(): void {
  loading.value = true;
  NoticeAPI.getPage(queryParams)
    .then((data) => {
      pageData.value = data.list;
      total.value = data.total ?? 0;
    })
    .finally(() => {
      loading.value = false;
    });
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
function handleSelectionChange(selection: NoticeItem[]): void {
  selectIds.value = selection.map((item) => Number(item.id)).filter((id) => Number.isFinite(id));
}

/**
 * 打开弹窗
 * @param id 通知ID（编辑时传入）
 */
function openDialog(id?: string): void {
  dialogState.fullscreen = false;
  UserAPI.getOptions().then((data) => {
    userOptions.value = data;
  });

  dialogState.visible = true;
  if (id) {
    dialogState.title = "修改公告";
    NoticeAPI.getFormData(id).then((data) => {
      Object.assign(formData, {
        ...data,
        targetUsers: normalizeTargetUsers(
          (data as NoticeForm & { targetUserIds?: unknown }).targetUserIds
        ),
      });
    });
  } else {
    Object.assign(formData, { level: "L", targetType: 1, targetUsers: [] });
    dialogState.title = "新增公告";
  }
}

/**
 * 发布通知公告
 * @param id 通知ID
 */
function handlePublish(id: string): void {
  NoticeAPI.publish(id).then(() => {
    ElMessage.success("发布成功");
    fetchData();
  });
}

/**
 * 撤回通知公告
 * @param id 通知ID
 */
function handleRevoke(id: string): void {
  NoticeAPI.revoke(id).then(() => {
    ElMessage.success("撤回成功");
    fetchData();
  });
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      const payload = {
        ...formData,
        targetUserIds: formData.targetType === 2 ? (formData.targetUsers ?? []) : [],
      } as NoticeForm & { targetUserIds: number[] };
      delete (payload as NoticeForm).targetUsers;
      const id = formData.id;
      if (id) {
        NoticeAPI.update(id, payload)
          .then(() => {
            ElMessage.success("修改成功");
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        NoticeAPI.create(payload)
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
  dialogState.fullscreen = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
  formData.targetType = 1;
  formData.targetUsers = [];
  formData.content = "";
}

/**
 * 标准化目标用户数据
 */
function normalizeTargetUsers(value?: unknown): number[] {
  if (!value) {
    return [];
  }
  const toNumberArray = (arr: unknown[]): number[] =>
    arr.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  if (Array.isArray(value)) {
    return toNumberArray(value);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return toNumberArray(parsed);
      }
      return value
        .split(",")
        .filter(Boolean)
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v));
    } catch {
      return value
        .split(",")
        .filter(Boolean)
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v));
    }
  }
  return [];
}

/**
 * 弹窗全屏切换
 */
function toggleDialogFullscreen(): void {
  dialogState.fullscreen = !dialogState.fullscreen;
}

/**
 * 删除通知公告
 * @param id 通知ID
 */
function handleDelete(id?: number): void {
  const deleteIds = [id || selectIds.value].join(",");
  if (!deleteIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除已选中的数据项吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      NoticeAPI.deleteByIds(deleteIds)
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
 * 打开详情弹窗
 */
async function openDetailDialog(id: string): Promise<void> {
  const noticeDetail = await NoticeAPI.getDetail(id);
  currentNotice.value = noticeDetail;
  detailDialog.visible = true;
}

/**
 * 关闭详情弹窗
 */
function closeDetailDialog(): void {
  detailDialog.visible = false;
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.system-notice-page :deep(.filter-section) {
  border-radius: 20px;
}

.system-notice-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.system-notice-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.system-notice-page :deep(.filter-section .el-input__wrapper),
.system-notice-page :deep(.filter-section .el-select__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-notice-page :deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.system-notice-page :deep(.table-section__toolbar) {
  align-items: flex-start;
}

.system-notice-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.system-notice-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.system-notice-page :deep(.el-dialog) {
  border-radius: 24px;
}

.system-notice-page :deep(.el-dialog .el-form-item__label) {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 0.04em;
}

.system-notice-page :deep(.el-dialog .el-input__wrapper),
.system-notice-page :deep(.el-dialog .el-select__wrapper),
.system-notice-page :deep(.el-dialog .el-textarea__inner) {
  border-radius: 12px;
  box-shadow: none;
}

.system-notice-page__dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.system-notice-page__form-section {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.system-notice-page__form-title {
  margin-bottom: 14px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.04em;
}

.system-notice-page__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.system-notice-page__form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.system-notice-page__form-item--full {
  grid-column: 1 / -1;
}

.system-notice-page__action {
  padding-right: 0;
  padding-left: 0;
}

.system-notice-page__action--danger {
  color: var(--destructive);
}

.dialog-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.notice-content {
  line-height: 1.75;
}

@media (max-width: 768px) {
  .system-notice-page__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
