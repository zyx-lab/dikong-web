<template>
  <div ref="mapRef" class="route-planner-map"></div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";

import { RouteType } from "@/api/flight/types";
import { createCesiumViewer } from "@/components/Gis/cesium-base";
import type { BaseMapMode, RouteRecordModel } from "../types";
import { generateLoopPathCoordinates } from "../utils";

defineOptions({ name: "RoutePlannerMap" });

const props = defineProps<{
  draft: RouteRecordModel;
  baseMapMode: BaseMapMode;
  darkMode: boolean;
}>();

const emit = defineEmits<{
  mapClick: [{ lng: number; lat: number }];
}>();

const mapRef = ref<HTMLDivElement | null>(null);
const viewerRef = shallowRef<Cesium.Viewer | null>(null);

const DEFAULT_VIEW = {
  lng: 113.5338,
  lat: 22.2599,
  height: 2000,
} as const;

let dataSource: Cesium.CustomDataSource | null = null;
let handler: Cesium.ScreenSpaceEventHandler | null = null;
let initVersion = 0;

async function initViewer() {
  const currentVersion = ++initVersion;
  destroyViewer();

  if (!mapRef.value) {
    return;
  }

  const viewer = await createCesiumViewer({
    container: mapRef.value,
    baseMapMode: props.baseMapMode,
    darkMode: props.darkMode,
    defaultView: DEFAULT_VIEW,
  });

  if (currentVersion !== initVersion) {
    viewer.destroy();
    return;
  }

  dataSource = new Cesium.CustomDataSource("route-planner");
  viewer.dataSources.add(dataSource);

  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
    if (!cartesian) {
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    emit("mapClick", {
      lng: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  viewerRef.value = viewer;
  drawRoute();
}

function destroyViewer() {
  handler?.destroy();
  handler = null;
  dataSource = null;

  if (viewerRef.value && !viewerRef.value.isDestroyed()) {
    viewerRef.value.destroy();
  }

  viewerRef.value = null;
}

function drawRoute() {
  if (!viewerRef.value || !dataSource) {
    return;
  }

  const entities = dataSource.entities;
  entities.removeAll();

  if (props.draft.routeType === RouteType.LOOP) {
    drawLoopRoute(entities);
  } else if (props.draft.routeType === RouteType.AREA) {
    drawAreaRoute(entities);
  } else {
    drawPointRoute(entities);
  }

  viewerRef.value.scene.requestRender();
}

function drawPointRoute(entities: Cesium.EntityCollection) {
  const positions = props.draft.points.map((point) =>
    Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
  );
  addWaypointEntities(entities, props.draft.points);

  if (positions.length > 1) {
    entities.add({
      polyline: {
        positions,
        width: 4,
        material: Cesium.Color.fromCssColorString("#51F4F3"),
      },
    });
  }
}

function drawAreaRoute(entities: Cesium.EntityCollection) {
  const positions = props.draft.points.map((point) =>
    Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
  );
  addWaypointEntities(entities, props.draft.points);

  if (positions.length > 1) {
    entities.add({
      polyline: {
        positions: [...positions, positions[0]],
        width: 3,
        material: Cesium.Color.fromCssColorString("#51F4F3"),
      },
    });
  }

  if (positions.length > 2) {
    entities.add({
      polygon: {
        hierarchy: positions,
        material: Cesium.Color.fromCssColorString("#51F4F3").withAlpha(0.16),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#0ABAFF"),
      },
    });
  }
}

function drawLoopRoute(entities: Cesium.EntityCollection) {
  const targetPoint = props.draft.loopConfig.targetPoint;
  if (!targetPoint) {
    return;
  }

  const targetPosition = Cesium.Cartesian3.fromDegrees(
    targetPoint.lng,
    targetPoint.lat,
    targetPoint.alt
  );
  const loopPositions = generateLoopPathCoordinates(props.draft).map((position) =>
    Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt)
  );

  entities.add({
    position: targetPosition,
    point: {
      pixelSize: 12,
      color: Cesium.Color.fromCssColorString("#FC6533"),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: "目标点",
      font: "600 14px Inter, sans-serif",
      fillColor: Cesium.Color.WHITE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#FC6533").withAlpha(0.85),
      pixelOffset: new Cesium.Cartesian2(0, -24),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  if (loopPositions.length > 1) {
    entities.add({
      polyline: {
        positions: loopPositions,
        width: 4,
        material: Cesium.Color.fromCssColorString("#51F4F3"),
      },
    });

    entities.add({
      position: loopPositions[0],
      point: {
        pixelSize: 11,
        color: Cesium.Color.fromCssColorString("#0ABAFF"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: "起始点",
        font: "600 13px Inter, sans-serif",
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString("#0ABAFF").withAlpha(0.85),
        pixelOffset: new Cesium.Cartesian2(0, -22),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      targetPoint.lng,
      targetPoint.lat,
      props.draft.loopConfig.flightHeight
    ),
    ellipse: {
      semiMajorAxis: props.draft.loopConfig.radius,
      semiMinorAxis: props.draft.loopConfig.radius,
      height: props.draft.loopConfig.flightHeight,
      material: Cesium.Color.fromCssColorString("#51F4F3").withAlpha(0.08),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString("#51F4F3").withAlpha(0.55),
    },
  });
}

function addWaypointEntities(
  entities: Cesium.EntityCollection,
  points: RouteRecordModel["points"]
) {
  points.forEach((point, index) => {
    entities.add({
      position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt),
      point: {
        pixelSize: 11,
        color: Cesium.Color.fromCssColorString("#0ABAFF"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `${index + 1}`,
        font: "600 13px Inter, sans-serif",
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString("#0ABAFF").withAlpha(0.9),
        pixelOffset: new Cesium.Cartesian2(0, -22),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });
}

function flyToRoute() {
  if (!viewerRef.value) {
    return;
  }

  if (dataSource && dataSource.entities.values.length > 0) {
    void viewerRef.value.flyTo(dataSource, {
      duration: 1.6,
      offset: new Cesium.HeadingPitchRange(0, -0.8, 1600),
    });
    return;
  }

  viewerRef.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      DEFAULT_VIEW.lng,
      DEFAULT_VIEW.lat,
      DEFAULT_VIEW.height
    ),
    duration: 1.2,
  });
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
  () => props.draft,
  () => {
    drawRoute();
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

defineExpose({
  flyToRoute,
});
</script>

<style scoped lang="scss">
.route-planner-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;

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
    right: 8px;
    bottom: 8px;
    padding: 2px 6px;
    color: var(--el-text-color-secondary);
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }

  :deep(.cesium-credit-textContainer),
  :deep(.cesium-credit-logoContainer) {
    color: var(--el-text-color-secondary);
  }
}
</style>
