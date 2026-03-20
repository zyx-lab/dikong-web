<template>
  <div ref="mapRef" class="low-altitude-gis-map">
    <div v-if="statusText" class="low-altitude-gis-map__status">
      <div class="low-altitude-gis-map__status-card">{{ statusText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";

import { RouteType } from "@/api/flight/types";
import { createCesiumViewer, type CesiumDefaultView } from "@/components/Gis/cesium-base";
import type { BaseMapMode } from "@/views/route/types";
import { DEFAULT_CENTER } from "@/views/route/utils";
import type { LowAltitudeRouteOverlay } from "./screen-state";

defineOptions({ name: "LowAltitudeGisMap" });

const props = withDefaults(
  defineProps<{
    overlays: LowAltitudeRouteOverlay[];
    baseMapMode: BaseMapMode;
    darkMode?: boolean;
    defaultView?: CesiumDefaultView;
  }>(),
  {
    darkMode: true,
    defaultView: () => ({
      lng: DEFAULT_CENTER.lng,
      lat: DEFAULT_CENTER.lat,
      height: 2200,
    }),
  }
);

const mapRef = ref<HTMLDivElement | null>(null);
const viewerRef = shallowRef<Cesium.Viewer | null>(null);
const statusText = ref("地图加载中");

let dataSource: Cesium.CustomDataSource | null = null;
let initVersion = 0;
let lastOverlaySignature = "";

async function initViewer() {
  const currentVersion = ++initVersion;
  destroyViewer();
  statusText.value = "地图加载中";

  if (!mapRef.value) {
    return;
  }

  const viewer = await createCesiumViewer({
    container: mapRef.value,
    baseMapMode: props.baseMapMode,
    darkMode: props.darkMode,
    defaultView: props.defaultView,
  });

  if (currentVersion !== initVersion) {
    viewer.destroy();
    return;
  }

  dataSource = new Cesium.CustomDataSource("low-altitude-screen");
  viewer.dataSources.add(dataSource);
  viewerRef.value = viewer;
  drawOverlays(true);
}

function destroyViewer() {
  dataSource = null;

  if (viewerRef.value && !viewerRef.value.isDestroyed()) {
    viewerRef.value.destroy();
  }

  viewerRef.value = null;
}

function drawOverlays(forceFit: boolean) {
  if (!viewerRef.value || !dataSource) {
    return;
  }

  const entities = dataSource.entities;
  entities.removeAll();

  props.overlays.forEach((overlay) => {
    if (overlay.routeType === RouteType.AREA) {
      drawAreaOverlay(entities, overlay);
      return;
    }

    if (overlay.routeType === RouteType.LOOP) {
      drawLoopOverlay(entities, overlay);
      return;
    }

    drawPointOverlay(entities, overlay);
  });

  const signature = getOverlaySignature(props.overlays);
  viewerRef.value.scene.requestRender();

  if (props.overlays.length === 0) {
    statusText.value = "暂无已持久化航线，地图已回退到默认中心点";
    lastOverlaySignature = signature;
    return;
  }

  statusText.value = "";
  if (forceFit || signature !== lastOverlaySignature) {
    lastOverlaySignature = signature;
    void viewerRef.value.flyTo(dataSource, {
      duration: 1.2,
      offset: new Cesium.HeadingPitchRange(0, -0.92, 2800),
    });
  }
}

function drawPointOverlay(entities: Cesium.EntityCollection, overlay: LowAltitudeRouteOverlay) {
  const positions = overlay.path.map((point) =>
    Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
  );

  if (positions.length > 1) {
    entities.add({
      polyline: {
        positions,
        width: 4,
        material: Cesium.Color.fromCssColorString(overlay.color),
      },
    });
  }

  addPathAnchors(entities, overlay, positions);
  addRouteLabel(entities, overlay);
}

function drawAreaOverlay(entities: Cesium.EntityCollection, overlay: LowAltitudeRouteOverlay) {
  const polygonPositions = overlay.polygon.map((point) =>
    Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
  );

  if (polygonPositions.length > 1) {
    entities.add({
      polyline: {
        positions: [...polygonPositions, polygonPositions[0]],
        width: 3,
        material: Cesium.Color.fromCssColorString(overlay.color),
      },
    });
  }

  if (polygonPositions.length > 2) {
    entities.add({
      polygon: {
        hierarchy: polygonPositions,
        material: Cesium.Color.fromCssColorString(overlay.color).withAlpha(0.16),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(overlay.color).withAlpha(0.78),
      },
    });
  }

  overlay.sweepLines.forEach((line) => {
    const linePositions = line.map((point) =>
      Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
    );
    entities.add({
      polyline: {
        positions: linePositions,
        width: 2,
        material: Cesium.Color.fromCssColorString(overlay.color).withAlpha(0.68),
      },
    });
  });

  addRouteLabel(entities, overlay);
}

function drawLoopOverlay(entities: Cesium.EntityCollection, overlay: LowAltitudeRouteOverlay) {
  const positions = overlay.path.map((point) =>
    Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
  );

  if (positions.length > 1) {
    entities.add({
      polyline: {
        positions,
        width: 4,
        material: Cesium.Color.fromCssColorString(overlay.color),
      },
    });
  }

  if (overlay.orbitCenter) {
    const centerPosition = Cesium.Cartesian3.fromDegrees(
      overlay.orbitCenter.lng,
      overlay.orbitCenter.lat,
      overlay.orbitCenter.alt
    );

    entities.add({
      position: centerPosition,
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString(overlay.color),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    entities.add({
      position: centerPosition,
      ellipse: {
        semiMajorAxis: overlay.orbitRadius,
        semiMinorAxis: overlay.orbitRadius,
        height: overlay.orbitCenter.alt,
        material: Cesium.Color.fromCssColorString(overlay.color).withAlpha(0.08),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(overlay.color).withAlpha(0.52),
      },
    });
  }

  addPathAnchors(entities, overlay, positions);
  addRouteLabel(entities, overlay);
}

function addPathAnchors(
  entities: Cesium.EntityCollection,
  overlay: LowAltitudeRouteOverlay,
  positions: Cesium.Cartesian3[]
) {
  const anchorPositions =
    positions.length > 1 ? [positions[0], positions[positions.length - 1]] : positions.slice(0, 1);

  anchorPositions.forEach((position, index) => {
    entities.add({
      position,
      point: {
        pixelSize: index === 0 ? 8 : 7,
        color: Cesium.Color.fromCssColorString(overlay.color),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });
}

function addRouteLabel(entities: Cesium.EntityCollection, overlay: LowAltitudeRouteOverlay) {
  if (!overlay.highlight || !overlay.labelPosition) {
    return;
  }

  entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      overlay.labelPosition.lng,
      overlay.labelPosition.lat,
      overlay.labelPosition.alt
    ),
    label: {
      text: overlay.labelText,
      font: '600 15px "Segoe UI Variable Display", "Microsoft YaHei UI", sans-serif',
      fillColor: Cesium.Color.WHITE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#091425").withAlpha(0.86),
      outlineColor: Cesium.Color.fromCssColorString(overlay.color),
      outlineWidth: 1,
      pixelOffset: new Cesium.Cartesian2(0, -24),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

function getOverlaySignature(overlays: LowAltitudeRouteOverlay[]) {
  return overlays
    .map((overlay) => {
      const firstPoint = overlay.path[0];
      const lastPoint = overlay.path[overlay.path.length - 1];
      return [
        overlay.id,
        overlay.routeType,
        overlay.path.length,
        overlay.polygon.length,
        overlay.orbitRadius,
        firstPoint?.lng.toFixed(4) ?? "0",
        firstPoint?.lat.toFixed(4) ?? "0",
        lastPoint?.lng.toFixed(4) ?? "0",
        lastPoint?.lat.toFixed(4) ?? "0",
      ].join(":");
    })
    .join("|");
}

watch(
  () => props.baseMapMode,
  () => {
    void initViewer();
  }
);

watch(
  () => props.darkMode,
  () => {
    void initViewer();
  }
);

watch(
  () => props.overlays,
  () => {
    drawOverlays(false);
  },
  { deep: true }
);

onMounted(() => {
  void initViewer();
});

onBeforeUnmount(() => {
  initVersion += 1;
  destroyViewer();
});
</script>

<style scoped lang="scss">
.low-altitude-gis-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(6, 14, 24, 0.98), rgba(5, 10, 18, 0.98));
  border: 1px solid rgba(111, 182, 255, 0.16);
  border-radius: 28px;

  :deep(.cesium-viewer),
  :deep(.cesium-viewer-cesiumWidgetContainer),
  :deep(.cesium-widget),
  :deep(.cesium-widget canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  :deep(.cesium-viewer-toolbar) {
    display: none;
  }

  :deep(.cesium-viewer-bottom) {
    right: 12px;
    bottom: 12px;
    padding: 2px 8px;
    color: rgba(222, 235, 255, 0.72);
    background: rgba(6, 15, 25, 0.66);
    border: 1px solid rgba(111, 182, 255, 0.16);
    border-radius: 999px;
  }

  :deep(.cesium-credit-textContainer),
  :deep(.cesium-credit-logoContainer) {
    color: rgba(222, 235, 255, 0.72);
  }
}

.low-altitude-gis-map__status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.low-altitude-gis-map__status-card {
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(222, 235, 255, 0.78);
  letter-spacing: 0.05em;
  background: rgba(6, 15, 25, 0.82);
  border: 1px solid rgba(111, 182, 255, 0.16);
  border-radius: 999px;
  backdrop-filter: blur(12px);
}
</style>
