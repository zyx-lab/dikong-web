<template>
  <div class="app-container command-page">
    <section class="command-page__hero command-page__hero--compact">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">算法资源</p>
            <h2 class="command-page__title">算法仓库</h2>
            <p class="command-page__description">查看算法清单、版本和启用状态。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">算法清单</span>
            <span class="command-page__signal">版本状态</span>
            <span class="command-page__signal">分类管理</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">算法总量</div>
            <div class="command-page__metric-value">{{ total }}</div>
            <div class="command-page__metric-note">当前算法数量</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">目标识别</div>
            <div class="command-page__metric-value">{{ detectionCount }}</div>
            <div class="command-page__metric-note">目标识别类</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">行为分析</div>
            <div class="command-page__metric-value">{{ behaviorCount }}</div>
            <div class="command-page__metric-note">行为分析类</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">环境监测</div>
            <div class="command-page__metric-value">{{ environmentCount }}</div>
            <div class="command-page__metric-note">环境监测类</div>
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
          <Button size="sm" @click="handleQuery">查询</Button>
          <Button size="sm" variant="outline" @click="handleResetQuery">重置</Button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <Button size="sm" @click="handleCreateClick">新增算法</Button>
        </div>
        <div class="table-section__toolbar--right">
          <div class="table-toolbar-summary">
            <Badge variant="outline">共 {{ total }} 套算法</Badge>
            <Badge variant="secondary">开启 {{ enabledCount }} 套</Badge>
            <Badge variant="outline">目标识别 {{ detectionCount }} 套</Badge>
            <Badge variant="outline">环境监测 {{ environmentCount }} 套</Badge>
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
              <svg
                viewBox="0 0 220 148"
                class="route-card__svg algorithm-card__svg"
                aria-hidden="true"
              >
                <g v-if="item.previewKey === 'faceRecognition'">
                  <rect x="24" y="24" width="70" height="88" class="algorithm-card__scan-box" />
                  <rect
                    x="108"
                    y="18"
                    width="78"
                    height="96"
                    class="algorithm-card__scan-box algorithm-card__scan-box--success"
                  />
                  <circle cx="146" cy="56" r="18" class="algorithm-card__face-ring" />
                  <path d="M128 88c7-10 29-10 36 0" class="algorithm-card__face-line" />
                  <path d="M137 50h4M151 50h4" class="algorithm-card__face-line" />
                  <path d="M141 61c3 2 8 2 11 0" class="algorithm-card__face-line" />
                  <path
                    d="M30 100c18-6 30-18 34-36M178 40c-5 10-8 20-8 32"
                    class="algorithm-card__signal-line"
                  />
                </g>

                <g v-else-if="item.previewKey === 'crowdGathering'">
                  <circle cx="72" cy="44" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="92" cy="58" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="58" cy="70" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="88" cy="82" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="112" cy="42" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="126" cy="64" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="144" cy="52" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="132" cy="84" r="4" class="algorithm-card__crowd-dot" />
                  <circle cx="106" cy="74" r="22" class="algorithm-card__cluster-ring" />
                  <circle
                    cx="106"
                    cy="74"
                    r="34"
                    class="algorithm-card__cluster-ring algorithm-card__cluster-ring--outer"
                  />
                  <path d="M32 114h156" class="algorithm-card__ground-line" />
                </g>

                <g v-else-if="item.previewKey === 'nonMotorVehicle'">
                  <rect x="20" y="28" width="40" height="78" class="algorithm-card__scan-box" />
                  <rect x="96" y="40" width="44" height="60" class="algorithm-card__scan-box" />
                  <g class="algorithm-card__vehicle-outline">
                    <circle cx="42" cy="98" r="10" />
                    <circle cx="74" cy="98" r="10" />
                    <path d="M42 98l18-24h18l-8 24H42Z" />
                    <path d="M58 74l-8-18h18" />
                  </g>
                  <g
                    class="algorithm-card__vehicle-outline algorithm-card__vehicle-outline--secondary"
                  >
                    <circle cx="118" cy="96" r="9" />
                    <circle cx="146" cy="96" r="9" />
                    <path d="M118 96l16-20h14l-6 20h-24Z" />
                  </g>
                </g>

                <g v-else-if="item.previewKey === 'hazmatVehicle'">
                  <rect
                    x="28"
                    y="30"
                    width="110"
                    height="62"
                    class="algorithm-card__scan-box algorithm-card__scan-box--warning"
                  />
                  <g class="algorithm-card__truck-body">
                    <rect x="36" y="72" width="82" height="22" rx="6" />
                    <rect x="118" y="76" width="22" height="18" rx="4" />
                    <circle cx="58" cy="98" r="10" />
                    <circle cx="106" cy="98" r="10" />
                    <circle cx="132" cy="98" r="9" />
                  </g>
                  <polygon points="76,78 90,52 104,78" class="algorithm-card__hazard-sign" />
                  <path d="M90 60v8M90 73h0" class="algorithm-card__hazard-mark" />
                </g>

                <g v-else-if="item.previewKey === 'leftObject'">
                  <path
                    d="M18 102h184"
                    class="algorithm-card__ground-line algorithm-card__ground-line--warm"
                  />
                  <rect
                    x="28"
                    y="86"
                    width="20"
                    height="30"
                    class="algorithm-card__bag algorithm-card__bag--warning"
                  />
                  <rect
                    x="68"
                    y="96"
                    width="22"
                    height="24"
                    class="algorithm-card__bag algorithm-card__bag--warning"
                  />
                  <rect
                    x="108"
                    y="92"
                    width="26"
                    height="28"
                    class="algorithm-card__bag algorithm-card__bag--warning"
                  />
                  <path
                    d="M34 86c0-8 8-8 8 0M76 96c0-6 6-6 6 0M116 92c0-7 8-7 8 0"
                    class="algorithm-card__bag-handle"
                  />
                  <circle
                    cx="38"
                    cy="101"
                    r="22"
                    class="algorithm-card__cluster-ring algorithm-card__cluster-ring--warning"
                  />
                </g>

                <g v-else-if="item.previewKey === 'intrusion'">
                  <path d="M36 18v104M58 18v104M80 18v104" class="algorithm-card__fence-line" />
                  <path
                    d="M118 42v40M130 32c0 6-5 11-11 11s-11-5-11-11 5-11 11-11 11 5 11 11Z"
                    class="algorithm-card__person-outline"
                  />
                  <path
                    d="M120 84l18 20M120 84l-16 20M120 64l18-8M120 64l-18 8"
                    class="algorithm-card__person-outline"
                  />
                  <path d="M94 76l24 0" class="algorithm-card__intrusion-arrow" />
                  <path d="M110 64l16 12-16 12" class="algorithm-card__intrusion-arrow" />
                  <rect x="92" y="22" width="58" height="90" class="algorithm-card__scan-box" />
                </g>

                <g v-else-if="item.previewKey === 'loitering'">
                  <rect
                    x="58"
                    y="32"
                    width="84"
                    height="64"
                    class="algorithm-card__scan-box algorithm-card__scan-box--success"
                  />
                  <circle cx="100" cy="64" r="22" class="algorithm-card__loiter-ring" />
                  <circle
                    cx="132"
                    cy="52"
                    r="14"
                    class="algorithm-card__loiter-ring algorithm-card__loiter-ring--secondary"
                  />
                  <path d="M112 86c16 12 34 10 44-4" class="algorithm-card__loiter-path" />
                  <circle cx="100" cy="64" r="3" class="algorithm-card__crowd-dot" />
                  <circle
                    cx="154"
                    cy="82"
                    r="4"
                    class="algorithm-card__crowd-dot algorithm-card__crowd-dot--warning"
                  />
                </g>

                <g v-else-if="item.previewKey === 'crossBorder'">
                  <rect
                    x="96"
                    y="18"
                    width="68"
                    height="88"
                    class="algorithm-card__scan-box algorithm-card__scan-box--warning"
                  />
                  <path d="M84 26v86" class="algorithm-card__boundary-line" />
                  <path d="M48 86l26 0" class="algorithm-card__intrusion-arrow" />
                  <path d="M64 74l18 12-18 12" class="algorithm-card__intrusion-arrow" />
                  <polygon points="136,84 120,56 152,56" class="algorithm-card__hazard-sign" />
                  <path d="M136 64v8M136 76h0" class="algorithm-card__hazard-mark" />
                </g>
              </svg>
            </div>

            <div class="route-card__body">
              <div class="route-card__body-head">
                <div>
                  <h3>{{ item.name }}</h3>
                  <p>算法类型：{{ getTypeLabel(item.type) }}</p>
                </div>
                <Badge class="route-type-tag" :variant="getStatusBadgeVariant(item.status)">
                  {{ getStatusLabel(item.status) }}
                </Badge>
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
                <Button variant="ghost" size="sm" @click="handleDetail(item)">详情</Button>
                <Button variant="ghost" size="sm" @click="handleToggleStatus(item)">
                  {{ item.status === AlgorithmStatus.ENABLED ? "停用" : "开启" }}
                </Button>
              </div>
            </div>
          </article>
        </section>

        <div v-else class="table-empty-state">
          <el-empty :description="hasActiveFilters ? '当前筛选条件下暂无算法' : '暂无算法数据'" />
          <div v-if="hasActiveFilters" class="table-empty-state__actions">
            <Button variant="ghost" size="sm" @click="handleResetQuery">清空筛选</Button>
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
type AlgorithmPreviewKey =
  | "faceRecognition"
  | "crowdGathering"
  | "nonMotorVehicle"
  | "hazmatVehicle"
  | "leftObject"
  | "intrusion"
  | "loitering"
  | "crossBorder";

interface AlgorithmRepositoryCard extends AlgorithmInfo {
  status: AlgorithmStatus;
  updatedAt: string;
  referenceCount: number;
  sceneTags: string[];
  coverGradient: string;
  previewKey: AlgorithmPreviewKey;
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
      description: "用于人员识别和通行核验。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "2.5.1",
      accuracy: 98.6,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-12 14:30",
      referenceCount: 256,
      sceneTags: ["智慧城市", "智慧城管", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(11, 28, 55, 0.98) 0%, rgba(33, 78, 128, 0.9) 48%, rgba(92, 205, 232, 0.82) 100%)",
      previewKey: "faceRecognition",
    },
    {
      id: 2,
      name: "人员异常聚集",
      description: "用于人群聚集监测。",
      type: AlgorithmType.BEHAVIOR_ANALYSIS,
      version: "1.8.4",
      accuracy: 95.2,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-11 09:45",
      referenceCount: 43,
      sceneTags: ["智慧城市", "智慧城管", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(85, 88, 92, 0.94) 0%, rgba(104, 120, 136, 0.9) 42%, rgba(128, 196, 216, 0.76) 100%)",
      previewKey: "crowdGathering",
    },
    {
      id: 3,
      name: "非机动车识别",
      description: "用于非机动车识别和轨迹检索。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "3.0.2",
      accuracy: 96.4,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-10 18:20",
      referenceCount: 256,
      sceneTags: ["智慧城市", "智慧城管", "智慧交通"],
      coverGradient:
        "linear-gradient(135deg, rgba(47, 53, 63, 0.96) 0%, rgba(76, 89, 109, 0.9) 48%, rgba(73, 170, 226, 0.8) 100%)",
      previewKey: "nonMotorVehicle",
    },
    {
      id: 4,
      name: "危化品车辆识别",
      description: "用于危化车辆识别。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "2.1.0",
      accuracy: 97.3,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-09 16:10",
      referenceCount: 76,
      sceneTags: ["智慧城市", "智慧城管", "智慧交通"],
      coverGradient:
        "linear-gradient(135deg, rgba(33, 49, 73, 0.96) 0%, rgba(64, 89, 118, 0.9) 44%, rgba(110, 181, 221, 0.76) 100%)",
      previewKey: "hazmatVehicle",
    },
    {
      id: 5,
      name: "遗留物品检测",
      description: "用于遗留物品检测。",
      type: AlgorithmType.OBJECT_DETECTION,
      version: "1.6.9",
      accuracy: 94.7,
      status: AlgorithmStatus.TESTING,
      updatedAt: "2026-03-08 11:26",
      referenceCount: 45,
      sceneTags: ["智慧楼宇", "智慧校园", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(79, 83, 58, 0.96) 0%, rgba(123, 117, 80, 0.9) 40%, rgba(197, 162, 92, 0.78) 100%)",
      previewKey: "leftObject",
    },
    {
      id: 6,
      name: "人员闯入",
      description: "用于入侵识别。",
      type: AlgorithmType.BEHAVIOR_ANALYSIS,
      version: "2.2.7",
      accuracy: 96.1,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-07 15:08",
      referenceCount: 112,
      sceneTags: ["智慧城市", "智慧管廊", "智慧园区"],
      coverGradient:
        "linear-gradient(135deg, rgba(47, 53, 60, 0.96) 0%, rgba(80, 92, 106, 0.9) 42%, rgba(121, 178, 196, 0.74) 100%)",
      previewKey: "intrusion",
    },
    {
      id: 7,
      name: "徘徊识别",
      description: "用于徘徊识别。",
      type: AlgorithmType.BEHAVIOR_ANALYSIS,
      version: "1.3.6",
      accuracy: 92.8,
      status: AlgorithmStatus.DISABLED,
      updatedAt: "2026-03-06 13:42",
      referenceCount: 23,
      sceneTags: ["智慧楼宇", "智慧园区", "智慧社区"],
      coverGradient:
        "linear-gradient(135deg, rgba(57, 57, 55, 0.96) 0%, rgba(93, 85, 78, 0.9) 40%, rgba(147, 115, 88, 0.74) 100%)",
      previewKey: "loitering",
    },
    {
      id: 8,
      name: "越界检测",
      description: "用于越界预警。",
      type: AlgorithmType.ENVIRONMENT_MONITOR,
      version: "2.0.5",
      accuracy: 97.8,
      status: AlgorithmStatus.ENABLED,
      updatedAt: "2026-03-05 10:18",
      referenceCount: 89,
      sceneTags: ["智慧园区", "智慧工地", "智慧安监"],
      coverGradient:
        "linear-gradient(135deg, rgba(55, 60, 69, 0.96) 0%, rgba(86, 94, 102, 0.9) 48%, rgba(122, 168, 190, 0.76) 100%)",
      previewKey: "crossBorder",
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

function getStatusBadgeVariant(status: AlgorithmStatus) {
  switch (status) {
    case AlgorithmStatus.DISABLED:
      return "outline";
    case AlgorithmStatus.TESTING:
      return "secondary";
    default:
      return "secondary";
  }
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

.algorithm-card__svg {
  position: relative;
  z-index: 1;
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
  z-index: 0;
  background:
    radial-gradient(circle at 20% 22%, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(7, 19, 32, 0) 28%, rgba(7, 19, 32, 0.34) 100%);
}

.algorithm-card__scan-box,
.algorithm-card__face-ring,
.algorithm-card__face-line,
.algorithm-card__signal-line,
.algorithm-card__cluster-ring,
.algorithm-card__ground-line,
.algorithm-card__vehicle-outline,
.algorithm-card__hazard-mark,
.algorithm-card__fence-line,
.algorithm-card__person-outline,
.algorithm-card__intrusion-arrow,
.algorithm-card__loiter-ring,
.algorithm-card__loiter-path,
.algorithm-card__boundary-line,
.algorithm-card__bag-handle {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.algorithm-card__scan-box {
  fill: rgba(100, 196, 255, 0.08);
  stroke: rgba(100, 196, 255, 0.95);
  stroke-width: 2;
}

.algorithm-card__scan-box--success {
  fill: rgba(131, 255, 120, 0.08);
  stroke: rgba(131, 255, 120, 0.96);
}

.algorithm-card__scan-box--warning {
  fill: rgba(255, 216, 89, 0.08);
  stroke: rgba(255, 216, 89, 0.96);
}

.algorithm-card__face-ring {
  stroke: rgba(160, 228, 255, 0.95);
  stroke-width: 1.8;
}

.algorithm-card__face-line {
  stroke: rgba(188, 234, 255, 0.96);
  stroke-width: 1.8;
}

.algorithm-card__signal-line {
  stroke: rgba(88, 198, 255, 0.45);
  stroke-width: 1.6;
  stroke-dasharray: 3 5;
}

.algorithm-card__crowd-dot {
  fill: rgba(208, 240, 255, 0.95);
}

.algorithm-card__crowd-dot--warning {
  fill: rgba(255, 196, 87, 0.96);
}

.algorithm-card__cluster-ring {
  stroke: rgba(95, 203, 255, 0.96);
  stroke-width: 2;
}

.algorithm-card__cluster-ring--outer {
  stroke: rgba(95, 203, 255, 0.38);
  stroke-width: 2;
  stroke-dasharray: 4 5;
}

.algorithm-card__cluster-ring--warning {
  stroke: rgba(255, 216, 89, 0.56);
}

.algorithm-card__ground-line {
  stroke: rgba(190, 216, 236, 0.52);
  stroke-width: 2;
}

.algorithm-card__ground-line--warm {
  stroke: rgba(255, 219, 122, 0.4);
}

.algorithm-card__vehicle-outline {
  fill: rgba(118, 205, 255, 0.12);
  stroke: rgba(118, 205, 255, 0.95);
  stroke-width: 2;
}

.algorithm-card__vehicle-outline--secondary {
  fill: rgba(118, 205, 255, 0.08);
  stroke-width: 1.8;
}

.algorithm-card__truck-body {
  fill: rgba(108, 197, 255, 0.12);
  stroke: rgba(108, 197, 255, 0.94);
  stroke-width: 2;
}

.algorithm-card__hazard-sign {
  fill: rgba(255, 211, 70, 0.18);
  stroke: rgba(255, 223, 110, 0.96);
  stroke-width: 2;
  stroke-linejoin: round;
}

.algorithm-card__hazard-mark {
  stroke: rgba(255, 223, 110, 0.96);
  stroke-width: 2;
}

.algorithm-card__bag {
  fill: rgba(255, 214, 102, 0.12);
  stroke: rgba(255, 223, 110, 0.96);
  stroke-width: 1.8;
}

.algorithm-card__bag--warning {
  filter: drop-shadow(0 0 8px rgba(255, 216, 89, 0.12));
}

.algorithm-card__bag-handle {
  stroke: rgba(255, 223, 110, 0.92);
  stroke-width: 1.5;
}

.algorithm-card__fence-line {
  stroke: rgba(168, 210, 234, 0.48);
  stroke-width: 3;
}

.algorithm-card__person-outline {
  stroke: rgba(205, 240, 255, 0.95);
  stroke-width: 2;
}

.algorithm-card__intrusion-arrow {
  stroke: rgba(255, 196, 87, 0.96);
  stroke-width: 2.4;
}

.algorithm-card__loiter-ring {
  fill: rgba(102, 175, 255, 0.08);
  stroke: rgba(102, 175, 255, 0.96);
  stroke-width: 2.4;
}

.algorithm-card__loiter-ring--secondary {
  stroke: rgba(102, 175, 255, 0.48);
  stroke-width: 2.4;
  stroke-dasharray: 4 5;
}

.algorithm-card__loiter-path {
  stroke: rgba(255, 214, 102, 0.9);
  stroke-width: 2;
  stroke-dasharray: 4 5;
}

.algorithm-card__boundary-line {
  stroke: rgba(255, 214, 102, 0.65);
  stroke-width: 2;
  stroke-dasharray: 5 6;
}
</style>
