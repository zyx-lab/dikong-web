<template>
  <div class="app-container profile-notice-page">
    <!-- 搜索区域 -->
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="通知标题" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="关键字"
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
      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        class="table-section__content"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="通知标题" prop="title" min-width="200" />
        <el-table-column align="center" label="通知类型" width="150">
          <template #default="scope">
            <DictTag v-model="scope.row.type" code="notice_type" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="通知等级" width="100">
          <template #default="scope">
            <DictTag v-model="scope.row.level" code="notice_level" />
          </template>
        </el-table-column>
        <el-table-column
          key="releaseTime"
          align="center"
          label="发布时间"
          prop="publishTime"
          width="150"
        />
        <el-table-column align="center" label="发布人" prop="publisherName" width="150" />
        <el-table-column align="center" label="状态" width="100">
          <template #default="scope">
            <Badge v-if="scope.row.isRead == 1" variant="secondary">已读</Badge>
            <Badge v-else variant="outline">未读</Badge>
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="80">
          <template #default="scope">
            <Button
              variant="ghost"
              size="sm"
              class="notice-table-action"
              @click="handleReadNotice(scope.row.id)"
            >
              查看
            </Button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="handleQuery"
      />
    </el-card>

    <el-dialog
      v-model="noticeDialogVisible"
      :title="noticeDetail?.title ?? '通知详情'"
      width="800px"
      custom-class="notice-detail"
    >
      <div v-if="noticeDetail" class="notice-detail__wrapper">
        <div class="notice-detail__meta">
          <Badge variant="outline">
            <el-icon><User /></el-icon>
            {{ noticeDetail.publisherName }}
          </Badge>
          <Badge variant="secondary" class="ml-2">
            <el-icon><Timer /></el-icon>
            {{ noticeDetail.publishTime }}
          </Badge>
        </div>

        <div class="notice-detail__content">
          <div v-html="noticeDetail.content"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "MyNotice",
  inheritAttrs: false,
});

import { onMounted, reactive, ref } from "vue";
import NoticeAPI from "@/api/system/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NoticeDetail, NoticeItem, NoticeQueryParams } from "@/types/api";

const queryFormRef = ref();
const pageData = ref<NoticeItem[]>([]);
const loading = ref(false);
const total = ref(0);

const queryParams = reactive<NoticeQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

const noticeDialogVisible = ref(false);
const noticeDetail = ref<NoticeDetail | null>(null);

async function handleQuery() {
  loading.value = true;
  try {
    const data = await NoticeAPI.getMyNoticePage(queryParams);
    pageData.value = data.list;
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function handleResetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  handleQuery();
}

async function handleReadNotice(id: string) {
  const data = await NoticeAPI.getDetail(id);
  noticeDetail.value = data;
  noticeDialogVisible.value = true;
}

onMounted(() => {
  handleQuery();
});
</script>

<style lang="scss" scoped>
:deep(.filter-section) {
  border-radius: 20px;
}

:deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

:deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

:deep(.filter-section .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

:deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

:deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

:deep(.el-dialog__header) {
  text-align: center;
}

:deep(.el-dialog) {
  border-radius: 24px;
}

:deep(.el-dialog .el-dialog__body) {
  padding-top: 10px;
}

.notice-table-action {
  padding-right: 0;
  padding-left: 0;
}

.notice-detail {
  &__wrapper {
    padding: 0 20px;
  }

  &__meta {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__publisher {
    margin-right: 24px;

    i {
      margin-right: 4px;
    }
  }

  &__content {
    max-height: 60vh;
    padding-top: 16px;
    margin-bottom: 24px;
    overflow-y: auto;
    border-top: 1px solid var(--el-border-color);

    &::-webkit-scrollbar {
      width: 6px;
    }
  }
}
</style>
