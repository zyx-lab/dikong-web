<template>
  <div>
    <div class="map-panel__badge">{{ locationLabel }}</div>
    <div class="map-panel__switches">
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
