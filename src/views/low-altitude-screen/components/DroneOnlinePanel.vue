<template>
  <section class="screen-panel panel-block resource-panel">
    <div class="panel-heading">
      <span class="panel-heading__dot"></span>
      <h3>资源保障</h3>
    </div>

    <div class="screen-panel__body">
      <div class="metric-grid metric-grid--double">
        <article
          v-for="metric in model.metrics"
          :key="metric.id"
          :class="['metric-card', `is-${metric.accent ?? 'cyan'}`]"
          data-testid="resource-metric-card"
        >
          <span class="metric-card__label">{{ metric.label }}</span>
          <strong class="metric-card__value">{{ metric.value }}</strong>
          <span v-if="metric.note" class="metric-card__note">{{ metric.note }}</span>
        </article>
      </div>

      <section class="screen-section screen-section--fill">
        <div class="screen-section__title">当前值守无人机</div>
        <div class="feed-list feed-list--fixed">
          <article
            v-for="drone in model.dutyDrones"
            :key="drone.id"
            class="feed-item feed-item--single-line"
            data-testid="resource-drone-item"
          >
            <strong class="feed-item__title">{{ drone.droneName }}</strong>
            <span :class="['status-pill', `is-${drone.statusTone ?? 'cyan'}`]">
              {{ drone.statusText }}
            </span>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DroneOnlinePanelModel } from "../types";

defineProps<{
  model: DroneOnlinePanelModel;
}>();
</script>
