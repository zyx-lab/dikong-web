<template>
  <section class="alert-broadcast-panel">
    <header class="alert-broadcast-panel__header">
      <span class="alert-broadcast-panel__title">重点告警</span>
      <div class="alert-broadcast-panel__summary">
        <div class="alert-broadcast-panel__summary-item">
          <span>总数</span>
          <strong>{{ model.summary.totalCount }}</strong>
        </div>
        <div class="alert-broadcast-panel__summary-item">
          <span>高等级</span>
          <strong>{{ model.summary.highLevelCount }}</strong>
        </div>
        <div class="alert-broadcast-panel__summary-item">
          <span>跟踪中</span>
          <strong>{{ model.summary.trackingCount }}</strong>
        </div>
      </div>
    </header>

    <div class="alert-broadcast-panel__rows">
      <article
        v-for="row in model.rows"
        :key="row.id"
        class="alert-broadcast-panel__row"
        data-testid="alert-row"
      >
        <strong>{{ row.title }}</strong>
        <span>{{ row.levelLabel }}</span>
        <div>{{ row.happenedAt }}</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlertBroadcastPanelModel } from "../types";

defineProps<{
  model: AlertBroadcastPanelModel;
}>();
</script>
