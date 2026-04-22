<template>
  <div class="app-container command-page resource-airport-page">
    <section class="command-page__hero command-page__hero--compact resource-airport-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">起降保障</p>
            <h2 class="command-page__title">机场管理</h2>
            <p class="command-page__description">查看机场在线状态、起降保障和维护情况。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">在线状态</span>
            <span class="command-page__signal">起降保障</span>
            <span class="command-page__signal">维护计划</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">机场总量</div>
            <div class="command-page__metric-value">{{ airportSummary.total }}</div>
            <div class="command-page__metric-note">当前机场总数</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">在线可用</div>
            <div class="command-page__metric-value">
              {{ airportSummary.online }}
              <span class="command-page__metric-sub">/ {{ airportSummary.total }}</span>
            </div>
            <div class="command-page__metric-note">可正常起降</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">待维护</div>
            <div class="command-page__metric-value">{{ airportSummary.maintenance }}</div>
            <div class="command-page__metric-note">待维护或待复位</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">自动起降就绪</div>
            <div class="command-page__metric-value">{{ airportSummary.autoLaunchReady }}</div>
            <div class="command-page__metric-note">支持自动起降</div>
          </div>
        </div>
      </div>
    </section>

    <section class="resource-airport-grid">
      <Card class="resource-airport-card border-border/70 shadow-none">
        <CardHeader class="resource-airport-card__header">
          <div>
            <CardTitle>机场状态</CardTitle>
            <CardDescription>查看各机场当前状态。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/resource/overview')">
            返回资源总览
          </Button>
        </CardHeader>
        <CardContent class="resource-airport-card__content">
          <div class="airport-status-list">
            <article v-for="item in airportCards" :key="item.name" class="airport-status-item">
              <div class="airport-status-item__meta">
                <Badge :variant="item.variant">{{ item.status }}</Badge>
                <span>{{ item.zone }}</span>
              </div>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
              <div class="airport-status-item__stats">
                <span>保障能力 {{ item.capability }}</span>
                <span>覆盖 {{ item.coverage }}</span>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="resource-airport-card border-border/70 shadow-none">
        <CardHeader class="resource-airport-card__header">
          <div>
            <CardTitle>今日保障重点</CardTitle>
            <CardDescription>查看需要优先处理的事项。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="resource-airport-card__content">
          <div class="airport-priority-list">
            <article
              v-for="item in airportPriorityItems"
              :key="item.title"
              class="airport-priority-item"
            >
              <div class="airport-priority-item__meta">
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

defineOptions({ name: "ResourceAirport" });

const router = useRouter();

const airportSummary = {
  total: 9,
  online: 7,
  maintenance: 2,
  autoLaunchReady: 5,
};

const airportCards = [
  {
    name: "港区主机巢",
    zone: "高栏港",
    status: "在线",
    variant: "secondary" as const,
    capability: "自动起降",
    coverage: "港区主航道",
    description: "状态正常，可用于日常巡检。",
  },
  {
    name: "园区南侧机巢",
    zone: "化工园区",
    status: "待复位",
    variant: "outline" as const,
    capability: "远程复位中",
    coverage: "储罐区南段",
    description: "通信已恢复，仍需完成远程检查。",
  },
  {
    name: "河道巡检坪",
    zone: "前山河",
    status: "在线",
    variant: "secondary" as const,
    capability: "人工保障",
    coverage: "河道东西两岸",
    description: "适用于日间任务，需人工保障。",
  },
  {
    name: "山林值守巢",
    zone: "紫金山",
    status: "维护中",
    variant: "destructive" as const,
    capability: "暂停使用",
    coverage: "林区高火险带",
    description: "需完成维护后才能恢复自动起降。",
  },
] as const;

const airportPriorityItems = [
  {
    level: "处理中",
    variant: "secondary" as const,
    owner: "机巢运维",
    title: "南侧机巢需要远程复位确认",
    description: "请尽快复位，避免影响下午任务。",
  },
  {
    level: "高优先级",
    variant: "destructive" as const,
    owner: "保障组",
    title: "山林值守巢维护窗口需锁定",
    description: "请同步安排备用起降点。",
  },
  {
    level: "提示",
    variant: "outline" as const,
    owner: "调度台",
    title: "河道巡检坪需提前排值守飞手",
    description: "该点位依赖人工保障，请提前确认到岗。",
  },
] as const;

function goTo(path: string) {
  router.push(path);
}
</script>

<style scoped lang="scss">
.resource-airport-page__hero {
  min-height: 240px;
}

.resource-airport-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.resource-airport-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.resource-airport-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.resource-airport-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.airport-status-list,
.airport-priority-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.airport-status-item,
.airport-priority-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.airport-status-item__meta,
.airport-priority-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.airport-status-item__meta span,
.airport-priority-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.airport-status-item h3,
.airport-priority-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.airport-status-item p,
.airport-priority-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.airport-status-item__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.airport-status-item__stats span {
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

@media (max-width: 1200px) {
  .resource-airport-grid {
    grid-template-columns: 1fr;
  }
}
</style>
