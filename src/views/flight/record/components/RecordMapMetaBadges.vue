<template>
  <div class="map-meta-panel">
    <div class="map-meta-panel__location">
      <div class="map-meta-panel__eyebrow">巡检区域</div>
      <div class="map-meta-panel__label">{{ locationLabel }}</div>
    </div>
    <div class="map-meta-panel__badges">
      <Badge variant="secondary">Spark Snapshot</Badge>
      <Badge variant="outline">Fixed Camera</Badge>
      <Badge variant="outline">{{ trajectoryPointCount }} pts</Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";

defineProps<{
  locationLabel: string;
  trajectoryPointCount: number;
}>();
</script>

<style scoped lang="scss">
.map-meta-panel {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 4;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
}

.map-meta-panel__location {
  max-width: min(320px, 100%);
  padding: 10px 12px;
  color: var(--record-ink-on-dark, #fafafa);
  background: var(--record-surface-strong, rgba(9, 9, 11, 0.74));
  border: 1px solid var(--record-border-soft, rgba(255, 255, 255, 0.12));
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(14px);
}

.map-meta-panel__eyebrow {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--record-ink-muted, rgba(244, 244, 245, 0.72));
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.map-meta-panel__label {
  margin-top: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5;
}

.map-meta-panel__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .map-meta-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .map-meta-panel__location {
    max-width: none;
  }

  .map-meta-panel__badges {
    justify-content: flex-start;
  }
}
</style>
