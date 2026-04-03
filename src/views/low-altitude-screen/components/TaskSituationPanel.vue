<template>
  <section class="task-situation-panel">
    <header class="task-situation-panel__header">
      <span class="task-situation-panel__title">任务态势</span>
      <div class="task-situation-panel__summary">
        <div class="task-situation-panel__summary-item">
          <span class="task-situation-panel__summary-label">今日任务</span>
          <strong class="task-situation-panel__summary-value">
            {{ model.summary.todayCount }}
          </strong>
        </div>
        <div class="task-situation-panel__summary-item">
          <span class="task-situation-panel__summary-label">执行中</span>
          <strong class="task-situation-panel__summary-value">
            {{ model.summary.executingCount }}
          </strong>
        </div>
      </div>
    </header>

    <div class="task-situation-panel__rows">
      <article v-for="row in model.rows" :key="row.id" class="task-situation-panel__row">
        <div class="task-situation-panel__row-head">
          <strong>{{ row.taskName }}</strong>
          <span>{{ row.statusLabel }}</span>
        </div>
        <div>{{ row.routeName }}</div>
        <div>{{ row.startTime }}</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TaskSituationPanelModel } from "../types";

defineProps<{
  model: TaskSituationPanelModel;
}>();
</script>
