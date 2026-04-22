<template>
  <div class="app-container command-page workorder-pending-page">
    <section class="command-page__hero command-page__hero--compact workorder-pending-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">我的待办</p>
            <h2 class="command-page__title">待我办理</h2>
            <p class="command-page__description">查看当前分配给我的待办工单。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">紧急优先</span>
            <span class="command-page__signal">下一步</span>
            <span class="command-page__signal">截止时间</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">我的待处理</div>
            <div class="command-page__metric-value">{{ pendingSummary.total }}</div>
            <div class="command-page__metric-note">当前待处理数量</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">高优先级</div>
            <div class="command-page__metric-value">{{ pendingSummary.highPriority }}</div>
            <div class="command-page__metric-note">优先处理</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">等待补证据</div>
            <div class="command-page__metric-value">{{ pendingSummary.waitingEvidence }}</div>
            <div class="command-page__metric-note">待补资料</div>
          </div>
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">今天计划完成</div>
            <div class="command-page__metric-value">{{ pendingSummary.todayPlan }}</div>
            <div class="command-page__metric-note">计划今日完成</div>
          </div>
        </div>
      </div>
    </section>

    <section class="workorder-pending-grid">
      <Card class="workorder-pending-card border-border/70 shadow-none">
        <CardHeader class="workorder-pending-card__header">
          <div>
            <CardTitle>我的待处理列表</CardTitle>
            <CardDescription>查看当前待办事项。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/workorder/center')">返回工单中心</Button>
        </CardHeader>
        <CardContent class="workorder-pending-card__content">
          <div class="pending-workorder-list">
            <article v-for="item in pendingItems" :key="item.title" class="pending-workorder-item">
              <div class="pending-workorder-item__meta">
                <Badge :variant="item.variant">{{ item.level }}</Badge>
                <span>{{ item.owner }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="pending-workorder-item__foot">
                <span>下一步 {{ item.nextStep }}</span>
                <span>截至 {{ item.deadline }}</span>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="workorder-pending-card border-border/70 shadow-none">
        <CardHeader class="workorder-pending-card__header">
          <div>
            <CardTitle>处理要点</CardTitle>
            <CardDescription>查看处理要点。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="workorder-pending-card__content">
          <div class="pending-suggestion-list">
            <article v-for="item in suggestions" :key="item.title" class="pending-suggestion-item">
              <div class="pending-suggestion-item__meta">
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

defineOptions({ name: "WorkorderPending" });

const router = useRouter();

const pendingSummary = {
  total: 6,
  highPriority: 2,
  waitingEvidence: 2,
  todayPlan: 4,
};

const pendingItems = [
  {
    level: "紧急",
    variant: "destructive" as const,
    owner: "运维一组",
    title: "储罐区热异常工单等待现场到场反馈",
    description: "请补录到场时间和现场结果。",
    nextStep: "补录现场反馈",
    deadline: "今天 13:00",
  },
  {
    level: "重要",
    variant: "secondary" as const,
    owner: "复盘组",
    title: "围栏告警工单待补视频证据",
    description: "当前仅有抓拍，请补充回放。",
    nextStep: "补看回放",
    deadline: "今天 15:00",
  },
  {
    level: "一般",
    variant: "outline" as const,
    owner: "调度台",
    title: "河道偏航工单待判断是否复飞",
    description: "请根据日志判断是否需要复飞。",
    nextStep: "决定是否复飞",
    deadline: "今天 17:30",
  },
] as const;

const suggestions = [
  {
    type: "先补证据",
    variant: "secondary" as const,
    owner: "复盘组",
    title: "视频/截图不足时不要急着闭环",
    description: "请先补齐关键资料再关闭。",
  },
  {
    type: "先派责任人",
    variant: "destructive" as const,
    owner: "值守台",
    title: "高优先级异常要先锁定责任人",
    description: "请先明确责任人和到场时间。",
  },
  {
    type: "先排班复飞",
    variant: "outline" as const,
    owner: "调度台",
    title: "需要补飞的工单要提前留出窗口",
    description: "请提前安排补飞时间。",
  },
] as const;

function goTo(path: string) {
  router.push(path);
}
</script>

<style scoped lang="scss">
.workorder-pending-page__hero {
  min-height: 240px;
}

.workorder-pending-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.workorder-pending-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.workorder-pending-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.workorder-pending-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pending-workorder-list,
.pending-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pending-workorder-item,
.pending-suggestion-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.pending-workorder-item__meta,
.pending-suggestion-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.pending-workorder-item__meta span,
.pending-suggestion-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.pending-workorder-item h3,
.pending-suggestion-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.pending-workorder-item p,
.pending-suggestion-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.pending-workorder-item__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.pending-workorder-item__foot span {
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
  .workorder-pending-grid {
    grid-template-columns: 1fr;
  }
}
</style>
