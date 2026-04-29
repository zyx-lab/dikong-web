<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Aircraft Readiness Matrix</p>
            <h2 class="command-page__title">无人机管理</h2>
            <p class="command-page__description">
              将可用性、维护压力和保险风险收拢到同一张资源态势面里，让机队状态在进入列表前就先有重点与轻重缓急。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">机队就绪态势</span>
            <span class="command-page__signal">维护风险前置</span>
            <span class="command-page__signal">控制权一眼可见</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">无人机总量</div>
            <div class="command-page__metric-value">{{ totalCount }}</div>
            <div class="command-page__metric-note">当前筛选范围内的机队资源</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">在线就绪</div>
            <div class="command-page__metric-value">
              {{ onlineCount }}
              <span class="command-page__metric-sub">/ {{ total || 0 }}</span>
            </div>
            <div class="command-page__metric-note">实时可调度的机体数量</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">保养提醒</div>
            <div class="command-page__metric-value">-</div>
            <div class="command-page__metric-note">需要安排维护窗口的机体</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">保险风险</div>
            <div class="command-page__metric-value">-</div>
            <div class="command-page__metric-note">存在保险到期或过期风险</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form :model="queryParams" :inline="true">
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
        <el-form-item label="设备序列号" prop="deviceSn">
          <el-input
            v-model="queryParams.deviceSn"
            placeholder="请输入设备序列号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input
            v-model="queryParams.model"
            placeholder="请输入型号"
            clearable
            @keyup.enter="handleQuery"
          />
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
          <el-button type="primary" icon="plus" @click="handleCreateClick">认领无人机</el-button>
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
            <el-tag type="info">共 {{ totalCount }} 架无人机</el-tag>
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
        <el-table-column label="ID" prop="id" width="80" align="center" />
        <el-table-column label="编号" prop="code" min-width="160" show-overflow-tooltip />
        <el-table-column label="名称" prop="name" min-width="160" show-overflow-tooltip />
        <el-table-column label="型号" prop="model" min-width="120" show-overflow-tooltip />
        <el-table-column label="设备序列号" prop="deviceSn" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100" align="center" />
        <el-table-column
          label="固件版本"
          prop="firmwareVersion"
          min-width="80"
          show-overflow-tooltip
        />
        <el-table-column label="在线状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.djiOnline ? 'success' : 'info'" size="small">
              {{ row.djiOnline ? "在线" : "离线" }}
            </el-tag>
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
            <el-button type="primary" link size="small" @click="handleDetailClick(scope.row)">
              查看
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-state">
            <el-empty
              :description="hasActiveFilters ? '当前筛选条件下暂无无人机' : '暂无无人机数据'"
            />
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
        :page-sizes="[10, 20, 50, 100]"
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
          <el-button @click="closeClaimDialog">取消</el-button>
          <el-button
            type="primary"
            :loading="claimDialog.confirmLoading"
            @click="handleClaimConfirm"
          >
            确认认领
          </el-button>
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
                <el-tag :type="row.djiOnline ? 'success' : 'info'" size="small">
                  {{ row.djiOnline ? "在线" : "离线" }}
                </el-tag>
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
          <el-button @click="closeDetailDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox } from "element-plus";
import type { DroneInfo, DroneQuery } from "@/api/resource/types";
import DroneAPI from "@/api/resource/drone";

defineOptions({
  name: "ResourceDrone",
  inheritAttrs: false,
});

const { width } = useWindowSize();

const queryParams = reactive<DroneQuery>({
  pageNum: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  deviceSn: undefined,
  model: undefined,
});

const tableData = ref<DroneInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const selectedIds = ref<number[]>([]);
const deletedIds = ref(new Set<string>());

/** 无人机总量：API total 减去已删除的 */
const totalCount = computed(() => Math.max(0, total.value - deletedIds.value.size));
const onlineCount = computed(() => tableData.value.filter((d) => d.djiOnline === true).length);

const dialogWidth = computed(() => (width.value < 768 ? "92%" : "860px"));
const hasActiveFilters = computed(() =>
  Boolean(queryParams.code || queryParams.name || queryParams.deviceSn || queryParams.model)
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
  queryParams.code = undefined;
  queryParams.name = undefined;
  queryParams.deviceSn = undefined;
  queryParams.model = undefined;
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
        ids.forEach((i) => deletedIds.value.add(i));
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

.authority-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.authority-tag {
  margin-right: 0;
}
</style>
