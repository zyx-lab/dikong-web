<template>
  <div class="video-stage__overlay video-stage__overlay--top">
    <div class="video-status-bar__cluster">
      <Badge variant="secondary">{{ droneName }}</Badge>
      <Badge variant="secondary">{{ batteryPercent }}%</Badge>
      <Badge variant="secondary">Frame {{ currentFrameIndex + 1 }} / {{ poseFrameCount }}</Badge>
      <Badge v-if="radarReady" variant="outline">
        Wind {{ radarFrameIndex + 1 }} / {{ radarFrameCount }}
      </Badge>
    </div>
    <div class="video-status-bar__focus">
      <span class="video-status-bar__focus-label">投影视角</span>
      <Badge variant="outline">FoV {{ projectorFov.toFixed(1) }}°</Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";

defineProps<{
  droneName: string;
  batteryPercent: number;
  currentFrameIndex: number;
  poseFrameCount: number;
  radarReady: boolean;
  radarFrameIndex: number;
  radarFrameCount: number;
  projectorFov: number;
}>();
</script>

<style scoped lang="scss">
.video-status-bar__cluster {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.video-status-bar__focus {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px 6px 10px;
  background: var(--record-surface-strong, rgba(9, 9, 11, 0.74));
  border: 1px solid var(--record-border-soft, rgba(255, 255, 255, 0.12));
  border-radius: 999px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(12px);
}

.video-status-bar__focus-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--record-ink-muted, rgba(244, 244, 245, 0.72));
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

@media (max-width: 768px) {
  .video-status-bar__focus {
    justify-content: space-between;
    width: 100%;
  }
}
</style>
