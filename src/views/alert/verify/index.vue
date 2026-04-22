<template>
  <div class="app-container command-page alert-verify-page">
    <section class="command-page__hero command-page__hero--compact alert-verify-page__hero">
      <div class="command-page__hero-inner">
        <div class="command-page__hero-main">
          <div class="command-page__heading">
            <p class="command-page__eyebrow">预警核实</p>
            <h2 class="command-page__title">预警核实</h2>
            <p class="command-page__description">对待核实预警补充证据并给出处理结果。</p>
          </div>
          <div class="command-page__signals">
            <span class="command-page__signal">待核实</span>
            <span class="command-page__signal">证据情况</span>
            <span class="command-page__signal">处理结果</span>
          </div>
        </div>

        <div class="command-page__metrics">
          <div class="command-page__metric command-page__metric--warning">
            <div class="command-page__metric-label">待核实</div>
            <div class="command-page__metric-value">{{ verifySummary.pending }}</div>
            <div class="command-page__metric-note">待补充证据和核实</div>
          </div>
          <div class="command-page__metric">
            <div class="command-page__metric-label">证据完整</div>
            <div class="command-page__metric-value">{{ verifySummary.evidenceReady }}</div>
            <div class="command-page__metric-note">可直接处理</div>
          </div>
          <div class="command-page__metric command-page__metric--accent">
            <div class="command-page__metric-label">今日已核实</div>
            <div class="command-page__metric-value">{{ verifySummary.completed }}</div>
            <div class="command-page__metric-note">今日已处理</div>
          </div>
          <div class="command-page__metric command-page__metric--danger">
            <div class="command-page__metric-label">待补飞</div>
            <div class="command-page__metric-value">{{ verifySummary.needsRefly }}</div>
            <div class="command-page__metric-note">需要补采资料</div>
          </div>
        </div>
      </div>
    </section>

    <Card v-if="activeAlert" class="alert-verify-card border-border/70 shadow-none">
      <CardHeader class="alert-verify-card__header">
        <div>
          <CardTitle>当前核实对象</CardTitle>
          <CardDescription>从预警中心带入的当前预警。</CardDescription>
        </div>
        <Badge :variant="activeAlert.variant">{{ activeAlert.level }}</Badge>
      </CardHeader>
      <CardContent class="alert-verify-card__content">
        <div class="verify-focus-card">
          <div class="verify-focus-card__body">
            <h3>{{ activeAlert.title }}</h3>
            <p>{{ activeAlert.description }}</p>
            <div class="verify-focus-card__meta">
              <span>来源 {{ activeAlert.source }}</span>
              <span>区域 {{ activeAlert.zone }}</span>
              <span>证据 {{ activeAlert.evidence }}</span>
            </div>
          </div>
          <div class="verify-focus-card__actions">
            <Button variant="outline" @click="closeAlert">直接关闭</Button>
            <Button variant="outline" @click="goToWorkorder('refly')">安排补飞</Button>
            <Button @click="goToWorkorder('workorder')">转工单</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <section class="alert-verify-grid">
      <Card class="alert-verify-card border-border/70 shadow-none">
        <CardHeader class="alert-verify-card__header">
          <div>
            <CardTitle>待核实队列</CardTitle>
            <CardDescription>按优先级查看待核实预警。</CardDescription>
          </div>
          <Button variant="ghost" size="sm" @click="goTo('/alert/center')">返回预警中心</Button>
        </CardHeader>
        <CardContent class="alert-verify-card__content">
          <div class="verify-queue">
            <article
              v-for="item in queueItems"
              :key="item.id"
              :class="[
                'verify-queue__item',
                { 'verify-queue__item--active': item.id === activeAlertId },
              ]"
            >
              <div class="verify-queue__meta">
                <Badge :variant="item.variant">{{ item.level }}</Badge>
                <span>{{ item.time }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="verify-queue__foot">
                <span>证据 {{ item.evidence }}</span>
                <span>下一步 {{ item.nextStep }}</span>
              </div>
              <div class="verify-queue__actions">
                <Button size="sm" variant="outline" @click="selectAlert(item.id)">设为当前</Button>
                <Button
                  size="sm"
                  @click="
                    goToWorkorder(item.nextStep === '判断是否复飞' ? 'refly' : 'workorder', item.id)
                  "
                >
                  {{ item.nextStep === "判断是否复飞" ? "安排补飞" : "转工单" }}
                </Button>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="alert-verify-card border-border/70 shadow-none">
        <CardHeader class="alert-verify-card__header">
          <div>
            <CardTitle>核实工作流</CardTitle>
            <CardDescription>按步骤完成核实。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="alert-verify-card__content">
          <div class="verify-flow">
            <article v-for="item in verifySteps" :key="item.title" class="verify-flow__item">
              <div class="verify-flow__index">{{ item.index }}</div>
              <div class="verify-flow__body">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="alert-verify-grid alert-verify-grid--secondary">
      <Card class="alert-verify-card border-border/70 shadow-none">
        <CardHeader class="alert-verify-card__header">
          <div>
            <CardTitle>核实结果</CardTitle>
            <CardDescription>查看不同处理结果。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="alert-verify-card__content">
          <div class="verify-result-list">
            <article v-for="item in verifyOutcomes" :key="item.title" class="verify-result-item">
              <div class="verify-result-item__meta">
                <Badge :variant="item.variant">{{ item.type }}</Badge>
                <span>{{ item.owner }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card class="alert-verify-card border-border/70 shadow-none">
        <CardHeader class="alert-verify-card__header">
          <div>
            <CardTitle>快捷入口</CardTitle>
            <CardDescription>常用入口。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="alert-verify-card__content">
          <div class="verify-quick-actions">
            <Button
              v-for="item in quickActions"
              :key="item.path"
              variant="outline"
              class="verify-quick-actions__button"
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
import { alertWorkflowItems, getAlertWorkflowItem, type AlertDisposition } from "../workflow-data";

defineOptions({ name: "AlertVerify" });

const router = useRouter();
const route = useRoute();

const verifySummary = {
  pending: 9,
  evidenceReady: 5,
  completed: 8,
  needsRefly: 3,
};

const activeAlertId = computed(() => {
  const raw = Number(route.query.alertId ?? alertWorkflowItems[0]?.id ?? 0);
  return Number.isFinite(raw) && raw > 0 ? raw : (alertWorkflowItems[0]?.id ?? 0);
});

const activeAlert = computed(() => getAlertWorkflowItem(activeAlertId.value));

const queueItems = computed(() => {
  return [...alertWorkflowItems].sort((a, b) => {
    if (a.id === activeAlertId.value) return -1;
    if (b.id === activeAlertId.value) return 1;
    return a.id - b.id;
  });
});

const verifySteps = [
  {
    index: "01",
    title: "确认来源与等级",
    description: "确认预警来源、区域和等级。",
  },
  {
    index: "02",
    title: "补齐关键证据",
    description: "补充截图、视频或轨迹资料。",
  },
  {
    index: "03",
    title: "确定处理方式",
    description: "确定关闭、派单或补飞。",
  },
] as const;

const verifyOutcomes = [
  {
    type: "直接闭环",
    variant: "outline" as const,
    owner: "复盘组",
    title: "证据明确且误报成立",
    description: "记录结果后直接关闭。",
  },
  {
    type: "派工单",
    variant: "destructive" as const,
    owner: "值守台",
    title: "异常成立且需要现场处置",
    description: "转为工单并附上现场资料。",
  },
  {
    type: "安排补飞",
    variant: "secondary" as const,
    owner: "调度台",
    title: "证据不足以做最终判断",
    description: "安排补飞或补采资料。",
  },
] as const;

const quickActions = [
  { label: "返回预警中心", path: "/alert/center" },
  { label: "查看飞行记录", path: "/flight/record" },
  { label: "打开工单中心", path: "/workorder/center" },
  { label: "返回首页", path: "/dashboard" },
] as const;

function goTo(path: string) {
  router.push(path);
}

function selectAlert(alertId: number) {
  router.push({
    path: "/alert/verify",
    query: {
      ...route.query,
      alertId: String(alertId),
    },
  });
}

function goToWorkorder(disposition: AlertDisposition, alertId = activeAlertId.value) {
  router.push({
    path: "/workorder/center",
    query: {
      alertId: String(alertId),
      disposition,
    },
  });
}

function closeAlert() {
  router.push({
    path: "/workorder/center",
    query: {
      alertId: String(activeAlertId.value),
      disposition: "close",
    },
  });
}
</script>

<style scoped lang="scss">
.alert-verify-page__hero {
  min-height: 250px;
}

.alert-verify-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  gap: 16px;
}

.alert-verify-grid--secondary {
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
}

.alert-verify-card {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(9, 9, 11, 0.05);
}

.alert-verify-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.alert-verify-card__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.verify-focus-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.verify-focus-card__body h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--foreground);
}

.verify-focus-card__body p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.verify-focus-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.verify-focus-card__meta span {
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

.verify-focus-card__actions,
.verify-queue__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.verify-queue,
.verify-result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.verify-queue__item,
.verify-result-item {
  padding: 15px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.verify-queue__item--active {
  border-color: color-mix(in srgb, var(--ring) 32%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ring) 20%, transparent);
}

.verify-queue__meta,
.verify-result-item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.verify-queue__meta span,
.verify-result-item__meta span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.verify-queue__item h3,
.verify-result-item h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.verify-queue__item p,
.verify-result-item p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.verify-queue__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.verify-queue__foot span {
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

.verify-queue__actions {
  margin-top: 12px;
}

.verify-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.verify-flow__item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 14px;
  align-items: flex-start;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  border-radius: 18px;
}

.verify-flow__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--foreground);
  background: color-mix(in srgb, var(--secondary) 88%, transparent);
  border-radius: 16px;
}

.verify-flow__body h3 {
  margin: 2px 0 0;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.verify-flow__body p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--muted-foreground);
}

.verify-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.verify-quick-actions__button {
  justify-content: flex-start;
  min-height: 44px;
}

@media (max-width: 1200px) {
  .alert-verify-grid,
  .alert-verify-grid--secondary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .verify-focus-card {
    grid-template-columns: 1fr;
  }

  .verify-focus-card__actions,
  .verify-queue__actions,
  .verify-quick-actions {
    flex-direction: column;
    grid-template-columns: 1fr;
  }
}
</style>
