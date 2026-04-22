<template>
  <div class="app-container command-page alert-center-page">
    <section class="command-page__hero command-page__hero--compact alert-center-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">预警处置</p>
            <h2 class="command-page__title">预警中心</h2>
            <p class="command-page__description">查看实时预警、等级和处理状态。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">实时预警</span>
            <span class="command-page__signal">优先级</span>
            <span class="command-page__signal">处理状态</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">今日告警</div>
            <div class="command-page__metric-value">{{ summary.todayTotal }}</div>
            <div class="command-page__metric-note">较昨日增加 3 起</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">高优先级</div>
            <div class="command-page__metric-value">{{ summary.highPriority }}</div>
            <div class="command-page__metric-note">需要优先处理</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">待核实</div>
            <div class="command-page__metric-value">{{ summary.pendingVerify }}</div>
            <div class="command-page__metric-note">待补充证据并核实</div>
          </div>
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">已闭环</div>
            <div class="command-page__metric-value">{{ summary.closedToday }}</div>
            <div class="command-page__metric-note">今日已办结</div>
          </div>
        </div>
      </div>
    </section>

    <section class="alert-center-grid">
      <Card class="alert-center-card border-border/70 shadow-none">
        <CardHeader class="alert-center-card__header">
          <div>
            <CardTitle>实时告警队列</CardTitle>
            <CardDescription>按等级和时间查看预警。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goToVerify(alerts[0]?.id)">进入预警核实</Button>
        </CardHeader>
        <CardContent class="alert-center-card__content">
          <div class="alert-stream">
            <article v-for="item in alerts" :key="item.id" class="alert-stream__item">
              <div class="alert-stream__meta">
                <Badge :variant="item.variant">{{ item.level }}</Badge>
                <span>{{ item.time }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="alert-stream__foot">
                <span>来源 {{ item.source }}</span>
                <span>区域 {{ item.zone }}</span>
                <span>建议 {{ item.nextStep }}</span>
              </div>
              <div class="alert-stream__actions">
                <Button size="sm" @click="goToVerify(item.id)">去核实</Button>
                <Button size="sm" variant="outline" @click="goToWorkorder(item.id, 'workorder')">
                  转工单
                </Button>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="alert-center-card border-border/70 shadow-none">
        <CardHeader class="alert-center-card__header">
          <div>
            <CardTitle>风险分布</CardTitle>
            <CardDescription>查看区域分布。</CardDescription>
          </div>
          <Badge variant="outline">近 24 小时</Badge>
        </CardHeader>
        <CardContent class="alert-center-card__content">
          <div class="alert-distribution">
            <article
              v-for="item in distributions"
              :key="item.label"
              class="alert-distribution__item"
            >
              <div class="alert-distribution__label">{{ item.label }}</div>
              <div class="alert-distribution__value">{{ item.value }}</div>
              <div class="alert-distribution__note">{{ item.note }}</div>
            </article>
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="alert-center-grid alert-center-grid--secondary">
      <Card class="alert-center-card border-border/70 shadow-none">
        <CardHeader class="alert-center-card__header">
          <div>
            <CardTitle>今日响应动作</CardTitle>
            <CardDescription>查看待处理事项。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="alert-center-card__content">
          <div class="alert-action-list">
            <article v-for="item in actions" :key="item.alertId" class="alert-action-item">
              <div class="alert-action-item__meta">
                <Badge :variant="item.variant">{{ item.type }}</Badge>
                <span>{{ item.owner }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="alert-action-item__actions">
                <Button size="sm" variant="outline" @click="goToVerify(item.alertId)">
                  查看预警
                </Button>
                <Button size="sm" @click="goToWorkorder(item.alertId, item.disposition)">
                  继续处理
                </Button>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="alert-center-card border-border/70 shadow-none">
        <CardHeader class="alert-center-card__header">
          <div>
            <CardTitle>快捷入口</CardTitle>
            <CardDescription>常用入口。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="alert-center-card__content">
          <div class="alert-quick-actions">
            <Button
              v-for="item in quickActions"
              :key="item.path"
              variant="outline"
              class="alert-quick-actions__button"
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { alertWorkflowItems, type AlertDisposition } from "../workflow-data";

defineOptions({ name: "AlertCenter" });

const router = useRouter();

const summary = {
  todayTotal: 17,
  highPriority: 6,
  pendingVerify: 9,
  closedToday: 8,
};

const alerts = alertWorkflowItems;

const distributions = [
  { label: "港区", value: "6 起", note: "围栏和航道周边较多" },
  { label: "园区", value: "7 起", note: "热成像和管线异常较多" },
  { label: "河道", value: "2 起", note: "以一般预警为主" },
  { label: "山林", value: "2 起", note: "以火险预警为主" },
] as const;

const actions = [
  {
    alertId: 1,
    type: "派单",
    variant: "destructive" as const,
    owner: "值守台",
    title: "储罐区异常转工单",
    description: "请尽快安排责任人处理。",
    disposition: "workorder" as const,
  },
  {
    alertId: 2,
    type: "核实",
    variant: "secondary" as const,
    owner: "复盘组",
    title: "补看围栏视频",
    description: "请补充回放并记录结果。",
    disposition: "verify" as const,
  },
  {
    alertId: 4,
    type: "排班",
    variant: "outline" as const,
    owner: "调度台",
    title: "预留复飞时段",
    description: "如需复飞，请提前安排时段。",
    disposition: "refly" as const,
  },
] as const;

const quickActions = [
  { label: "进入告警核实", path: "/alert/verify" },
  { label: "查看飞行记录", path: "/flight/record" },
  { label: "查看工单中心", path: "/workorder/center" },
  { label: "返回首页", path: "/dashboard" },
] as const;

function goTo(path: string) {
  router.push(path);
}

function goToVerify(alertId?: number) {
  router.push({
    path: "/alert/verify",
    query: alertId ? { alertId: String(alertId) } : undefined,
  });
}

function goToWorkorder(alertId: number, disposition: AlertDisposition) {
  router.push({
    path: "/workorder/center",
    query: {
      alertId: String(alertId),
      disposition,
    },
  });
}
</script>

<style scoped lang="scss">
.alert-center-page__hero {
  min-height: 250px;
}

.alert-center-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.alert-center-grid--secondary {
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
}

.alert-center-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.alert-center-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.alert-center-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.alert-stream,
.alert-action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-stream__item,
.alert-action-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.alert-stream__meta,
.alert-action-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.alert-stream__meta span,
.alert-action-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.alert-stream__item h3,
.alert-action-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.alert-stream__item p,
.alert-action-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.alert-stream__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.alert-stream__foot span {
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

.alert-stream__actions,
.alert-action-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.alert-distribution {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.alert-distribution__item {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.alert-distribution__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.alert-distribution__value {
  margin-top: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: -0.03em;
}

.alert-distribution__note {
  margin-top: 8px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

.alert-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.alert-quick-actions__button {
  justify-content: flex-start;
  min-height: 44px;
}

@media (max-width: 1200px) {
  .alert-center-grid,
  .alert-center-grid--secondary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .alert-distribution,
  .alert-quick-actions {
    grid-template-columns: 1fr;
  }

  .alert-stream__actions,
  .alert-action-item__actions {
    flex-direction: column;
  }
}
</style>
