<template>
  <div class="dashboard-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__inner">
            <div
              class="stat-card__icon"
              style="background: linear-gradient(135deg, #409eff, #79bbff)"
            >
              <el-icon :size="28"><Promotion /></el-icon>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">今日飞行任务</div>
              <div class="stat-card__value">
                {{ stats.todayFlightTasks }}
                <span class="stat-card__trend stat-card__trend--up">
                  <el-icon><Top /></el-icon>
                  12%
                </span>
              </div>
              <div class="stat-card__extra">较昨日</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__inner">
            <div
              class="stat-card__icon"
              style="background: linear-gradient(135deg, #67c23a, #95d475)"
            >
              <el-icon :size="28"><Position /></el-icon>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">无人机在线</div>
              <div class="stat-card__value">
                {{ stats.dronesOnline }}
                <span class="stat-card__sub">/ {{ stats.dronesTotal }}</span>
              </div>
              <div class="stat-card__extra">在线率 {{ droneOnlineRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__inner">
            <div
              class="stat-card__icon"
              style="background: linear-gradient(135deg, #e6a23c, #eebe77)"
            >
              <el-icon :size="28"><Bell /></el-icon>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">今日告警</div>
              <div class="stat-card__value">{{ stats.todayAlerts }}</div>
              <div class="stat-card__extra">
                <el-tag size="small" type="danger" effect="dark" class="mr-1">
                  紧急 {{ stats.alertUrgent }}
                </el-tag>
                <el-tag size="small" type="warning" effect="dark" class="mr-1">
                  重要 {{ stats.alertImportant }}
                </el-tag>
                <el-tag size="small" type="info" effect="dark">一般 {{ stats.alertNormal }}</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__inner">
            <div
              class="stat-card__icon"
              style="background: linear-gradient(135deg, #f56c6c, #f89898)"
            >
              <el-icon :size="28"><Tickets /></el-icon>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">工单待处理</div>
              <div class="stat-card__value">{{ stats.pendingWorkorders }}</div>
              <div class="stat-card__extra">请及时处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">本周飞行趋势</span>
              <el-radio-group v-model="trendRange" size="small">
                <el-radio-button label="近7天" :value="7" />
                <el-radio-button label="近30天" :value="30" />
              </el-radio-group>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-icon :size="48" color="#c0c4cc"><TrendCharts /></el-icon>
            <p>[ECharts 飞行趋势图 - 待集成]</p>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">告警分布</span>
              <el-tag size="small">本月</el-tag>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-icon :size="48" color="#c0c4cc"><PieChart /></el-icon>
            <p>[ECharts 告警分布饼图 - 待集成]</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部数据区域 -->
    <el-row :gutter="16" class="table-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">最近飞行记录</span>
              <el-button type="primary" link size="small">查看更多</el-button>
            </div>
          </template>
          <el-table :data="recentFlights" stripe style="width: 100%" size="small">
            <el-table-column
              prop="taskName"
              label="任务名称"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column prop="droneName" label="无人机" width="120" />
            <el-table-column prop="takeoffTime" label="起飞时间" width="160" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="flightStatusType(row.status)" size="small" effect="light">
                  {{ flightStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">最新告警</span>
              <el-button type="primary" link size="small">查看更多</el-button>
            </div>
          </template>
          <div class="alert-list">
            <div v-for="item in recentAlerts" :key="item.id" class="alert-list__item">
              <div class="alert-list__left">
                <el-tag
                  :type="alertLevelType(item.level)"
                  size="small"
                  effect="dark"
                  class="alert-list__badge"
                >
                  {{ alertLevelText(item.level) }}
                </el-tag>
                <div class="alert-list__info">
                  <span class="alert-list__title">{{ item.description }}</span>
                  <span class="alert-list__source">来源: {{ item.source }}</span>
                </div>
              </div>
              <span class="alert-list__time">{{ item.triggerTime }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Dashboard",
  inheritAttrs: false,
});

import { ref, computed } from "vue";
import {
  Promotion,
  Position,
  Bell,
  Tickets,
  Top,
  TrendCharts,
  PieChart,
} from "@element-plus/icons-vue";

const trendRange = ref(7);

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

const droneOnlineRate = computed(() => {
  if (!stats.value.dronesTotal) return 0;
  return Math.round((stats.value.dronesOnline / stats.value.dronesTotal) * 100);
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
  { id: 5, level: 3, description: "航线偏移预警", source: "DJI M300 #01", triggerTime: "08:32" },
]);

function flightStatusType(status: number) {
  const map: Record<number, string> = {
    0: "info",
    1: "primary",
    2: "success",
    3: "danger",
    4: "warning",
  };
  return (map[status] ?? "info") as "info" | "primary" | "success" | "danger" | "warning";
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

function alertLevelType(level: number) {
  const map: Record<number, string> = { 1: "danger", 2: "warning", 3: "info" };
  return (map[level] ?? "info") as "danger" | "warning" | "info";
}

function alertLevelText(level: number) {
  const map: Record<number, string> = { 1: "紧急", 2: "重要", 3: "一般" };
  return map[level] ?? "未知";
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 16px;
}

.stat-row {
  margin-bottom: 16px;

  .el-col {
    margin-bottom: 16px;

    @media (min-width: 1200px) {
      margin-bottom: 0;
    }
  }
}

.stat-card {
  .stat-card__inner {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .stat-card__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    color: #fff;
    border-radius: 12px;
  }

  .stat-card__content {
    flex: 1;
    min-width: 0;
  }

  .stat-card__label {
    margin-bottom: 4px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .stat-card__value {
    display: flex;
    gap: 6px;
    align-items: baseline;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  .stat-card__sub {
    font-size: 14px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }

  .stat-card__trend {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    font-size: 12px;
    font-weight: 500;

    &--up {
      color: var(--el-color-danger);
    }

    &--down {
      color: var(--el-color-success);
    }
  }

  .stat-card__extra {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.chart-row,
.table-row {
  margin-bottom: 16px;

  .el-col {
    margin-bottom: 16px;

    @media (min-width: 1200px) {
      margin-bottom: 0;
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 320px;
  color: var(--el-text-color-placeholder);

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.alert-list {
  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
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
    font-size: 14px;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  &__source {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__time {
    flex-shrink: 0;
    margin-left: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
