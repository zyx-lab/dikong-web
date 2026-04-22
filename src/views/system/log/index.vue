<template>
  <div class="app-container system-log-page">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item prop="keywords" label="关键字">
          <el-input
            v-model="queryParams.keywords"
            placeholder="日志内容"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="createTime" label="操作时间">
          <el-date-picker
            v-model="queryParams.createTime"
            :editable="false"
            type="daterange"
            range-separator="~"
            start-placeholder="开始时间"
            end-placeholder="截止时间"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item class="search-buttons">
          <Button size="sm" @click="handleQuery">搜索</Button>
          <Button size="sm" variant="outline" @click="handleResetQuery">重置</Button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="data-table">
      <el-table
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        border
        class="data-table__content"
      >
        <el-table-column label="操作时间" prop="createTime" width="220" />
        <el-table-column label="操作人" prop="operator" width="120" />
        <el-table-column label="日志模块" prop="module" width="100" />
        <el-table-column label="日志内容" prop="content" min-width="200" />
        <el-table-column label="IP 地址" prop="ip" width="150" />
        <el-table-column label="地区" prop="region" width="150" />
        <el-table-column label="浏览器" prop="browser" width="150" />
        <el-table-column label="终端系统" prop="os" width="200" show-overflow-tooltip />
        <el-table-column label="执行时间(ms)" prop="executionTime" width="150" />
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Log",
  inheritAttrs: false,
});

import LogAPI from "@/api/system/log";
import { Button } from "@/components/ui/button";
import type { LogItem, LogQueryParams } from "@/types/api";
import type { FormInstance } from "element-plus";

// 表单引用
const queryFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<LogQueryParams>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  createTime: undefined as [string, string] | undefined,
});

// 列表数据
const pageData = ref<LogItem[]>();
const total = ref(0);
const loading = ref(false);

/**
 * 加载日志列表数据
 */
function fetchData(): void {
  loading.value = true;
  LogAPI.getPage(queryParams)
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
  queryParams.createTime = undefined;
  fetchData();
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.system-log-page :deep(.filter-section) {
  border-radius: 20px;
}

.system-log-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.system-log-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.system-log-page :deep(.filter-section .el-input__wrapper),
.system-log-page :deep(.filter-section .el-range-editor.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.system-log-page :deep(.data-table) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.system-log-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.system-log-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}
</style>
