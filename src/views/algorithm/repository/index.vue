<template>
  <div class="app-container command-page">
    <section class="command-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">Algorithm Repository</p>
            <h2 class="command-page__title">算法仓库</h2>
            <p class="command-page__description">
              统一管理识别算法、模型版本与适用场景，让值守人员在进入列表前先看清算法储备、重点类型和当前可直接下发的能力。
            </p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">算法资产总览</span>
            <span class="command-page__signal">版本与场景联动</span>
            <span class="command-page__signal">多类算法统一编排</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">算法总量</div>
            <div class="command-page__metric-value">{{ total }}</div>
            <div class="command-page__metric-note">当前筛选条件下可管理的算法资产规模</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">目标识别</div>
            <div class="command-page__metric-value">{{ detectionCount }}</div>
            <div class="command-page__metric-note">适合卡口识别、目标检测与分类分析</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">行为分析</div>
            <div class="command-page__metric-value">{{ behaviorCount }}</div>
            <div class="command-page__metric-note">适合聚集、入侵与异常行为识别场景</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">环境监测</div>
            <div class="command-page__metric-value">{{ environmentCount }}</div>
            <div class="command-page__metric-note">适合越界、风险区域和环境态势感知</div>
          </div>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="算法名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入算法名称"
            clearable
            class="filter-field--lg"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="算法类型" prop="type">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            class="filter-field"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            class="filter-field"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
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
          <el-button type="primary" icon="plus" @click="handleCreateClick">新增算法</el-button>
        </div>
        <div class="table-section__toolbar--right">
          <div class="table-toolbar-summary">
            <el-tag type="info">共 {{ total }} 套算法</el-tag>
            <el-tag type="primary">开启 {{ enabledCount }} 套</el-tag>
            <el-tag type="success">目标识别 {{ detectionCount }} 套</el-tag>
            <el-tag type="warning">环境监测 {{ environmentCount }} 套</el-tag>
          </div>
        </div>
      </div>

      <div v-loading="loading" class="table-section__content">
        <section v-if="pagedAlgorithms.length > 0" class="route-card-grid">
          <article v-for="item in pagedAlgorithms" :key="item.id" class="route-card algorithm-card">
            <div
              class="route-card__preview algorithm-card__preview"
              :style="{ background: item.coverGradient }"
            >
              <div class="algorithm-card__preview-overlay" />
              <span
                v-for="(frame, index) in item.frames"
                :key="`${item.id}-${index}`"
                class="algorithm-card__frame"
                :class="`algorithm-card__frame--${frame.tone ?? 'primary'}`"
                :style="getFrameStyle(frame)"
              />
            </div>

            <div class="route-card__body">
              <div class="route-card__body-head">
                <div>
                  <h3>{{ item.name }}</h3>
                  <p>算法类型：{{ getTypeLabel(item.type) }}</p>
                </div>
                <el-tag
                  size="small"
                  effect="plain"
                  class="route-type-tag"
                  :type="getStatusTagType(item.status)"
                >
                  {{ getStatusLabel(item.status) }}
                </el-tag>
              </div>

              <div class="route-card__meta">
                <span>模型版本：v{{ item.version }}</span>
                <span>适用场景：{{ item.sceneTags.join("、") }}</span>
                <span>更新时间：{{ item.updatedAt }}</span>
              </div>

              <div class="route-card__stats">
                <div class="route-card__stat">
                  <span>调用次数</span>
                  <strong>{{ item.referenceCount }}</strong>
                </div>
                <div class="route-card__stat">
                  <span>识别精度</span>
                  <strong>{{ formatAccuracy(item.accuracy) }}%</strong>
                </div>
                <div class="route-card__stat">
                  <span>覆盖场景</span>
                  <strong>{{ item.sceneTags.length }}</strong>
                </div>
              </div>

              <div class="route-card__actions">
                <el-button link type="primary" size="small" @click="handleDetail(item)">
                  详情
                </el-button>
                <el-button
                  link
                  :type="item.status === AlgorithmStatus.ENABLED ? 'warning' : 'primary'"
                  size="small"
                  @click="handleToggleStatus(item)"
                >
                  {{ item.status === AlgorithmStatus.ENABLED ? "停用" : "开启" }}
                </el-button>
              </div>
            </div>
          </article>
        </section>

        <div v-else class="table-empty-state">
          <el-empty :description="hasActiveFilters ? '当前筛选条件下暂无算法' : '暂无算法数据'" />
          <div v-if="hasActiveFilters" class="table-empty-state__actions">
            <el-button link type="primary" @click="handleResetQuery">清空筛选</el-button>
          </div>
        </div>
      </div>

      <pagination
        v-if="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { AlgorithmType, type AlgorithmInfo, type AlgorithmQuery } from "@/api/algorithm/types";

defineOptions({
  name: "AlgorithmRepository",
  inheritAttrs: false,
});

const AlgorithmStatus = {
  DISABLED: 0,
  ENABLED: 1,
  TESTING: 2,
} as const;

type AlgorithmStatus = (typeof AlgorithmStatus)[keyof typeof AlgorithmStatus];
type FrameTone = "primary" | "warning" | "success";

interface AlgorithmPreviewFrame {
  top: string;
  left: string;
  width: string;
  height: string;
  tone?: FrameTone;
}

interface AlgorithmRepositoryCard extends AlgorithmInfo {
  status: AlgorithmStatus;
  updatedAt: string;
  referenceCount: number;
  sceneTags: string[];
  coverGradient: string;
  frames: AlgorithmPreviewFrame[];
}

const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const algorithmList = ref<AlgorithmRepositoryCard[]>(buildMockData());

const queryParams = reactive<AlgorithmQuery>({
  pageNum: 1,
  pageSize: 6,
});

const typeOptions = [
  { label: "目标识别", value: AlgorithmType.OBJECT_DETECTION },
  { label: "行为分析", value: AlgorithmType.BEHAVIOR_ANALYSIS },
  { label: "环境监测", value: AlgorithmType.ENVIRONMENT_MONITOR },
];

const statusOptions = [
  { label: "开启", value: AlgorithmStatus.ENABLED },
  { label: "试运行", value: AlgorithmStatus.TESTING },
  { label: "停用", value: AlgorithmStatus.DISABLED },
];

const filteredAlgorithms = computed(() =>
  algorithmList.value.filter((item) => {
    if (queryParams.name && !item.name.includes(queryParams.name.trim())) {
      return false;
    }

    if (queryParams.type && item.type !== queryParams.type) {
      return false;
    }

    if (queryParams.status !== undefined && queryParams.status !== null) {
      return item.status === queryParams.status;
    }

    return true;
  })
);

const pagedAlgorithms = computed(() => {
  const currentPage = queryParams.pageNum ?? 1;
  const pageSize = queryParams.pageSize ?? 6;
  const start = (currentPage - 1) * pageSize;
  return filteredAlgorithms.value.slice(start, start + pageSize);
});

const total = computed(() => filteredAlgorithms.value.length);
const enabledCount = computed(
  () => filteredAlgorithms.value.filter((item) => item.status === AlgorithmStatus.ENABLED).length
);
const detectionCount = computed(
  () =>
    filteredAlgorithms.value.filter((item) => item.type === AlgorithmType.OBJECT_DETECTION).length
);
const behaviorCount = computed(
  () =>
    filteredAlgorithms.value.filter((item) => item.type === AlgorithmType.BEHAVIOR_ANALYSIS).length
);
const environmentCount = computed(
  () =>
    filteredAlgorithms.value.filter((item) => item.type === AlgorithmType.ENVIRONMENT_MONITOR)
      .length
);
const hasActiveFilters = computed(
  () => Boolean(queryParams.name) || Boolean(queryParams.type) || queryParams.status !== undefined
);

function buildMockData(): AlgorithmRepositoryCard[] {
  return [
    {
      id: 1,
      name: "人脸识别",
      description: "适用于布控比对、重点人员识别与访客通行核验。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "2.5.1",
      accuracy: 98.6,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-12 14:30",
      referenceCount: 256,
      sceneTags: ["智慧城市", "智慧城管", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(11, 28, 55, 0.98) 0%, rgba(33, 78, 128, 0.9) 48%, rgba(92, 205, 232, 0.82) 100%)",
      frames: [
        { top: "18%", left: "6%", width: "30%", height: "54%" },
        { top: "14%", left: "46%", width: "32%", height: "60%", tone: "success" },
      ],
    },
    {
      id: 2,
      name: "人员异常聚集",
      description: "用于广场、景区和园区场景的人群聚集趋势感知。",
      type: AlgorithmType.BEHAVIOR_ANALYSIS,
      version: "1.8.4",
      accuracy: 95.2,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-11 09:45",
      referenceCount: 43,
      sceneTags: ["智慧城市", "智慧城管", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(85, 88, 92, 0.94) 0%, rgba(104, 120, 136, 0.9) 42%, rgba(128, 196, 216, 0.76) 100%)",
      frames: [{ top: "16%", left: "22%", width: "48%", height: "58%", tone: "primary" }],
    },
    {
      id: 3,
      name: "非机动车识别",
      description: "用于道路通行秩序识别、禁停区告警与轨迹检索。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "3.0.2",
      accuracy: 96.4,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-10 18:20",
      referenceCount: 256,
      sceneTags: ["智慧城市", "智慧城管", "智慧交通"],
      coverGradient:
        "linear-gradient(135deg, rgba(47, 53, 63, 0.96) 0%, rgba(76, 89, 109, 0.9) 48%, rgba(73, 170, 226, 0.8) 100%)",
      frames: [
        { top: "22%", left: "12%", width: "18%", height: "46%" },
        { top: "28%", left: "44%", width: "20%", height: "34%" },
      ],
    },
    {
      id: 4,
      name: "危化品车辆识别",
      description: "适合港区与道路场景的危化运输车辆识别与分类统计。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "2.1.0",
      accuracy: 97.3,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-09 16:10",
      referenceCount: 76,
      sceneTags: ["智慧城市", "智慧城管", "智慧交通"],
      coverGradient:
        "linear-gradient(135deg, rgba(33, 49, 73, 0.96) 0%, rgba(64, 89, 118, 0.9) 44%, rgba(110, 181, 221, 0.76) 100%)",
      frames: [{ top: "18%", left: "16%", width: "56%", height: "40%", tone: "warning" }],
    },
    {
      id: 5,
      name: "遗留物品检测",
      description: "面向重点区域的滞留物发现、告警与处置联动。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "1.6.9",
      accuracy: 94.7,
      status: AlgorithmStatus.TESTING,
      updatedAt: "2026-03-08 11:26",
      referenceCount: 45,
      sceneTags: ["智慧楼宇", "智慧校园", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(79, 83, 58, 0.96) 0%, rgba(123, 117, 80, 0.9) 40%, rgba(197, 162, 92, 0.78) 100%)",
      frames: [
        { top: "38%", left: "16%", width: "10%", height: "18%", tone: "warning" },
        { top: "44%", left: "34%", width: "11%", height: "16%", tone: "warning" },
        { top: "41%", left: "52%", width: "12%", height: "18%", tone: "warning" },
      ],
    },
    {
      id: 6,
      name: "人员闯入",
      description: "适合围界、机房与重点目标区域的入侵识别和处置联动。",
      type: AlgorithmType.BEHAVIOR_ANALYSIS,
      version: "2.2.7",
      accuracy: 96.1,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-07 15:08",
      referenceCount: 112,
      sceneTags: ["智慧城市", "智慧管廊", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(47, 53, 60, 0.96) 0%, rgba(80, 92, 106, 0.9) 42%, rgba(121, 178, 196, 0.74) 100%)",
      frames: [{ top: "16%", left: "30%", width: "26%", height: "64%", tone: "primary" }],
    },
    {
      id: 7,
      name: "徘徊识别",
      description: "识别长时间逗留与反复徘徊行为，辅助安防人员快速研判。",
      type: AlgorithmType.BEHAVIOR_ANALYSIS,
      version: "1.3.6",
      accuracy: 92.8,
      status: AlgorithmStatus.DISABLED,
      updatedAt: "2026-03-06 13:42",
      referenceCount: 23,
      sceneTags: ["智慧楼宇", "智慧园区", "智慧社区"],
      coverGradient:
        "linear-gradient(135deg, rgba(57, 57, 55, 0.96) 0%, rgba(93, 85, 78, 0.9) 40%, rgba(147, 115, 88, 0.74) 100%)",
      frames: [{ top: "22%", left: "20%", width: "38%", height: "54%", tone: "success" }],
    },
    {
      id: 8,
      name: "越界检测",
      description: "适用于禁入区、危险区和边界区域的越界识别与实时预警。",
      type: AlgorithmType.ENVIRONMENT_MONITOR,
      version: "2.0.5",
      accuracy: 97.8,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-05 10:18",
      referenceCount: 89,
      sceneTags: ["智慧园区", "智慧工地", "智慧安监"],
      coverGradient:
        "linear-gradient(135deg, rgba(55, 60, 69, 0.96) 0%, rgba(86, 94, 102, 0.9) 48%, rgba(122, 168, 190, 0.76) 100%)",
      frames: [{ top: "18%", left: "40%", width: "22%", height: "58%", tone: "warning" }],
    },
  ];
}

function getTypeLabel(type: AlgorithmType): string {
  switch (type) {
    case AlgorithmType.BEHAVIOR_ANALYSIS:
      return "行为分析";
    case AlgorithmType.ENVIRONMENT_MONITOR:
      return "环境监测";
    default:
      return "目标识别";
  }
}

function getStatusLabel(status: AlgorithmStatus): string {
  switch (status) {
    case AlgorithmStatus.DISABLED:
      return "停用";
    case AlgorithmStatus.TESTING:
      return "试运行";
    default:
      return "开启";
  }
}

function getStatusTagType(
  status: AlgorithmStatus
): "primary" | "info" | "warning" | "success" | "danger" {
  switch (status) {
    case AlgorithmStatus.DISABLED:
      return "info";
    case AlgorithmStatus.TESTING:
      return "warning";
    default:
      return "primary";
  }
}

function getFrameStyle(frame: AlgorithmPreviewFrame) {
  return {
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
  };
}

function formatAccuracy(accuracy: number): string {
  return Number.isInteger(accuracy) ? String(accuracy) : accuracy.toFixed(1);
}

function fetchData(): void {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 180);
}

function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchData();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  queryParams.type = undefined;
  queryParams.status = undefined;
  queryParams.pageNum = 1;
  fetchData();
}

function handleCreateClick(): void {
  ElMessage.info("请接入新增算法表单");
}

function handleToggleStatus(item: AlgorithmRepositoryCard): void {
  item.status =
    item.status === AlgorithmStatus.ENABLED ? AlgorithmStatus.DISABLED : AlgorithmStatus.ENABLED;
  ElMessage.success(
    `已${item.status === AlgorithmStatus.ENABLED ? "开启" : "停用"}算法：${item.name}`
  );
}

function handleDetail(item: AlgorithmRepositoryCard): void {
  ElMessageBox.alert(
    `算法类型：${getTypeLabel(item.type)}<br/>当前状态：${getStatusLabel(item.status)}<br/>模型版本：v${item.version}<br/>识别精度：${formatAccuracy(item.accuracy)}%<br/>累计接入：${item.referenceCount}<br/>适用场景：${item.sceneTags.join("、")}<br/>说明：${item.description}`,
    `算法详情：${item.name}`,
    {
      confirmButtonText: "确定",
      dangerouslyUseHTMLString: true,
    }
  );
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.algorithm-card__preview {
  position: relative;
  overflow: hidden;
}

.algorithm-card__preview::before {
  position: absolute;
  inset: 0;
  content: "";
  background:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.08) 0,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px,
      transparent 34px
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08) 0,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px,
      transparent 34px
    );
  opacity: 0.2;
}

.algorithm-card__preview-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 22%, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(7, 19, 32, 0) 28%, rgba(7, 19, 32, 0.34) 100%);
}

.algorithm-card__frame {
  position: absolute;
  z-index: 1;
  background: rgba(88, 198, 255, 0.14);
  border: 2px solid rgba(88, 198, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.algorithm-card__frame--warning {
  background: rgba(255, 214, 102, 0.14);
  border-color: rgba(255, 214, 102, 0.92);
}

.algorithm-card__frame--success {
  background: rgba(103, 194, 58, 0.14);
  border-color: rgba(103, 194, 58, 0.92);
}
</style>
