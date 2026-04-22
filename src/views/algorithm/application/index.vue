<template>
  <div class="app-container command-page algorithm-application-page">
    <section
      class="command-page__hero command-page__hero--compact algorithm-application-page__hero"
    >
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">算法部署</p>
            <h2 class="command-page__title">算法应用</h2>
            <p class="command-page__description">查看算法与设备绑定、运行状态和调用情况。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">绑定关系</span>
            <span class="command-page__signal">运行状态</span>
            <span class="command-page__signal">调用数据</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">部署组合</div>
            <div class="command-page__metric-value">{{ summary.total }}</div>
            <div class="command-page__metric-note">当前绑定数量</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">运行中</div>
            <div class="command-page__metric-value">{{ summary.running }}</div>
            <div class="command-page__metric-note">正常运行</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">试运行</div>
            <div class="command-page__metric-value">{{ summary.testing }}</div>
            <div class="command-page__metric-note">试运行中</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">暂停中</div>
            <div class="command-page__metric-value">{{ summary.paused }}</div>
            <div class="command-page__metric-note">暂停使用</div>
          </div>
        </div>
      </div>
    </section>

    <section class="algorithm-application-grid">
      <Card class="algorithm-application-card border-border/70 shadow-none">
        <CardHeader class="algorithm-application-card__header">
          <div>
            <CardTitle>运行状态</CardTitle>
            <CardDescription>查看当前运行情况。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/algorithm/repository')">
            返回算法仓库
          </Button>
        </CardHeader>
        <CardContent class="algorithm-application-card__content">
          <div class="algorithm-runtime-grid">
            <article v-for="item in applications" :key="item.id" class="algorithm-runtime-card">
              <div class="algorithm-runtime-card__meta">
                <Badge :variant="item.variant">{{ item.status }}</Badge>
                <span>{{ item.deviceName }}</span>
              </div>
              <h3>{{ item.algorithmName }}</h3>
              <p>{{ item.description }}</p>
              <div class="algorithm-runtime-card__stats">
                <div>
                  <span>调用量</span>
                  <strong>{{ item.detectCount }}</strong>
                </div>
                <div>
                  <span>识别精度</span>
                  <strong>{{ item.accuracy }}%</strong>
                </div>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="algorithm-application-card border-border/70 shadow-none">
        <CardHeader class="algorithm-application-card__header">
          <div>
            <CardTitle>处理事项</CardTitle>
            <CardDescription>查看需要处理的事项。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="algorithm-application-card__content">
          <div class="algorithm-suggestion-list">
            <article
              v-for="item in suggestions"
              :key="item.title"
              class="algorithm-suggestion-item"
            >
              <div class="algorithm-suggestion-item__meta">
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

defineOptions({ name: "AlgorithmApplication" });

const router = useRouter();

const summary = {
  total: 12,
  running: 8,
  testing: 2,
  paused: 2,
};

const applications = [
  {
    id: 1,
    algorithmName: "围栏入侵识别",
    deviceName: "DJI M30T #03",
    status: "运行中",
    variant: "secondary" as const,
    detectCount: 326,
    accuracy: 96.8,
    description: "用于港区东侧围栏监测。",
  },
  {
    id: 2,
    algorithmName: "红外温度异常识别",
    deviceName: "DJI M350 #02",
    status: "试运行",
    variant: "outline" as const,
    detectCount: 118,
    accuracy: 93.4,
    description: "用于储罐区夜航温度监测。",
  },
  {
    id: 3,
    algorithmName: "河道漂浮物识别",
    deviceName: "河道巡检-03",
    status: "运行中",
    variant: "secondary" as const,
    detectCount: 205,
    accuracy: 94.7,
    description: "用于河道日常巡检。",
  },
  {
    id: 4,
    algorithmName: "人员聚集分析",
    deviceName: "园区固定点位 #05",
    status: "暂停中",
    variant: "destructive" as const,
    detectCount: 0,
    accuracy: 0,
    description: "当前暂停，待恢复后启用。",
  },
] as const;

const suggestions = [
  {
    level: "高优先级",
    variant: "destructive" as const,
    owner: "算法组",
    title: "红外异常识别需要重新校准阈值",
    description: "请重新校准阈值。",
  },
  {
    level: "处理中",
    variant: "secondary" as const,
    owner: "设备组",
    title: "聚集分析依赖的固定点位视频流需先恢复",
    description: "请先恢复视频流。",
  },
  {
    level: "提示",
    variant: "outline" as const,
    owner: "调度台",
    title: "河道漂浮物识别可作为日常巡检默认能力",
    description: "当前运行稳定，可用于日常巡检。",
  },
] as const;

function goTo(path: string) {
  router.push(path);
}
</script>

<style scoped lang="scss">
.algorithm-application-page__hero {
  min-height: 240px;
}

.algorithm-application-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.algorithm-application-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.algorithm-application-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.algorithm-application-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.algorithm-runtime-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.algorithm-runtime-card,
.algorithm-suggestion-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.algorithm-runtime-card__meta,
.algorithm-suggestion-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.algorithm-runtime-card__meta span,
.algorithm-suggestion-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.algorithm-runtime-card h3,
.algorithm-suggestion-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.algorithm-runtime-card p,
.algorithm-suggestion-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.algorithm-runtime-card__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.algorithm-runtime-card__stats div {
  padding: 12px;
  background: color-mix(in srgb, var(--muted) 58%, transparent);
  border-radius: 14px;
}

.algorithm-runtime-card__stats span {
  display: block;
  margin-bottom: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.algorithm-runtime-card__stats strong {
  font-size: 1rem;
  color: var(--foreground);
}

.algorithm-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1200px) {
  .algorithm-application-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .algorithm-runtime-grid {
    grid-template-columns: 1fr;
  }

  .algorithm-runtime-card__stats {
    grid-template-columns: 1fr;
  }
}
</style>
