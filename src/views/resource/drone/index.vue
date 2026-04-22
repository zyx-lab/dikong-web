<template>
  <div class="app-container command-page resource-drone-page">
    <section class="command-page__hero command-page__hero--compact">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">无人机资源</p>
            <h2 class="command-page__title">无人机管理</h2>
            <p class="command-page__description">查看无人机在线、离线和挂载情况。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">在线状态</span>
            <span class="command-page__signal">维护状态</span>
            <span class="command-page__signal">挂载情况</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">无人机总量</div>
            <div class="command-page__metric-value">{{ total }}</div>
            <div class="command-page__metric-note">当前列表中的无人机数量</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">在线就绪</div>
            <div class="command-page__metric-value">
              {{ onlineCount }}
              <span class="command-page__metric-sub">/ {{ total || 0 }}</span>
            </div>
            <div class="command-page__metric-note">可直接调度</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">离线待恢复</div>
            <div class="command-page__metric-value">{{ offlineCount }}</div>
            <div class="command-page__metric-note">待恢复的无人机</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">载荷已绑定</div>
            <div class="command-page__metric-value">{{ payloadBoundCount }}</div>
            <div class="command-page__metric-note">已绑定负载的无人机</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="无人机编号" prop="code">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入无人机编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="无人机名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入无人机名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item class="search-buttons">
          <Button size="sm" @click="handleQuery">查询</Button>
          <Button size="sm" variant="outline" @click="handleResetQuery">重置</Button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <Button size="sm" @click="handleCreateClick">认领无人机</Button>
          <Button
            size="sm"
            variant="destructive"
            :disabled="selectedIds.length === 0"
            @click="handleDelete()"
          >
            批量删除
          </Button>
        </div>
        <div class="table-section__toolbar--right">
          <div class="table-toolbar-summary">
            <Badge variant="outline">共 {{ total }} 架无人机</Badge>
            <Badge v-if="selectedIds.length > 0" variant="secondary">
              已选 {{ selectedIds.length }} 项
            </Badge>
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
        <el-table-column label="ID" prop="id" width="80" align="center" />
        <el-table-column label="编号" prop="code" min-width="160" show-overflow-tooltip />
        <el-table-column label="名称" prop="name" min-width="160" show-overflow-tooltip />
        <el-table-column label="型号" prop="model" min-width="120" show-overflow-tooltip />
        <el-table-column label="设备序列号" prop="deviceSn" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100" align="center" />
        <el-table-column
          label="固件版本"
          prop="firmwareVersion"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column label="在线状态" width="90" align="center">
          <template #default="{ row }">
            <Badge :variant="getOnlineBadgeVariant(row.djiOnline)">
              {{ row.djiOnline ? "在线" : "离线" }}
            </Badge>
          </template>
        </el-table-column>
        <el-table-column label="最后在线" min-width="180">
          <template #default="{ row }">{{ formatTime(row.lastSeenAt) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" align="center" width="100">
          <template #default="scope">
            <Button
              variant="ghost"
              size="sm"
              class="resource-table-action"
              @click="handleDetailClick(scope.row)"
            >
              查看
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="resource-table-action resource-table-action--danger"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </Button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-state">
            <el-empty
              :description="hasActiveFilters ? '当前筛选条件下暂无无人机' : '暂无无人机数据'"
            />
            <div v-if="hasActiveFilters" class="table-empty-state__actions">
              <Button variant="ghost" size="sm" @click="handleResetQuery">清空筛选</Button>
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

    <!-- Claim dialog: show available (unclaimed) drones and allow multi-select -->
    <el-dialog
      v-model="claimDialog.visible"
      title="认领无人机"
      :width="dialogWidth"
      align-center
      destroy-on-close
      class="dialog-form-decorated dialog-claim-layout"
      @close="closeClaimDialog"
    >
      <div style="min-height: 240px">
        <el-table
          v-loading="claimDialog.loading"
          :data="claimDialog.list"
          border
          row-key="deviceSn"
          @selection-change="handleClaimSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="名称" prop="name" min-width="160" show-overflow-tooltip />
          <el-table-column label="型号" prop="model" min-width="120" show-overflow-tooltip />
          <el-table-column
            label="设备序列号"
            prop="deviceSn"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column label="固件版本" prop="firmwareVersion" min-width="140" />
          <el-table-column label="最后在线" min-width="180">
            <template #default="{ row }">{{ formatTime(row.lastSeenAt) }}</template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button variant="outline" @click="closeClaimDialog">取消</Button>
          <Button :disabled="claimDialog.confirmLoading" @click="handleClaimConfirm">
            {{ claimDialog.confirmLoading ? "认领中..." : "确认认领" }}
          </Button>
        </div>
      </template>
    </el-dialog>

    <!-- Detail dialog -->
    <el-dialog
      v-model="detailDialog.visible"
      title="无人机详情"
      :width="dialogWidth"
      align-center
      destroy-on-close
      class="dialog-form-decorated dialog-form-layout"
      @close="closeDetailDialog"
    >
      <div v-loading="detailDialog.loading" style="min-height: 200px">
        <template v-if="detailDialog.data">
          <el-table :data="[detailDialog.data]" border size="small">
            <el-table-column prop="id" label="无人机ID" min-width="100" show-overflow-tooltip />
            <el-table-column prop="code" label="无人机编码" min-width="160" show-overflow-tooltip />
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="model" label="型号" min-width="120" show-overflow-tooltip />
            <el-table-column
              prop="deviceSn"
              label="设备序列号"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column prop="status" label="设备状态" width="100" align="center" />
            <el-table-column label="在线状态" width="90" align="center">
              <template #default="{ row }">
                <Badge :variant="getOnlineBadgeVariant(row.djiOnline)">
                  {{ row.djiOnline ? "在线" : "离线" }}
                </Badge>
              </template>
            </el-table-column>
            <el-table-column
              prop="firmwareVersion"
              label="固件版本"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column
              prop="lastSeenAt"
              label="最后在线时间"
              min-width="180"
              :formatter="(row: any) => formatTime(row.lastSeenAt)"
            />
            <el-table-column label="最近载荷信息" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatPayload(row.lastPayload) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="createdAt"
              label="创建时间"
              min-width="160"
              :formatter="(row: any) => formatTime(row.createdAt)"
            />
            <el-table-column
              prop="updatedAt"
              label="更新时间"
              min-width="160"
              :formatter="(row: any) => formatTime(row.updatedAt)"
            />
          </el-table>
        </template>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button variant="outline" @click="closeDetailDialog">关闭</Button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DroneInfo, DroneQuery } from "@/api/resource/types";
import DroneAPI from "@/api/resource/drone";

defineOptions({
  name: "ResourceDrone",
  inheritAttrs: false,
});

const { width } = useWindowSize();
const queryFormRef = ref<FormInstance>();

const queryParams = reactive<DroneQuery>({
  pageNum: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
});

const tableData = ref<DroneInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const selectedIds = ref<number[]>([]);

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "860px"));
const hasActiveFilters = computed(() => Boolean(queryParams.code || queryParams.name));
const onlineCount = computed(() => tableData.value.filter((d) => d.djiOnline === true).length);
const offlineCount = computed(() => Math.max((total.value || 0) - onlineCount.value, 0));
const payloadBoundCount = computed(
  () => tableData.value.filter((item) => Boolean(item.lastPayload)).length
);

const claimDialog = reactive({
  visible: false,
  loading: false,
  confirmLoading: false,
  list: [] as DroneInfo[],
  selected: [] as DroneInfo[],
  pageNum: 1,
  pageSize: 100,
  total: 0,
});

const detailDialog = reactive({
  visible: false,
  loading: false,
  data: null as DroneInfo | null,
});

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await DroneAPI.getPage(queryParams as DroneQuery);
    tableData.value = res.list ?? [];
    total.value = res.total ?? 0;
  } catch (err) {
    console.error(err);
    ElMessage.error("获取无人机列表失败");
  } finally {
    loading.value = false;
  }
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

function handleCreateClick(): void {
  // Open claim modal and load available (unclaimed) drones
  claimDialog.selected = [];
  claimDialog.pageNum = 1;
  claimDialog.visible = true;
  fetchAvailableData();
}

async function fetchAvailableData(): Promise<void> {
  claimDialog.loading = true;
  try {
    const res = await DroneAPI.getAvailable({
      pageNum: claimDialog.pageNum,
      pageSize: claimDialog.pageSize,
    } as DroneQuery);
    claimDialog.list = res.list ?? [];
    claimDialog.total = res.total ?? 0;
  } catch (err) {
    console.error(err);
    ElMessage.error("获取可认领无人机失败");
  } finally {
    claimDialog.loading = false;
  }
}

function formatPayload(payload: Record<string, any> | undefined): string {
  if (!payload) return "-";
  return JSON.stringify(payload, null, 2);
}

function getOnlineBadgeVariant(isOnline?: boolean) {
  return isOnline ? "secondary" : "outline";
}

function formatTime(value: string | undefined | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function handleClaimSelectionChange(selection: DroneInfo[]): void {
  claimDialog.selected = selection;
}

async function handleClaimConfirm(): Promise<void> {
  if (!claimDialog.selected || claimDialog.selected.length === 0) {
    ElMessage.warning("请先选择要认领的无人机");
    return;
  }

  const deviceSns = claimDialog.selected.map((s) => s.deviceSn).filter(Boolean) as string[];
  if (deviceSns.length === 0) {
    ElMessage.warning("选中项缺少设备序列号，无法认领");
    return;
  }

  claimDialog.confirmLoading = true;
  try {
    await DroneAPI.claimBulk(deviceSns);
    ElMessage.success("认领成功");
    closeClaimDialog();
    fetchData();
  } catch (err) {
    console.error(err);
    ElMessage.error("认领失败");
  } finally {
    claimDialog.confirmLoading = false;
  }
}

function closeClaimDialog(): void {
  claimDialog.visible = false;
  claimDialog.selected = [];
  claimDialog.list = [];
  claimDialog.loading = false;
  claimDialog.confirmLoading = false;
}

async function handleDetailClick(row: DroneInfo): Promise<void> {
  detailDialog.loading = true;
  detailDialog.data = null;
  detailDialog.visible = true;
  try {
    const data = await DroneAPI.getDetail(row.id);
    detailDialog.data = data;
  } catch (err) {
    console.error(err);
    ElMessage.error("获取无人机详情失败");
    detailDialog.visible = false;
  } finally {
    detailDialog.loading = false;
  }
}

function closeDetailDialog(): void {
  detailDialog.visible = false;
  detailDialog.data = null;
}

function handleDelete(id?: number): void {
  const ids = id ? [String(id)] : selectedIds.value.map(String);
  if (ids.length === 0) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  const message =
    ids.length === 1 ? "确认删除当前无人机吗？" : `确认删除选中的 ${ids.length} 架无人机吗？`;

  ElMessageBox.confirm(message, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    async () => {
      loading.value = true;
      try {
        for (const delId of ids) {
          await DroneAPI.delete(delId);
        }
        ElMessage.success("删除成功");
        selectedIds.value = [];
        handleQuery();
      } catch (err) {
        console.error(err);
        ElMessage.error("删除失败");
      } finally {
        loading.value = false;
      }
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

.resource-drone-page :deep(.filter-section) {
  border-radius: 20px;
}

.resource-drone-page :deep(.filter-section .el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.resource-drone-page :deep(.filter-section .el-form-item) {
  margin-right: 0;
  margin-bottom: 10px;
}

.resource-drone-page :deep(.filter-section .el-input__wrapper),
.resource-drone-page :deep(.filter-section .el-select__wrapper) {
  border-radius: 12px;
  box-shadow: none;
}

.resource-drone-page :deep(.table-section) {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.resource-drone-page :deep(.table-section__toolbar) {
  align-items: flex-start;
}

.resource-drone-page :deep(.el-table) {
  --el-table-header-bg-color: color-mix(in srgb, var(--muted) 46%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--muted) 36%, transparent);
  border-radius: 16px;
}

.resource-drone-page :deep(.el-table th.el-table__cell) {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.resource-drone-page :deep(.el-dialog) {
  border-radius: 24px;
}

.resource-drone-page :deep(.el-dialog__header) {
  padding-bottom: 4px;
}

.resource-drone-page :deep(.el-dialog__body) {
  padding-top: 10px;
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

.resource-table-action {
  padding-right: 0;
  padding-left: 0;
}

.resource-table-action--danger {
  color: var(--destructive);
}

@media (max-width: 768px) {
  .resource-drone-page :deep(.table-section__toolbar--actions),
  .resource-drone-page :deep(.table-section__toolbar--right) {
    width: 100%;
  }
}
</style>
