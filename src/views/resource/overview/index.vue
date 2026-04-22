<template>
  <div class="app-container command-page resource-overview-page">
    <section class="command-page__hero command-page__hero--compact resource-overview-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">资源总览</p>
            <h2 class="command-page__title">资源中心</h2>
            <p class="command-page__description">查看无人机、机场、负载和飞手的当前状态。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">无人机</span>
            <span class="command-page__signal">机场</span>
            <span class="command-page__signal">人员</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">资源模块</div>
            <div class="command-page__metric-value">{{ moduleCards.length }}</div>
            <div class="command-page__metric-note">无人机、机场、负载、飞手</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">可立即调度无人机</div>
            <div class="command-page__metric-value">
              {{ summary.readyDrones }}
              <span class="command-page__metric-sub">/ {{ summary.totalDrones }}</span>
            </div>
            <div class="command-page__metric-note">可直接用于任务执行</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">保障提醒</div>
            <div class="command-page__metric-value">{{ riskItems.length }}</div>
            <div class="command-page__metric-note">需要处理的资源问题</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">今日值守飞手</div>
            <div class="command-page__metric-value">{{ summary.onDutyPilots }}</div>
            <div class="command-page__metric-note">今日在岗飞手</div>
          </div>
        </div>
      </div>
    </section>

    <section class="resource-overview-grid">
      <Card
        class="resource-overview-card resource-overview-card--modules border-border/70 shadow-none"
      >
        <CardHeader class="resource-overview-card__header">
          <div>
            <CardTitle>模块概览</CardTitle>
            <CardDescription>查看各模块当前状态。</CardDescription>
          </div>
          <Badge variant="outline">总览视图</Badge>
        </CardHeader>
        <CardContent class="resource-overview-card__content">
          <div class="resource-module-grid">
            <button
              v-for="item in moduleCards"
              :key="item.path"
              type="button"
              class="resource-module-card"
              @click="goTo(item.path)"
            >
              <div class="resource-module-card__top">
                <Badge :variant="item.badgeVariant">{{ item.badge }}</Badge>
                <span class="resource-module-card__meta">{{ item.meta }}</span>
              </div>
              <div class="resource-module-card__body">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="resource-module-card__stats">
                <div>
                  <span>核心指标</span>
                  <strong>{{ item.primaryValue }}</strong>
                </div>
                <div>
                  <span>辅助指标</span>
                  <strong>{{ item.secondaryValue }}</strong>
                </div>
              </div>
              <div class="resource-module-card__footer">
                <span>进入模块</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card class="resource-overview-card border-border/70 shadow-none">
        <CardHeader class="resource-overview-card__header">
          <div>
            <CardTitle>今日资源重点</CardTitle>
            <CardDescription>查看影响任务执行的资源问题。</CardDescription>
          </div>
          <Badge variant="secondary">处理中</Badge>
        </CardHeader>
        <CardContent class="resource-overview-card__content">
          <div class="resource-risk-list">
            <article v-for="item in riskItems" :key="item.title" class="resource-risk-item">
              <div class="resource-risk-item__meta">
                <Badge :variant="item.variant">{{ item.level }}</Badge>
                <span>{{ item.owner }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="resource-summary-grid">
      <Card class="resource-overview-card border-border/70 shadow-none">
        <CardHeader class="resource-overview-card__header">
          <div>
            <CardTitle>资源安排</CardTitle>
            <CardDescription>按准备、执行、收尾查看资源。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="resource-overview-card__content">
          <div class="resource-pillar-grid">
            <article v-for="item in coordinationBlocks" :key="item.title" class="resource-pillar">
              <div class="resource-pillar__eyebrow">{{ item.eyebrow }}</div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <ul>
                <li v-for="point in item.points" :key="point">{{ point }}</li>
              </ul>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="resource-overview-card border-border/70 shadow-none">
        <CardHeader class="resource-overview-card__header">
          <div>
            <CardTitle>快速动作</CardTitle>
            <CardDescription>常用入口。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="resource-overview-card__content">
          <div class="resource-quick-actions">
            <Button
              v-for="item in quickActions"
              :key="item.path"
              variant="outline"
              class="resource-quick-actions__button"
              @click="goTo(item.path)"
            >
              {{ item.label }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowRight } from "@element-plus/icons-vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

defineOptions({ name: "ResourceOverview" });

const router = useRouter();

const summary = {
  totalDrones: 25,
  readyDrones: 18,
  airportsOnline: 7,
  payloadPackages: 16,
  onDutyPilots: 11,
};

const moduleCards = [
  {
    title: "无人机管理",
    description: "查看无人机状态和可调度数量。",
    badge: "机队",
    badgeVariant: "secondary" as const,
    meta: "就绪率 72%",
    primaryValue: "18 架在线",
    secondaryValue: "25 架总量",
    path: "/resource/drone",
  },
  {
    title: "机场管理",
    description: "查看机场在线状态和起降保障。",
    badge: "机巢",
    badgeVariant: "outline" as const,
    meta: "在线 7/9",
    primaryValue: "7 座在线",
    secondaryValue: "2 座待检",
    path: "/resource/airport",
  },
  {
    title: "负载管理",
    description: "查看负载类型和在线情况。",
    badge: "载荷",
    badgeVariant: "outline" as const,
    meta: "套装 16 组",
    primaryValue: "9 组红外",
    secondaryValue: "4 组激光",
    path: "/resource/payload",
  },
  {
    title: "飞手管理",
    description: "查看飞手排班、证件和机体分配。",
    badge: "人员",
    badgeVariant: "secondary" as const,
    meta: "值守 11 人",
    primaryValue: "8 人已分配机体",
    secondaryValue: "3 人待排班",
    path: "/resource/pilot",
  },
] as const;

const riskItems = [
  {
    level: "高优先级",
    variant: "destructive" as const,
    owner: "维护组",
    title: "两架无人机进入保养窗口",
    description: "请确认维护时间，避免影响后续任务。",
  },
  {
    level: "需关注",
    variant: "secondary" as const,
    owner: "机巢保障",
    title: "南区机巢离线待复位",
    description: "当前覆盖范围受限，请尽快恢复。",
  },
  {
    level: "资料提醒",
    variant: "outline" as const,
    owner: "飞手管理",
    title: "三位飞手证件扫描件待补齐",
    description: "请尽快补齐资料，避免影响排班。",
  },
] as const;

const coordinationBlocks = [
  {
    eyebrow: "起飞前",
    title: "任务前准备",
    description: "确认机体、机场、负载和飞手已准备就绪。",
    points: ["无人机在线与电池就绪", "机巢起降能力正常", "载荷类型匹配任务"],
  },
  {
    eyebrow: "执行中",
    title: "执行中保障",
    description: "关注备用资源和异常处理。",
    points: ["备用机体是否可顶替", "飞手是否支持快速接管", "载荷切换是否影响目标采集"],
  },
  {
    eyebrow: "收尾",
    title: "风险闭环",
    description: "将维护和资料问题及时转为待办。",
    points: ["维护窗口提前锁定", "证件和资料缺口补齐", "机巢异常转工单跟进"],
  },
] as const;

const quickActions = [
  { label: "查看无人机清单", path: "/resource/drone" },
  { label: "进入飞手管理", path: "/resource/pilot" },
  { label: "查看机场状态", path: "/resource/airport" },
  { label: "整理载荷资源", path: "/resource/payload" },
] as const;

function goTo(path: string) {
  router.push(path);
}
</script>

<style scoped lang="scss">
.resource-overview-page__hero {
  min-height: 250px;
}

.resource-overview-grid,
.resource-summary-grid {
  display: grid;
  gap: 16px;
}

.resource-overview-grid {
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
}

.resource-summary-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
}

.resource-overview-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.resource-overview-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.resource-overview-card__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.resource-module-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.resource-module-card:hover {
  border-color: color-mix(in srgb, var(--ring) 36%, transparent);
  box-shadow: 0 16px 30px rgba(9, 9, 11, 0.08);
  transform: translateY(-2px);
}

.resource-module-card__top,
.resource-module-card__footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.resource-module-card__meta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
  letter-spacing: 0.03em;
}

.resource-module-card__body h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--foreground);
}

.resource-module-card__body p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.resource-module-card__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.resource-module-card__stats div {
  padding: 12px;
  background: color-mix(in srgb, var(--muted) 56%, transparent);
  border-radius: 14px;
}

.resource-module-card__stats span {
  display: block;
  margin-bottom: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.resource-module-card__stats strong {
  font-size: 1rem;
  color: var(--foreground);
}

.resource-module-card__footer {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--foreground);
}

.resource-risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-risk-item {
  padding: 14px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.resource-risk-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.resource-risk-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.resource-risk-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.resource-risk-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.resource-pillar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.resource-pillar {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.resource-pillar__eyebrow {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.resource-pillar h3 {
  margin: 10px 0 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--foreground);
}

.resource-pillar p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.resource-pillar ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 18px;
  margin: 14px 0 0;
  color: var(--foreground);
}

.resource-pillar li {
  font-size: 0.875rem;
  line-height: 1.55;
}

.resource-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.resource-quick-actions__button {
  justify-content: flex-start;
  min-height: 44px;
}

@media (max-width: 1200px) {
  .resource-overview-grid,
  .resource-summary-grid {
    grid-template-columns: 1fr;
  }

  .resource-pillar-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .resource-module-grid,
  .resource-quick-actions {
    grid-template-columns: 1fr;
  }

  .resource-module-card__stats {
    grid-template-columns: 1fr;
  }
}
</style>
