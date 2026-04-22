<template>
  <div class="flight-log-list-scroll">
    <div class="flight-log-list">
      <div v-for="(item, index) in logs" :key="item.id" class="flight-log-list__item">
        <div class="flight-log-list__rail" aria-hidden="true">
          <span class="flight-log-list__dot" :class="`is-${item.level}`" />
          <span v-if="index < logs.length - 1" class="flight-log-list__line" />
        </div>
        <div class="flight-log-list__card">
          <div class="flight-log-list__meta">
            <Badge :variant="getBadgeVariant(item.level)">
              {{ getLevelLabel(item.level) }}
            </Badge>
            <span class="flight-log-list__time">{{ item.time }}</span>
          </div>
          <p class="flight-log-list__content">{{ item.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import type { FlightLogItem } from "@/views/flight/record/data";

defineProps<{
  logs: FlightLogItem[];
}>();

function getLevelLabel(level: FlightLogItem["level"]) {
  if (level === "danger") {
    return "严重";
  }

  if (level === "warning") {
    return "提醒";
  }

  return "正常";
}

function getBadgeVariant(level: FlightLogItem["level"]) {
  if (level === "danger") {
    return "destructive";
  }

  if (level === "warning") {
    return "secondary";
  }

  return "outline";
}
</script>

<style scoped lang="scss">
.flight-log-list-scroll {
  max-height: 360px;
  padding-right: 4px;
  overflow: auto;
}

.flight-log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0 4px;
}

.flight-log-list__item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.flight-log-list__rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.flight-log-list__dot {
  position: relative;
  z-index: 1;
  width: 10px;
  height: 10px;
  margin-top: 15px;
  background: var(--muted-foreground);
  border: 2px solid var(--background);
  border-radius: 999px;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--muted) 70%, transparent);

  &.is-danger {
    background: var(--destructive);
  }

  &.is-warning {
    background: var(--chart-5);
  }

  &.is-info {
    background: var(--primary);
  }
}

.flight-log-list__line {
  position: absolute;
  top: 28px;
  bottom: -14px;
  left: 50%;
  width: 1px;
  background: color-mix(in srgb, var(--border) 88%, transparent);
  transform: translateX(-50%);
}

.flight-log-list__card {
  padding: 12px 14px;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(9, 9, 11, 0.04);
}

.flight-log-list__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.flight-log-list__time {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--muted-foreground);
  letter-spacing: 0.02em;
}

.flight-log-list__content {
  margin-top: 10px;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--foreground);
}
</style>
