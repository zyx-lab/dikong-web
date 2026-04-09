<template>
  <section class="screen-panel panel-block task-overview-panel">
    <div class="panel-heading">
      <span class="panel-heading__dot"></span>
      <h3>任务总览</h3>
    </div>

    <div class="screen-panel__body">
      <div class="metric-grid metric-grid--quad">
        <article
          v-for="metric in model.metrics"
          :key="metric.id"
          :class="['metric-card', `is-${metric.accent ?? 'cyan'}`]"
          data-testid="task-overview-metric-card"
        >
          <span class="metric-card__label">{{ metric.label }}</span>
          <strong class="metric-card__value">{{ metric.value }}</strong>
          <span v-if="metric.note" class="metric-card__note">{{ metric.note }}</span>
        </article>
      </div>

      <section class="screen-section">
        <div class="screen-section__title">任务状态分布</div>
        <div class="status-list">
          <article
            v-for="status in model.statusRows"
            :key="status.id"
            class="status-row"
            data-testid="task-status-row"
          >
            <span class="status-row__label">{{ status.label }}</span>
            <div class="status-row__bar">
              <span
                :class="['status-row__fill', `is-${status.accent ?? 'cyan'}`]"
                :style="{ width: `${Math.max(status.ratio * 100, 8)}%` }"
              />
            </div>
            <strong class="status-row__value">{{ status.value }}</strong>
          </article>
        </div>
      </section>

      <section class="screen-section screen-section--fill">
        <div class="screen-section__title">当前执行任务</div>
        <div class="feed-list feed-list--auto">
          <article
            v-for="task in model.runningTasks"
            :key="task.id"
            class="feed-item feed-item--two-line"
            data-testid="task-running-item"
          >
            <div class="feed-item__row">
              <strong class="feed-item__title">{{ task.taskName }}</strong>
              <span :class="['status-pill', `is-${task.statusTone ?? 'cyan'}`]">
                {{ task.statusText }}
              </span>
            </div>
            <div class="feed-item__row feed-item__row--subtle">
              <span class="feed-item__meta">{{ task.droneName }}</span>
              <span class="feed-item__meta">{{ task.scheduleText }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TaskSituationPanelModel } from "../types";

defineProps<{
  model: TaskSituationPanelModel;
}>();
</script>
