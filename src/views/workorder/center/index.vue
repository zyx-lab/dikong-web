<template>
  <div class="app-container command-page workorder-center-page">
    <section class="command-page__hero command-page__hero--compact workorder-center-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">工单调度</p>
            <h2 class="command-page__title">工单中心</h2>
            <p class="command-page__description">查看工单流转、优先级和处理进度。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">工单流转</span>
            <span class="command-page__signal">责任分派</span>
            <span class="command-page__signal">闭环记录</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">今日新增工单</div>
            <div class="command-page__metric-value">{{ summary.todayCreated }}</div>
            <div class="command-page__metric-note">今日新增工单</div>
          </div>
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">处理中</div>
            <div class="command-page__metric-value">{{ summary.processing }}</div>
            <div class="command-page__metric-note">处理中工单</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">待分派</div>
            <div class="command-page__metric-value">{{ summary.unassigned }}</div>
            <div class="command-page__metric-note">待安排责任人</div>
          </div>
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">今日已闭环</div>
            <div class="command-page__metric-value">{{ summary.closedToday }}</div>
            <div class="command-page__metric-note">今日已办结</div>
          </div>
        </div>
      </div>
    </section>

    <Card v-if="incomingAlert" class="workorder-center-card border-border/70 shadow-none">
      <CardHeader class="workorder-center-card__header">
        <div>
          <CardTitle>当前接续处理</CardTitle>
          <CardDescription>{{ incomingSummary.description }}</CardDescription>
        </div>
        <Badge :variant="incomingAlert.variant">{{ incomingSummary.label }}</Badge>
      </CardHeader>
      <CardContent class="workorder-center-card__content">
        <div class="workorder-context-card">
          <div class="workorder-context-card__body">
            <h3>{{ incomingAlert.title }}</h3>
            <p>{{ incomingAlert.description }}</p>
            <div class="workorder-context-card__meta">
              <span>来源 {{ incomingAlert.source }}</span>
              <span>区域 {{ incomingAlert.zone }}</span>
              <span>责任 {{ incomingAlert.recommendedOwner }}</span>
            </div>
          </div>
          <div class="workorder-context-card__actions">
            <Button variant="outline" @click="goToVerify">返回核实</Button>
            <Button @click="goTo('/workorder/pending')">继续分派</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <section class="workorder-center-grid">
      <Card class="workorder-center-card border-border/70 shadow-none">
        <CardHeader class="workorder-center-card__header">
          <div>
            <CardTitle>流转总览</CardTitle>
            <CardDescription>查看工单当前所处环节。</CardDescription>
          </div>
          <Badge variant="outline">今日</Badge>
        </CardHeader>
        <CardContent class="workorder-center-card__content">
          <div class="workorder-pipeline">
            <article v-for="item in pipeline" :key="item.title" class="workorder-pipeline__item">
              <div class="workorder-pipeline__label">{{ item.title }}</div>
              <div class="workorder-pipeline__value">{{ item.value }}</div>
              <div class="workorder-pipeline__note">{{ item.note }}</div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="workorder-center-card border-border/70 shadow-none">
        <CardHeader class="workorder-center-card__header">
          <div>
            <CardTitle>优先工单</CardTitle>
            <CardDescription>查看优先处理的工单。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/workorder/pending')">进入待处理</Button>
        </CardHeader>
        <CardContent class="workorder-center-card__content">
          <div class="workorder-priority-list">
            <article
              v-for="item in priorityWorkorders"
              :key="item.title"
              class="workorder-priority-item"
            >
              <div class="workorder-priority-item__meta">
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

    <section class="workorder-center-grid workorder-center-grid--secondary">
      <Card class="workorder-center-card border-border/70 shadow-none">
        <CardHeader class="workorder-center-card__header">
          <div>
            <CardTitle>最近流转记录</CardTitle>
            <CardDescription>查看最近处理记录。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="workorder-center-card__content">
          <div class="workorder-log">
            <article
              v-for="item in activityLogs"
              :key="item.time + item.title"
              class="workorder-log__item"
            >
              <div class="workorder-log__time">{{ item.time }}</div>
              <div class="workorder-log__body">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="workorder-center-card border-border/70 shadow-none">
        <CardHeader class="workorder-center-card__header">
          <div>
            <CardTitle>快捷入口</CardTitle>
            <CardDescription>常用入口。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="workorder-center-card__content">
          <div class="workorder-quick-actions">
            <Button
              v-for="item in quickActions"
              :key="item.path"
              variant="outline"
              class="workorder-quick-actions__button"
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAlertDispositionDescription,
  getAlertDispositionLabel,
  getAlertWorkflowItem,
  type AlertDisposition,
} from "@/views/alert/workflow-data";

defineOptions({ name: "WorkorderCenter" });

const router = useRouter();
const route = useRoute();

const summary = {
  todayCreated: 12,
  processing: 7,
  unassigned: 3,
  closedToday: 5,
};

const pipeline = [
  { title: "待分派", value: "3", note: "待分配责任人" },
  { title: "处理中", value: "7", note: "处理中" },
  { title: "待验收", value: "2", note: "待确认结果" },
  { title: "已闭环", value: "5", note: "已完成" },
] as const;

const basePriorityWorkorders = [
  {
    level: "高优先级",
    variant: "destructive" as const,
    owner: "运维一组",
    title: "储罐区热异常工单需要午前到场",
    description: "请尽快安排人员到场处理。",
  },
  {
    level: "需处理",
    variant: "secondary" as const,
    owner: "调度台",
    title: "围栏异常需要和值守飞手协同补飞",
    description: "请安排补飞并补充记录。",
  },
  {
    level: "待确认",
    variant: "outline" as const,
    owner: "复盘组",
    title: "河道偏航工单等待飞控日志补录",
    description: "请补齐资料后再处理。",
  },
] as const;

const incomingAlertId = computed(() => {
  const raw = Number(route.query.alertId ?? 0);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
});

const incomingDisposition = computed(
  () => (route.query.disposition as AlertDisposition | undefined) ?? "workorder"
);

const incomingAlert = computed(() => getAlertWorkflowItem(incomingAlertId.value));

const incomingSummary = computed(() => {
  if (!incomingAlert.value) {
    return {
      label: "",
      description: "",
    };
  }

  return {
    label: getAlertDispositionLabel(incomingDisposition.value),
    description: getAlertDispositionDescription(incomingDisposition.value, incomingAlert.value),
  };
});

const priorityWorkorders = computed(() => {
  if (!incomingAlert.value || incomingDisposition.value === "close") {
    return basePriorityWorkorders;
  }

  const incomingItem = {
    level: incomingDisposition.value === "refly" ? "需处理" : "高优先级",
    variant:
      incomingDisposition.value === "refly" ? ("secondary" as const) : ("destructive" as const),
    owner: incomingAlert.value.recommendedOwner,
    title: incomingAlert.value.workorderTitle,
    description: incomingAlert.value.workorderDescription,
  };

  return [
    incomingItem,
    ...basePriorityWorkorders.filter((item) => item.title !== incomingItem.title),
  ];
});

const activityLogs = [
  {
    time: "11:22",
    title: "热成像异常工单已分配给运维一组",
    description: "责任人已确认，等待现场反馈。",
  },
  {
    time: "10:48",
    title: "围栏入侵工单追加视频回放任务",
    description: "等待补充视频后继续处理。",
  },
  {
    time: "09:57",
    title: "河道偏航工单进入待验收",
    description: "资料已上传，等待确认结果。",
  },
] as const;

const quickActions = [
  { label: "查看待处理", path: "/workorder/pending" },
  { label: "查看已完成", path: "/workorder/completed" },
  { label: "返回预警中心", path: "/alert/center" },
  { label: "返回首页", path: "/dashboard" },
] as const;

function goTo(path: string) {
  router.push(path);
}

function goToVerify() {
  if (!incomingAlert.value) {
    router.push("/alert/verify");
    return;
  }

  router.push({
    path: "/alert/verify",
    query: {
      alertId: String(incomingAlert.value.id),
    },
  });
}
</script>

<style scoped lang="scss">
.workorder-center-page__hero {
  min-height: 250px;
}

.workorder-center-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.workorder-center-grid--secondary {
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
}

.workorder-center-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.workorder-center-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.workorder-center-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.workorder-context-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.workorder-context-card__body h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--foreground);
}

.workorder-context-card__body p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.workorder-context-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.workorder-context-card__meta span {
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

.workorder-context-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.workorder-pipeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.workorder-pipeline__item {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.workorder-pipeline__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.workorder-pipeline__value {
  margin-top: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground);
}

.workorder-pipeline__note {
  margin-top: 8px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

.workorder-priority-list,
.workorder-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workorder-priority-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.workorder-priority-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.workorder-priority-item__meta span,
.workorder-log__time {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.workorder-priority-item h3,
.workorder-log__body h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.workorder-priority-item p,
.workorder-log__body p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.workorder-log__item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.workorder-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.workorder-quick-actions__button {
  justify-content: flex-start;
  min-height: 44px;
}

@media (max-width: 1200px) {
  .workorder-center-grid,
  .workorder-center-grid--secondary {
    grid-template-columns: 1fr;
  }

  .workorder-pipeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .workorder-context-card {
    grid-template-columns: 1fr;
  }

  .workorder-pipeline,
  .workorder-quick-actions {
    grid-template-columns: 1fr;
  }

  .workorder-context-card__actions {
    flex-direction: column;
  }
}
</style>
