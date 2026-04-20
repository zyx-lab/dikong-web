<template>
  <div class="video-stage__overlay video-stage__overlay--top">
    <div class="video-stage__tag-group">
      <Badge variant="secondary">{{ droneName }}</Badge>
      <Badge variant="secondary">{{ batteryPercent }}%</Badge>
      <Badge variant="secondary">Frame {{ currentFrameIndex + 1 }} / {{ poseFrameCount }}</Badge>
      <Badge v-if="radarReady" variant="outline">
        Wind {{ radarFrameIndex + 1 }} / {{ radarFrameCount }}
      </Badge>
    </div>
    <Badge variant="outline">FoV {{ projectorFov.toFixed(1) }}°</Badge>
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
