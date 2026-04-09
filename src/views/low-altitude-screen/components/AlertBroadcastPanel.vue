<template>
  <section class="screen-panel panel-block alert-warning-panel">
    <div class="panel-heading">
      <span class="panel-heading__dot"></span>
      <h3>异常告警</h3>
    </div>

    <div class="screen-panel__body">
      <section class="headline-metric" data-testid="alert-headline-metric">
        <span class="headline-metric__label">待核实告警</span>
        <strong class="headline-metric__value">{{ model.pendingCount }}</strong>
      </section>

      <section class="screen-section">
        <div class="screen-section__title">闭环进度</div>
        <div class="progress-card">
          <div class="progress-card__row">
            <span class="progress-card__label">已闭环</span>
            <strong class="progress-card__value">
              {{ model.closureDone }} / {{ model.closureTotal }}
            </strong>
          </div>
          <div class="progress-card__bar">
            <span
              class="progress-card__fill"
              :style="{ width: `${Math.max(model.closureRate * 100, 8)}%` }"
            />
          </div>
        </div>
      </section>

      <section class="screen-section screen-section--fill">
        <div class="screen-section__title">最近异常事件</div>
        <div class="feed-list feed-list--auto">
          <article
            v-for="event in model.events"
            :key="event.id"
            class="feed-item feed-item--two-line"
            data-testid="alert-event-item"
          >
            <div class="feed-item__row">
              <strong class="feed-item__title">{{ event.title }}</strong>
              <span :class="['status-pill', `is-${event.statusTone ?? 'cyan'}`]">
                {{ event.statusText }}
              </span>
            </div>
            <div class="feed-item__row feed-item__row--subtle">
              <span class="feed-item__meta">{{ event.happenedAt }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlertBroadcastPanelModel } from "../types";

defineProps<{
  model: AlertBroadcastPanelModel;
}>();
</script>
