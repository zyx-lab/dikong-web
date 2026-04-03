<template>
  <section class="drone-online-panel">
    <header class="drone-online-panel__header">
      <span class="drone-online-panel__title">无人机在线态势</span>
      <div class="drone-online-panel__summary">
        <div class="drone-online-panel__summary-item">
          <span>在线</span>
          <strong>{{ model.summary.onlineCount }}</strong>
        </div>
        <div class="drone-online-panel__summary-item">
          <span>可调度</span>
          <strong>{{ model.summary.dispatchableCount }}</strong>
        </div>
        <div class="drone-online-panel__summary-item">
          <span>待命</span>
          <strong>{{ model.summary.standbyCount }}</strong>
        </div>
      </div>
    </header>

    <div class="drone-online-panel__rows">
      <article
        v-for="row in model.rows"
        :key="row.id"
        class="drone-online-panel__row"
        data-testid="drone-row"
      >
        <strong>{{ row.droneName }}</strong>
        <div>{{ row.currentLabel }}</div>
        <span>{{ row.statusLabel }}</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DroneOnlinePanelModel } from "../types";

defineProps<{
  model: DroneOnlinePanelModel;
}>();
</script>
