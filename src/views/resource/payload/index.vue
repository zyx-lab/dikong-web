<template>
  <div class="app-container command-page resource-payload-page">
    <section class="command-page__hero command-page__hero--compact resource-payload-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">载荷能力</p>
            <h2 class="command-page__title">负载管理</h2>
            <p class="command-page__description">查看负载类型、在线状态和维护情况。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">负载类型</span>
            <span class="command-page__signal">在线状态</span>
            <span class="command-page__signal">维护计划</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">载荷总量</div>
            <div class="command-page__metric-value">{{ payloadSummary.total }}</div>
            <div class="command-page__metric-note">当前负载总数</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">红外载荷</div>
            <div class="command-page__metric-value">{{ payloadSummary.infrared }}</div>
            <div class="command-page__metric-note">红外类负载数量</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">激光雷达</div>
            <div class="command-page__metric-value">{{ payloadSummary.lidar }}</div>
            <div class="command-page__metric-note">激光雷达数量</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">待校准</div>
            <div class="command-page__metric-value">{{ payloadSummary.needsCalibration }}</div>
            <div class="command-page__metric-note">待校准或维护</div>
          </div>
        </div>
      </div>
    </section>

    <section class="resource-payload-grid">
      <Card class="resource-payload-card border-border/70 shadow-none">
        <CardHeader class="resource-payload-card__header">
          <div>
            <CardTitle>载荷能力卡</CardTitle>
            <CardDescription>查看各类载荷当前状态。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/resource/overview')">
            返回资源总览
          </Button>
        </CardHeader>
        <CardContent class="resource-payload-card__content">
          <div class="payload-capability-grid">
            <article v-for="item in payloadCards" :key="item.title" class="payload-capability-card">
              <div class="payload-capability-card__meta">
                <Badge :variant="item.variant">{{ item.badge }}</Badge>
                <span>{{ item.meta }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="payload-capability-card__foot">
                <span>在线 {{ item.online }}</span>
                <span>维护 {{ item.maintenance }}</span>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="resource-payload-card border-border/70 shadow-none">
        <CardHeader class="resource-payload-card__header">
          <div>
            <CardTitle>今日负载重点</CardTitle>
            <CardDescription>查看需要优先处理的事项。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="resource-payload-card__content">
          <div class="payload-focus-list">
            <article v-for="item in payloadFocusItems" :key="item.title" class="payload-focus-item">
              <div class="payload-focus-item__meta">
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
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

defineOptions({ name: "ResourcePayload" });

const router = useRouter();

const payloadSummary = {
  total: 16,
  infrared: 9,
  lidar: 4,
  needsCalibration: 3,
};

const payloadCards = [
  {
    title: "可见光云台",
    badge: "基础采集",
    variant: "secondary" as const,
    meta: "港区 园区 日常巡检",
    online: "6 组",
    maintenance: "1 组",
    description: "用于日常可见光巡检和复核。",
  },
  {
    title: "红外热成像",
    badge: "高频",
    variant: "outline" as const,
    meta: "夜航 热点 温度异常",
    online: "5 组",
    maintenance: "2 组",
    description: "用于夜航和温度异常检查。",
  },
  {
    title: "激光雷达",
    badge: "稀缺能力",
    variant: "outline" as const,
    meta: "测绘 建模 复杂地形",
    online: "3 组",
    maintenance: "1 组",
    description: "用于测绘、建模和复杂地形采集。",
  },
  {
    title: "喊话/广播载荷",
    badge: "应急",
    variant: "secondary" as const,
    meta: "应急疏导 远程喊话",
    online: "2 组",
    maintenance: "0 组",
    description: "用于远程喊话和应急广播。",
  },
] as const;

const payloadFocusItems = [
  {
    level: "高优先级",
    variant: "destructive" as const,
    owner: "感知组",
    title: "一组红外载荷需重新校准温度阈值",
    description: "请尽快校准，避免影响明日任务。",
  },
  {
    level: "需关注",
    variant: "secondary" as const,
    owner: "测绘组",
    title: "激光雷达本周仅剩三组可在线分配",
    description: "请优先安排重点任务使用。",
  },
  {
    level: "提示",
    variant: "outline" as const,
    owner: "调度台",
    title: "广播载荷可补位围栏告警处置",
    description: "可用于园区入侵和现场疏导。",
  },
] as const;

function goTo(path: string) {
  router.push(path);
}
</script>

<style scoped lang="scss">
.resource-payload-page__hero {
  min-height: 240px;
}

.resource-payload-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.resource-payload-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.resource-payload-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.resource-payload-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.payload-capability-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.payload-capability-card,
.payload-focus-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.payload-capability-card__meta,
.payload-focus-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.payload-capability-card__meta span,
.payload-focus-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.payload-capability-card h3,
.payload-focus-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.payload-capability-card p,
.payload-focus-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.payload-capability-card__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.payload-capability-card__foot span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--foreground);
  background: color-mix(in srgb, var(--muted) 58%, transparent);
  border-radius: 999px;
}

.payload-focus-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1200px) {
  .resource-payload-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .payload-capability-grid {
    grid-template-columns: 1fr;
  }
}
</style>
