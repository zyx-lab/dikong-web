<template>
  <section class="panel-block scene-calibration-panel" data-testid="scene-calibration-panel">
    <div class="panel-heading">
      <span class="panel-heading__dot"></span>
      <h3>模型落位校准</h3>
    </div>

    <div class="scene-calibration-panel__body">
      <p class="scene-calibration-panel__intro">
        先调姿态，再调经纬度与抬高高度，最后用东/北/上偏移做微调。X 轴对应 Pitch，Y 轴对应
        Heading，Z 轴对应 Roll。
      </p>

      <div class="scene-calibration-panel__grid">
        <label class="scene-calibration-panel__field">
          <span>经度</span>
          <input
            name="anchorLng"
            type="number"
            step="0.000001"
            :value="modelValue.anchorLng"
            @change="updateNumberField('anchorLng', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>纬度</span>
          <input
            name="anchorLat"
            type="number"
            step="0.000001"
            :value="modelValue.anchorLat"
            @change="updateNumberField('anchorLat', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>抬高高度</span>
          <input
            name="heightOffsetMeters"
            type="number"
            step="0.1"
            :value="modelValue.heightOffsetMeters"
            @change="updateNumberField('heightOffsetMeters', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>统一缩放</span>
          <input
            name="scale"
            type="number"
            step="0.01"
            :value="modelValue.scale"
            @change="updateNumberField('scale', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>Heading (Y)</span>
          <input
            name="headingDeg"
            type="number"
            step="0.1"
            :value="modelValue.headingDeg"
            @change="updateNumberField('headingDeg', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>Pitch (X)</span>
          <input
            name="pitchDeg"
            type="number"
            step="0.1"
            :value="modelValue.pitchDeg"
            @change="updateNumberField('pitchDeg', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>Roll (Z)</span>
          <input
            name="rollDeg"
            type="number"
            step="0.1"
            :value="modelValue.rollDeg"
            @change="updateNumberField('rollDeg', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>东向偏移</span>
          <input
            name="eastMeters"
            type="number"
            step="0.1"
            :value="modelValue.eastMeters"
            @change="updateNumberField('eastMeters', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>上向偏移</span>
          <input
            name="upMeters"
            type="number"
            step="0.1"
            :value="modelValue.upMeters"
            @change="updateNumberField('upMeters', $event)"
          />
        </label>

        <label class="scene-calibration-panel__field">
          <span>北向偏移</span>
          <input
            name="northMeters"
            type="number"
            step="0.1"
            :value="modelValue.northMeters"
            @change="updateNumberField('northMeters', $event)"
          />
        </label>
      </div>

      <div class="scene-calibration-panel__quick-ops">
        <div class="scene-calibration-panel__axis-group">
          <div class="scene-calibration-panel__axis-title">X 轴 / Pitch</div>
          <div class="scene-calibration-panel__axis-actions">
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="rotate-pitch-minus-90"
              @click="rotateField('pitchDeg', -90)"
            >
              -90°
            </button>
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="rotate-pitch-plus-90"
              @click="rotateField('pitchDeg', 90)"
            >
              +90°
            </button>
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="flip-pitch"
              @click="rotateField('pitchDeg', 180)"
            >
              翻转
            </button>
          </div>
        </div>

        <div class="scene-calibration-panel__axis-group">
          <div class="scene-calibration-panel__axis-title">Y 轴 / Heading</div>
          <div class="scene-calibration-panel__axis-actions">
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="rotate-heading-minus-90"
              @click="rotateField('headingDeg', -90)"
            >
              -90°
            </button>
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="rotate-heading-plus-90"
              @click="rotateField('headingDeg', 90)"
            >
              +90°
            </button>
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="flip-heading"
              @click="rotateField('headingDeg', 180)"
            >
              翻转
            </button>
          </div>
        </div>

        <div class="scene-calibration-panel__axis-group">
          <div class="scene-calibration-panel__axis-title">Z 轴 / Roll</div>
          <div class="scene-calibration-panel__axis-actions">
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="rotate-roll-minus-90"
              @click="rotateField('rollDeg', -90)"
            >
              -90°
            </button>
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="rotate-roll-plus-90"
              @click="rotateField('rollDeg', 90)"
            >
              +90°
            </button>
            <button
              type="button"
              class="scene-calibration-panel__chip"
              data-testid="flip-roll"
              @click="rotateField('rollDeg', 180)"
            >
              翻转
            </button>
          </div>
        </div>
      </div>

      <div class="scene-calibration-panel__actions">
        <button type="button" class="scene-calibration-panel__action" @click="resetPlacement">
          重置默认值
        </button>
        <button type="button" class="scene-calibration-panel__action" @click="copyPlacement">
          复制 placement JSON
        </button>
        <button
          type="button"
          class="scene-calibration-panel__action"
          :disabled="!cameraViewSnapshot"
          @click="copyCameraView"
        >
          复制当前视角 JSON
        </button>
      </div>

      <div class="scene-calibration-panel__preview">
        <div class="scene-calibration-panel__preview-title">当前 placement</div>
        <pre data-testid="scene-calibration-json">{{ previewJson }}</pre>
      </div>

      <p class="scene-calibration-panel__hint">
        {{ copyFeedback || "拖动地图相机观察模型位置，快速旋转会实时作用到 3DGS 场景。" }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { SceneHomeViewConfig, SceneSplatPlacement } from "../types";
import { cloneSceneSplatPlacement } from "../scene/geospatial";

type PlacementField =
  | "anchorLng"
  | "anchorLat"
  | "heightOffsetMeters"
  | "eastMeters"
  | "northMeters"
  | "upMeters"
  | "headingDeg"
  | "pitchDeg"
  | "rollDeg"
  | "scale";

const props = defineProps<{
  cameraViewSnapshot?: SceneHomeViewConfig;
  defaultPlacement: SceneSplatPlacement;
  modelValue: SceneSplatPlacement;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SceneSplatPlacement];
}>();

const copyFeedback = ref("");
const previewJson = computed(() => JSON.stringify(props.modelValue, null, 2));
const cameraViewPreviewJson = computed(() =>
  props.cameraViewSnapshot ? JSON.stringify(props.cameraViewSnapshot, null, 2) : ""
);

function normalizeAngle(value: number) {
  const normalized = ((((value + 180) % 360) + 360) % 360) - 180;
  return normalized === -180 ? 180 : Number(normalized.toFixed(3));
}

function readNumber(event: Event, fallbackValue: number) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return fallbackValue;
  const parsed = Number(target.value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function emitPlacement(nextPlacement: SceneSplatPlacement) {
  emit("update:modelValue", nextPlacement);
  copyFeedback.value = "";
}

function updateNumberField(field: PlacementField, event: Event) {
  emitPlacement({
    ...props.modelValue,
    [field]: readNumber(event, props.modelValue[field]),
  });
}

function rotateField(field: "headingDeg" | "pitchDeg" | "rollDeg", delta: number) {
  emitPlacement({
    ...props.modelValue,
    [field]: normalizeAngle(props.modelValue[field] + delta),
  });
}

function resetPlacement() {
  emitPlacement(cloneSceneSplatPlacement(props.defaultPlacement));
  copyFeedback.value = "placement 已恢复默认值。";
}

async function copyText(text: string, successMessage: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copyFeedback.value = successMessage;
      return;
    }
  } catch {
    // fall through to legacy copy
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  copyFeedback.value = successMessage;
}

async function copyPlacement() {
  await copyText(previewJson.value, "placement JSON 已复制到剪贴板。");
}

async function copyCameraView() {
  if (!props.cameraViewSnapshot) {
    return;
  }

  await copyText(cameraViewPreviewJson.value, "当前视角 JSON 已复制到剪贴板。");
}
</script>
