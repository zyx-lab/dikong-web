<template>
  <div class="dashboard-container command-page command-dashboard">
    <section class="command-page__hero command-dashboard__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">首页总览</p>
            <h2 class="command-page__title">低空巡检值守总览</h2>
            <p class="command-page__description">查看今日飞行任务、预警、设备和工单情况。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">飞行任务</span>
            <span class="command-page__signal">预警处置</span>
            <span class="command-page__signal">资源保障</span>
          </div>
        </div>
        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">今日飞行任务</div>
            <div class="command-page__metric-value">
              {{ stats.todayFlightTasks }}
              <span class="command-page__metric-sub">+12%</span>
            </div>
            <div class="command-page__metric-note">较昨日增加 12%</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">无人机在线</div>
            <div class="command-page__metric-value">
              {{ stats.dronesOnline }}
              <span class="command-page__metric-sub">/ {{ stats.dronesTotal }}</span>
            </div>
            <div class="command-page__metric-note">在线率 {{ droneOnlineRate }}%</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">高优先级告警</div>
            <div class="command-page__metric-value">{{ highPriorityAlertCount }}</div>
            <div class="command-page__metric-note">
              紧急 {{ stats.alertUrgent }}，重要 {{ stats.alertImportant }}
            </div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">工单待处理</div>
            <div class="command-page__metric-value">{{ stats.pendingWorkorders }}</div>
            <div class="command-page__metric-note">待处理工单</div>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-overview-grid">
      <InfoPanel title="值守总览">
        <template #header-extra>
          <Button
            variant="ghost"
            size="sm"
            class="dashboard-panel-action"
            @click="goTo('/flight/task')"
          >
            进入任务管理
            <el-icon><ArrowRight /></el-icon>
          </Button>
        </template>

        <div class="dashboard-overview">
          <div class="dashboard-overview__lead">
            <div class="dashboard-overview__badge">今日概况</div>
            <h3 class="dashboard-overview__title">今日低空巡检运行正常</h3>
            <p class="dashboard-overview__description">
              当前重点区域包括港区、围栏和园区。可在首页快速查看任务、设备和预警情况。
            </p>
          </div>

          <div class="dashboard-overview__blocks">
            <article
              v-for="item in overviewBlocks"
              :key="item.label"
              :class="['dashboard-overview__block', `dashboard-overview__block--${item.tone}`]"
            >
              <div class="dashboard-overview__block-label">{{ item.label }}</div>
              <div class="dashboard-overview__block-value">{{ item.value }}</div>
              <div class="dashboard-overview__block-note">{{ item.note }}</div>
            </article>
          </div>

          <div class="dashboard-overview__actions">
            <button
              v-for="item in quickModules"
              :key="item.path"
              type="button"
              class="dashboard-shortcut"
              @click="goTo(item.path)"
            >
              <div class="dashboard-shortcut__body">
                <span class="dashboard-shortcut__title">{{ item.title }}</span>
                <span class="dashboard-shortcut__description">{{ item.description }}</span>
              </div>
              <el-icon class="dashboard-shortcut__icon"><ArrowRight /></el-icon>
            </button>
          </div>
        </div>
      </InfoPanel>

      <InfoPanel title="当前指挥重点">
        <div class="dashboard-focus-list">
          <article v-for="item in focusItems" :key="item.id" class="dashboard-focus-list__item">
            <div class="dashboard-focus-list__meta">
              <Badge :variant="alertBadgeVariant(item.level)">
                {{ alertLevelText(item.level) }}
              </Badge>
              <span class="dashboard-focus-list__time">{{ item.triggerTime }}</span>
            </div>
            <h3 class="dashboard-focus-list__title">{{ item.description }}</h3>
            <p class="dashboard-focus-list__note">来源：{{ item.source }}</p>
          </article>
        </div>
      </InfoPanel>
    </section>

    <section class="dashboard-chart-grid">
      <InfoPanel title="本周飞行趋势">
        <template #header-extra>
          <div class="dashboard-range-switch">
            <Button
              v-for="option in trendRangeOptions"
              :key="option.value"
              size="sm"
              :variant="trendRange === option.value ? 'default' : 'outline'"
              @click="trendRange = option.value"
            >
              {{ option.label }}
            </Button>
          </div>
        </template>

        <div class="dashboard-chart-placeholder">
          <div class="dashboard-chart-placeholder__icon">
            <el-icon :size="42"><TrendCharts /></el-icon>
          </div>
          <div class="dashboard-chart-placeholder__title">飞行趋势图待接入</div>
          <p class="dashboard-chart-placeholder__description">
            图表接入后显示飞行次数、时长和预警变化。
          </p>
          <div class="dashboard-chart-placeholder__meta">
            <span>执行中 {{ executingFlightCount }} 架次</span>
            <span>已完成 {{ completedFlightCount }} 架次</span>
            <span>趋势窗口 {{ trendRange }} 天</span>
          </div>
        </div>
      </InfoPanel>

      <InfoPanel title="告警分布">
        <template #header-extra>
          <Badge variant="outline">本月</Badge>
        </template>

        <div class="dashboard-chart-placeholder dashboard-chart-placeholder--compact">
          <div
            class="dashboard-chart-placeholder__icon dashboard-chart-placeholder__icon--secondary"
          >
            <el-icon :size="42"><PieChart /></el-icon>
          </div>
          <div class="dashboard-chart-placeholder__title">告警分布图待接入</div>
          <p class="dashboard-chart-placeholder__description">图表接入后显示区域和等级分布。</p>
          <div class="dashboard-chart-placeholder__meta">
            <span>今日告警 {{ stats.todayAlerts }}</span>
            <span>紧急 {{ stats.alertUrgent }}</span>
            <span>一般 {{ stats.alertNormal }}</span>
          </div>
        </div>
      </InfoPanel>
    </section>

    <section class="dashboard-feed-grid">
      <InfoPanel title="最近飞行记录">
        <template #header-extra>
          <Button
            variant="ghost"
            size="sm"
            class="dashboard-panel-action"
            @click="goTo('/flight/record')"
          >
            查看更多
          </Button>
        </template>

        <div class="dashboard-record-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead class="w-32">无人机</TableHead>
                <TableHead class="w-44">起飞时间</TableHead>
                <TableHead class="w-28 text-right">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in recentFlights" :key="`${row.taskName}-${row.takeoffTime}`">
                <TableCell class="max-w-48">
                  <div class="dashboard-record-table__title">{{ row.taskName }}</div>
                </TableCell>
                <TableCell>{{ row.droneName }}</TableCell>
                <TableCell>{{ row.takeoffTime }}</TableCell>
                <TableCell class="text-right">
                  <Badge :variant="flightStatusBadgeVariant(row.status)">
                    {{ flightStatusText(row.status) }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </InfoPanel>

      <InfoPanel title="最新告警">
        <template #header-extra>
          <Button
            variant="ghost"
            size="sm"
            class="dashboard-panel-action"
            @click="goTo('/alert/center')"
          >
            查看更多
          </Button>
        </template>

        <div class="alert-list">
          <div v-for="item in recentAlerts" :key="item.id" class="alert-list__item">
            <div class="alert-list__left">
              <Badge :variant="alertBadgeVariant(item.level)" class="alert-list__badge">
                {{ alertLevelText(item.level) }}
              </Badge>
              <div class="alert-list__info">
                <span class="alert-list__title">{{ item.description }}</span>
                <span class="alert-list__source">来源：{{ item.source }}</span>
              </div>
            </div>
            <span class="alert-list__time">{{ item.triggerTime }}</span>
          </div>
        </div>
      </InfoPanel>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowRight, PieChart, TrendCharts } from "@element-plus/icons-vue";
import InfoPanel from "@/components/InfoPanel.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

defineOptions({
  name: "Dashboard",
  inheritAttrs: false,
});

const router = useRouter();
const trendRange = ref(7);
const trendRangeOptions = [
  { label: "近7天", value: 7 },
  { label: "近30天", value: 30 },
] as const;

const stats = ref({
  todayFlightTasks: 24,
  dronesOnline: 18,
  dronesTotal: 25,
  todayAlerts: 7,
  alertUrgent: 1,
  alertImportant: 3,
  alertNormal: 3,
  pendingWorkorders: 5,
});

const recentFlights = ref([
  {
    taskName: "高栏港码头日常巡检",
    droneName: "DJI M30T #03",
    takeoffTime: "2026-03-09 09:15:00",
    status: 2,
  },
  {
    taskName: "化工园区管道检测",
    droneName: "DJI M300 #01",
    takeoffTime: "2026-03-09 08:30:00",
    status: 1,
  },
  {
    taskName: "港区围栏安全巡查",
    droneName: "DJI M30T #05",
    takeoffTime: "2026-03-09 07:45:00",
    status: 2,
  },
  {
    taskName: "油气储罐红外巡检",
    droneName: "DJI M350 #02",
    takeoffTime: "2026-03-08 16:00:00",
    status: 2,
  },
  {
    taskName: "航道水域监测飞行",
    droneName: "DJI M30T #04",
    takeoffTime: "2026-03-08 14:30:00",
    status: 3,
  },
]);

const recentAlerts = ref([
  {
    id: 1,
    level: 1,
    description: "储罐区温度异常升高",
    source: "红外相机 IR-02",
    triggerTime: "10:23",
  },
  {
    id: 2,
    level: 2,
    description: "围栏区域入侵检测",
    source: "可见光相机 VIS-05",
    triggerTime: "09:47",
  },
  {
    id: 3,
    level: 3,
    description: "无人机电量低于20%",
    source: "DJI M30T #03",
    triggerTime: "09:18",
  },
  {
    id: 4,
    level: 2,
    description: "管道疑似泄漏点",
    source: "激光雷达 LID-01",
    triggerTime: "08:55",
  },
  {
    id: 5,
    level: 3,
    description: "航线偏移预警",
    source: "DJI M300 #01",
    triggerTime: "08:32",
  },
]);

const quickModules = [
  {
    title: "任务管理",
    description: "查看任务计划和执行情况",
    path: "/flight/task",
  },
  {
    title: "飞行记录",
    description: "查看飞行记录和现场资料",
    path: "/flight/record",
  },
  {
    title: "无人机管理",
    description: "查看无人机状态和维护情况",
    path: "/resource/drone",
  },
  {
    title: "飞手管理",
    description: "查看飞手排班和证件情况",
    path: "/resource/pilot",
  },
] as const;

const droneOnlineRate = computed(() => {
  if (!stats.value.dronesTotal) return 0;
  return Math.round((stats.value.dronesOnline / stats.value.dronesTotal) * 100);
});

const highPriorityAlertCount = computed(() => stats.value.alertUrgent + stats.value.alertImportant);

const executingFlightCount = computed(
  () => recentFlights.value.filter((item) => item.status === 1).length
);

const completedFlightCount = computed(
  () => recentFlights.value.filter((item) => item.status === 2).length
);

const overviewBlocks = computed(() => [
  {
    label: "飞行任务窗口",
    value: `${stats.value.todayFlightTasks}`,
    note: `其中 ${executingFlightCount.value} 个任务正在执行`,
    tone: "accent",
  },
  {
    label: "机队在线率",
    value: `${droneOnlineRate.value}%`,
    note: `${stats.value.dronesOnline}/${stats.value.dronesTotal} 架无人机在线`,
    tone: "normal",
  },
  {
    label: "高优先级告警",
    value: `${highPriorityAlertCount.value}`,
    note: "需要优先处理",
    tone: "danger",
  },
  {
    label: "工单待处理",
    value: `${stats.value.pendingWorkorders}`,
    note: "待安排处理",
    tone: "warning",
  },
  {
    label: "已完成架次",
    value: `${completedFlightCount.value}`,
    note: "已完成飞行任务",
    tone: "normal",
  },
  {
    label: "一般告警",
    value: `${stats.value.alertNormal}`,
    note: "可按批次复核",
    tone: "normal",
  },
]);

const focusItems = computed(() => recentAlerts.value.slice(0, 4));

function goTo(path: string): void {
  const resolved = router.resolve(path);
  if (resolved.matched.length === 0) {
    ElMessage.info("页面暂未开放");
    return;
  }

  router.push(path);
}

function flightStatusBadgeVariant(status: number) {
  const map: Record<number, "outline" | "secondary" | "destructive"> = {
    0: "outline",
    1: "secondary",
    2: "outline",
    3: "destructive",
    4: "secondary",
  };
  return map[status] ?? "outline";
}

function flightStatusText(status: number) {
  const map: Record<number, string> = {
    0: "待执行",
    1: "执行中",
    2: "已完成",
    3: "失败",
    4: "已取消",
  };
  return map[status] ?? "未知";
}

function alertBadgeVariant(level: number) {
  const map: Record<number, "destructive" | "secondary" | "outline"> = {
    1: "destructive",
    2: "secondary",
    3: "outline",
  };
  return map[level] ?? "outline";
}

function alertLevelText(level: number) {
  const map: Record<number, string> = { 1: "紧急", 2: "重要", 3: "一般" };
  return map[level] ?? "未知";
}
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 16px;
}

.command-dashboard__hero {
  min-height: 268px;
}

.dashboard-overview-grid,
.dashboard-chart-grid,
.dashboard-feed-grid {
  display: grid;
  gap: 16px;
}

.dashboard-overview-grid {
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
}

.dashboard-chart-grid {
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
}

.dashboard-feed-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.command-dashboard :deep(.info-panel) {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(9, 9, 11, 0.05);
}

.command-dashboard :deep(.info-panel__card-header) {
  padding: 18px 20px 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--muted) 42%, transparent),
    transparent
  );
  border-bottom: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
}

.command-dashboard :deep(.info-panel__card-body) {
  padding: 18px 20px 20px;
}

.command-dashboard :deep(.info-panel__title) {
  font-family: var(--command-font-display);
  font-size: 1.0625rem;
  font-weight: 650;
  letter-spacing: 0.03em;
}

.dashboard-overview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dashboard-panel-action {
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.dashboard-range-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dashboard-record-table {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.dashboard-record-table__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  white-space: nowrap;
}

.dashboard-overview__lead {
  padding: 18px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--muted) 60%, transparent),
    transparent
  );
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.dashboard-overview__badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  margin-bottom: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background: color-mix(in srgb, var(--secondary) 92%, transparent);
  border-radius: 999px;
}

.dashboard-overview__title {
  margin: 0;
  font-family: var(--command-font-display);
  font-size: 1.625rem;
  font-weight: 700;
  line-height: 1.12;
  color: var(--el-text-color-primary);
  letter-spacing: -0.03em;
}

.dashboard-overview__description {
  max-width: 66ch;
  margin: 10px 0 0;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--el-text-color-secondary);
}

.dashboard-overview__blocks {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-overview__block {
  padding: 16px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--muted) 50%, transparent),
    transparent
  );
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 16px;

  &--accent {
    border-color: color-mix(in srgb, var(--chart-3) 38%, transparent);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--chart-3) 14%, transparent);
  }

  &--warning {
    border-color: color-mix(in srgb, var(--chart-5) 34%, transparent);
  }

  &--danger {
    border-color: color-mix(in srgb, var(--destructive) 30%, transparent);
  }
}

.dashboard-overview__block-label {
  margin-bottom: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.06em;
}

.dashboard-overview__block-value {
  font-family: var(--command-font-display);
  font-size: clamp(1.85rem, 2vw, 2.25rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--el-text-color-primary);
  letter-spacing: -0.04em;
}

.dashboard-overview__block-note {
  margin-top: 8px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dashboard-overview__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-shortcut {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 15px 16px;
  text-align: left;
  cursor: pointer;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 16px;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--ring) 32%, transparent);
    box-shadow: 0 10px 24px rgba(9, 9, 11, 0.06);
    transform: translateY(-2px);
  }
}

.dashboard-shortcut__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dashboard-shortcut__title {
  font-size: 0.9375rem;
  font-weight: 650;
  line-height: 1.45;
  color: var(--el-text-color-primary);
  letter-spacing: 0.02em;
}

.dashboard-shortcut__description {
  font-size: 0.8125rem;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.dashboard-shortcut__icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--muted-foreground);
}

.dashboard-focus-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-focus-list__item {
  padding: 15px 16px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--muted) 48%, transparent),
    transparent
  );
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 16px;
}

.dashboard-focus-list__meta {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dashboard-focus-list__time {
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.03em;
}

.dashboard-focus-list__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  letter-spacing: 0.01em;
}

.dashboard-focus-list__note {
  margin: 8px 0 0;
  font-size: 0.8125rem;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.dashboard-chart-placeholder {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  justify-content: center;
  min-height: 320px;
  padding: 28px;
  color: var(--el-text-color-secondary);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--muted) 54%, transparent), transparent 52%),
    var(--el-bg-color-overlay);
  border: 1px dashed color-mix(in srgb, var(--border) 86%, transparent);
  border-radius: 18px;
}

.dashboard-chart-placeholder__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  color: var(--foreground);
  background: color-mix(in srgb, var(--secondary) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 20px;
}

.dashboard-chart-placeholder__icon--secondary {
  background: color-mix(in srgb, var(--muted) 70%, transparent);
}

.dashboard-chart-placeholder--compact {
  min-height: 320px;
}

.dashboard-chart-placeholder__title {
  font-family: var(--command-font-display);
  font-size: 1.1875rem;
  font-weight: 650;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  letter-spacing: 0.01em;
}

.dashboard-chart-placeholder__description {
  max-width: 520px;
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.75;
}

.dashboard-chart-placeholder__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  span {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 10px;
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.03em;
    background: color-mix(in srgb, var(--secondary) 88%, transparent);
    border-radius: 999px;
  }
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: color-mix(in srgb, var(--card) 94%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
    border-radius: 16px;
  }

  &__left {
    display: flex;
    flex: 1;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  &__badge {
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.55;
    color: var(--el-text-color-primary);
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  &__source {
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--el-text-color-placeholder);
  }

  &__time {
    flex-shrink: 0;
    margin-left: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.03em;
  }
}

@media (max-width: 1200px) {
  .dashboard-overview-grid,
  .dashboard-chart-grid,
  .dashboard-feed-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-overview__blocks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 14px;
  }

  .dashboard-overview__blocks,
  .dashboard-overview__actions {
    grid-template-columns: 1fr;
  }

  .dashboard-chart-placeholder {
    min-height: 280px;
    padding: 22px 18px;
  }

  .dashboard-overview__title {
    font-size: 1.375rem;
  }

  .alert-list__item,
  .dashboard-focus-list__meta {
    align-items: flex-start;
  }

  .alert-list__item {
    flex-direction: column;
    gap: 8px;
  }

  .alert-list__time {
    margin-left: 0;
  }
}
</style>
