<template>
  <div class="telemetry-cards">
    <Card class="telemetry-card">
      <CardContent class="telemetry-card__content">
        <div class="telemetry-card__eyebrow">距地高度</div>
        <div class="telemetry-card__value">
          {{ currentAltitude }}
          <span>m</span>
        </div>
        <div class="telemetry-card__hint">实时采样</div>
      </CardContent>
    </Card>

    <Card class="telemetry-card">
      <CardContent class="telemetry-card__content">
        <div class="telemetry-card__eyebrow">速度</div>
        <div class="telemetry-card__value">
          {{ currentSpeed }}
          <span>m/s</span>
        </div>
        <div class="telemetry-card__hint">机载回传</div>
      </CardContent>
    </Card>

    <Card class="telemetry-card telemetry-card--control">
      <CardContent class="telemetry-card__content telemetry-card__content--control">
        <div class="telemetry-control">
          <div class="telemetry-control__header">
            <div>
              <div class="telemetry-control__title">视频 FoV</div>
              <p class="telemetry-control__description">
                微调投影视角，让视频投影和三维场景更贴合。
              </p>
            </div>
            <Badge variant="outline">{{ projectorFov.toFixed(1) }}°</Badge>
          </div>
          <div class="telemetry-control__slider-wrap">
            <el-slider
              v-model="projectorFovModel"
              class="telemetry-control__slider"
              :min="20"
              :max="80"
              :step="0.5"
              :show-tooltip="false"
            />
            <div class="telemetry-control__range">
              <span>20°</span>
              <span>80°</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="telemetry-card telemetry-card--control">
      <CardContent class="telemetry-card__content telemetry-card__content--control">
        <div class="telemetry-control">
          <div class="telemetry-control__header">
            <div>
              <div class="telemetry-control__title">投影混合</div>
              <p class="telemetry-control__description">
                调整视频投影强度，并控制调试辅助图层的显示。
              </p>
            </div>
            <Badge variant="secondary">{{ projectionOpacity.toFixed(2) }}</Badge>
          </div>
          <div class="telemetry-control__slider-wrap">
            <el-slider
              v-model="projectionOpacityModel"
              class="telemetry-control__slider"
              :min="0"
              :max="1"
              :step="0.01"
              :show-tooltip="false"
            />
            <div class="telemetry-control__range">
              <span>0.00</span>
              <span>1.00</span>
            </div>
          </div>

          <Separator />

          <div class="telemetry-switch-list">
            <div class="telemetry-switch-row">
              <div class="telemetry-switch-copy">
                <div class="telemetry-switch-copy__title">显示 JNU.obj</div>
                <p class="telemetry-switch-copy__description">
                  显示场景遮挡网格，便于观察投影覆盖。
                </p>
              </div>
              <el-switch v-model="showProjectionMeshModel" />
            </div>
            <div class="telemetry-switch-row">
              <div class="telemetry-switch-copy">
                <div class="telemetry-switch-copy__title">调试投影</div>
                <p class="telemetry-switch-copy__description">
                  突出投影贴合区域，方便排查偏移问题。
                </p>
              </div>
              <el-switch v-model="debugProjectionModeModel" />
            </div>
            <div class="telemetry-switch-row">
              <div class="telemetry-switch-copy">
                <div class="telemetry-switch-copy__title">显示投影相机</div>
                <p class="telemetry-switch-copy__description">在三维场景中显示当前投影相机位置。</p>
              </div>
              <el-switch v-model="showProjectorHelperModel" />
            </div>
            <div class="telemetry-switch-row">
              <div class="telemetry-switch-copy">
                <div class="telemetry-switch-copy__title">显示无人机</div>
                <p class="telemetry-switch-copy__description">
                  在场景里显示无人机模型，便于理解姿态。
                </p>
              </div>
              <el-switch v-model="showDroneModelModel" />
            </div>
            <div class="telemetry-switch-row">
              <div class="telemetry-switch-copy">
                <div class="telemetry-switch-copy__title">无人机调试</div>
                <p class="telemetry-switch-copy__description">显示无人机模型调试辅助信息。</p>
              </div>
              <el-switch v-model="debugDroneModelModel" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Separator from "@/components/ui/separator/Separator.vue";

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

<style scoped lang="scss">
.telemetry-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.telemetry-card {
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(9, 9, 11, 0.05);
}

.telemetry-card__content {
  padding: 16px;
}

.telemetry-card__content--control {
  padding: 16px;
}

.telemetry-card__eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.telemetry-card__value {
  display: flex;
  gap: 6px;
  align-items: baseline;
  margin-top: 10px;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--foreground);
  letter-spacing: -0.04em;

  span {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--muted-foreground);
    letter-spacing: 0;
  }
}

.telemetry-card__hint {
  margin-top: 10px;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.telemetry-control {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.telemetry-control__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.telemetry-control__title {
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--foreground);
}

.telemetry-control__description {
  margin-top: 4px;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

.telemetry-control__slider-wrap {
  padding: 12px 12px 10px;
  background: color-mix(in srgb, var(--muted) 58%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
  border-radius: 14px;
}

.telemetry-control__range {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.telemetry-switch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.telemetry-switch-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: color-mix(in srgb, var(--background) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
  border-radius: 14px;
}

.telemetry-switch-copy {
  min-width: 0;
}

.telemetry-switch-copy__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
}

.telemetry-switch-copy__description {
  margin-top: 4px;
  font-size: 0.75rem;
  line-height: 1.55;
  color: var(--muted-foreground);
}

.telemetry-control :deep(.el-slider__runway) {
  height: 6px;
  background: color-mix(in srgb, var(--border) 88%, transparent);
}

.telemetry-control :deep(.el-slider__bar) {
  height: 6px;
  background-color: var(--chart-3);
}

.telemetry-control :deep(.el-slider__button) {
  width: 14px;
  height: 14px;
  background: var(--card);
  border: 3px solid var(--chart-3);
}

.telemetry-control :deep(.el-switch) {
  --el-switch-on-color: var(--chart-3);
  --el-switch-off-color: color-mix(in srgb, var(--muted-foreground) 26%, transparent);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .telemetry-switch-row {
    align-items: flex-start;
  }
}
</style>
