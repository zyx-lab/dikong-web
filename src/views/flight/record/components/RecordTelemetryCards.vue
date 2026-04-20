<template>
  <div class="telemetry-stats">
    <Card class="metric-card border-border/70 shadow-none">
      <CardContent class="metric-card__content">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">距地高度</div>
        <div class="mt-2 text-2xl font-semibold text-foreground">
          {{ currentAltitude }}
          <span class="text-sm text-muted-foreground">m</span>
        </div>
      </CardContent>
    </Card>

    <Card class="metric-card border-border/70 shadow-none">
      <CardContent class="metric-card__content">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">速度</div>
        <div class="mt-2 text-2xl font-semibold text-foreground">
          {{ currentSpeed }}
          <span class="text-sm text-muted-foreground">m/s</span>
        </div>
      </CardContent>
    </Card>

    <Card class="metric-card metric-card--control border-border/70 shadow-none">
      <CardContent class="metric-card__content">
        <div class="projection-control">
          <div class="projection-control__header">
            <span>视频 FoV</span>
            <span>{{ projectorFov.toFixed(1) }}°</span>
          </div>
          <el-slider
            v-model="projectorFovModel"
            :min="20"
            :max="80"
            :step="0.5"
            :show-tooltip="false"
          />
        </div>
      </CardContent>
    </Card>

    <Card class="metric-card metric-card--control border-border/70 shadow-none">
      <CardContent class="metric-card__content">
        <div class="projection-control">
          <div class="projection-control__header">
            <span>投影混合</span>
            <span>{{ projectionOpacity.toFixed(2) }}</span>
          </div>
          <el-slider
            v-model="projectionOpacityModel"
            :min="0"
            :max="1"
            :step="0.01"
            :show-tooltip="false"
          />
          <div class="projection-control__switch">
            <span>显示 JNU.obj</span>
            <el-switch v-model="showProjectionMeshModel" />
          </div>
          <div class="projection-control__switch">
            <span>调试投影</span>
            <el-switch v-model="debugProjectionModeModel" />
          </div>
          <div class="projection-control__switch">
            <span>显示投影相机</span>
            <el-switch v-model="showProjectorHelperModel" />
          </div>
          <div class="projection-control__switch">
            <span>显示无人机</span>
            <el-switch v-model="showDroneModelModel" />
          </div>
          <div class="projection-control__switch">
            <span>无人机调试</span>
            <el-switch v-model="debugDroneModelModel" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Card, CardContent } from "@/components/ui/card";

const props = defineProps<{
  currentAltitude: number;
  currentSpeed: number;
  projectorFov: number;
  projectionOpacity: number;
  showProjectionMesh: boolean;
  debugProjectionMode: boolean;
  showProjectorHelper: boolean;
  showDroneModel: boolean;
  debugDroneModel: boolean;
}>();

const emit = defineEmits<{
  "update:projectorFov": [value: number];
  "update:projectionOpacity": [value: number];
  "update:showProjectionMesh": [value: boolean];
  "update:debugProjectionMode": [value: boolean];
  "update:showProjectorHelper": [value: boolean];
  "update:showDroneModel": [value: boolean];
  "update:debugDroneModel": [value: boolean];
}>();

const projectorFovModel = computed({
  get: () => props.projectorFov,
  set: (value: number) => emit("update:projectorFov", value),
});

const projectionOpacityModel = computed({
  get: () => props.projectionOpacity,
  set: (value: number) => emit("update:projectionOpacity", value),
});

const showProjectionMeshModel = computed({
  get: () => props.showProjectionMesh,
  set: (value: boolean) => emit("update:showProjectionMesh", value),
});

const debugProjectionModeModel = computed({
  get: () => props.debugProjectionMode,
  set: (value: boolean) => emit("update:debugProjectionMode", value),
});

const showProjectorHelperModel = computed({
  get: () => props.showProjectorHelper,
  set: (value: boolean) => emit("update:showProjectorHelper", value),
});

const showDroneModelModel = computed({
  get: () => props.showDroneModel,
  set: (value: boolean) => emit("update:showDroneModel", value),
});

const debugDroneModelModel = computed({
  get: () => props.debugDroneModel,
  set: (value: boolean) => emit("update:debugDroneModel", value),
});
</script>
