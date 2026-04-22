<template>
  <div class="app-container command-page workorder-completed-page">
    <section class="command-page__hero command-page__hero--compact workorder-completed-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">办结记录</p>
            <h2 class="command-page__title">我已办理</h2>
            <p class="command-page__description">查看已办结工单和闭环记录。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">办结记录</span>
            <span class="command-page__signal">复盘留档</span>
            <span class="command-page__signal">经验复用</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">今日已办结</div>
            <div class="command-page__metric-value">{{ completedSummary.todayDone }}</div>
            <div class="command-page__metric-note">今日已办结</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">误报闭环</div>
            <div class="command-page__metric-value">{{ completedSummary.falseAlarm }}</div>
            <div class="command-page__metric-note">误报后关闭</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">补飞后闭环</div>
            <div class="command-page__metric-value">{{ completedSummary.reflyClosed }}</div>
            <div class="command-page__metric-note">补飞后关闭</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">平均闭环时长</div>
            <div class="command-page__metric-value">{{ completedSummary.avgHours }}</div>
            <div class="command-page__metric-note">近一周平均时长</div>
          </div>
        </div>
      </div>
    </section>

    <section class="workorder-completed-grid">
      <Card class="workorder-completed-card border-border/70 shadow-none">
        <CardHeader class="workorder-completed-card__header">
          <div>
            <CardTitle>最近办结记录</CardTitle>
            <CardDescription>查看最近办结工单。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/workorder/center')">返回工单中心</Button>
        </CardHeader>
        <CardContent class="workorder-completed-card__content">
          <div class="completed-workorder-list">
            <article
              v-for="item in completedItems"
              :key="item.title"
              class="completed-workorder-item"
            >
              <div class="completed-workorder-item__meta">
                <Badge :variant="item.variant">{{ item.result }}</Badge>
                <span>{{ item.time }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="completed-workorder-item__foot">
                <span>责任组 {{ item.owner }}</span>
                <span>耗时 {{ item.duration }}</span>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="workorder-completed-card border-border/70 shadow-none">
        <CardHeader class="workorder-completed-card__header">
          <div>
            <CardTitle>复盘提示</CardTitle>
            <CardDescription>查看复盘要点。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="workorder-completed-card__content">
          <div class="completed-insight-list">
            <article v-for="item in insights" :key="item.title" class="completed-insight-item">
              <div class="completed-insight-item__meta">
                <Badge :variant="item.variant">{{ item.type }}</Badge>
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

defineOptions({ name: "WorkorderCompleted" });

const router = useRouter();

const completedSummary = {
  todayDone: 5,
  falseAlarm: 2,
  reflyClosed: 1,
  avgHours: "4.2h",
};

const completedItems = [
  {
    result: "已闭环",
    variant: "secondary" as const,
    title: "储罐区热异常工单完成现场复核",
    description: "已确认现场情况并补充照片。",
    owner: "运维一组",
    duration: "3.5h",
    time: "今天 10:42",
  },
  {
    result: "误报关闭",
    variant: "outline" as const,
    title: "围栏入侵告警判定为误报",
    description: "已确认误报并关闭工单。",
    owner: "复盘组",
    duration: "1.8h",
    time: "今天 09:36",
  },
  {
    result: "补飞闭环",
    variant: "secondary" as const,
    title: "河道偏航工单通过补飞完成核实",
    description: "补飞后已确认无异常。",
    owner: "调度台",
    duration: "5.1h",
    time: "昨天 17:20",
  },
] as const;

const insights = [
  {
    type: "可复用",
    variant: "secondary" as const,
    owner: "复盘组",
    title: "围栏类告警优先补看连续视频",
    description: "先补充完整视频再判断。",
  },
  {
    type: "需前置",
    variant: "outline" as const,
    owner: "调度台",
    title: "补飞窗口应在首次派单时一起预留",
    description: "首次派单时同步安排补飞时间。",
  },
  {
    type: "高价值",
    variant: "destructive" as const,
    owner: "值守台",
    title: "热成像异常必须同步现场反馈",
    description: "现场复测结果需要一并留存。",
  },
] as const;

function goTo(path: string) {
  router.push(path);
}
</script>

<style scoped lang="scss">
.workorder-completed-page__hero {
  min-height: 240px;
}

.workorder-completed-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.workorder-completed-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.workorder-completed-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.workorder-completed-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.completed-workorder-list,
.completed-insight-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.completed-workorder-item,
.completed-insight-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.completed-workorder-item__meta,
.completed-insight-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.completed-workorder-item__meta span,
.completed-insight-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.completed-workorder-item h3,
.completed-insight-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.completed-workorder-item p,
.completed-insight-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.completed-workorder-item__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.completed-workorder-item__foot span {
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
  .workorder-completed-grid {
    grid-template-columns: 1fr;
  }
}
</style>
