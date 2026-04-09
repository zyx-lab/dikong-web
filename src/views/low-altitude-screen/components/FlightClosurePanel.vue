<template>
  <section class="screen-panel panel-block flight-closure-panel">
    <div class="panel-heading">
      <span class="panel-heading__dot"></span>
      <h3>飞行闭环</h3>
    </div>

    <div class="screen-panel__body">
      <div class="metric-grid metric-grid--quad">
        <article
          v-for="metric in model.metrics"
          :key="metric.id"
          :class="['metric-card', `is-${metric.accent ?? 'cyan'}`]"
          data-testid="flight-metric-card"
        >
          <span class="metric-card__label">{{ metric.label }}</span>
          <strong class="metric-card__value">{{ metric.value }}</strong>
        </article>
      </div>

      <section class="screen-section screen-section--fill">
        <div class="screen-section__title">最近异常飞行</div>
        <div class="feed-list feed-list--auto">
          <article
            v-for="flight in model.abnormalFlights"
            :key="flight.id"
            class="feed-item feed-item--two-line"
            data-testid="flight-abnormal-item"
          >
            <div class="feed-item__row">
              <strong class="feed-item__title">{{ flight.taskName }}</strong>
              <span :class="['status-pill', `is-${flight.statusTone ?? 'cyan'}`]">
                {{ flight.statusText }}
              </span>
            </div>
            <div class="feed-item__row feed-item__row--spread feed-item__row--subtle">
              <span class="feed-item__meta">{{ flight.droneName }}</span>
              <span class="feed-item__badge">告警 {{ flight.alertCount }}</span>
              <span class="feed-item__meta">{{ flight.executeTime }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FlightClosurePanelModel } from "../types";

defineProps<{
  model: FlightClosurePanelModel;
}>();
</script>
