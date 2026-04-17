<template>
  <div ref="mapRef" class="route-planner-map"></div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { RouteType } from "@/api/flight/types";
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
const NATURAL_EARTH_URL = Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII");
const TDT_TOKEN = "ee242ce841590ad7342ea4be574716ce";
const TDT_SUBDOMAINS = ["0", "1", "2", "3", "4", "5", "6", "7"];
const TDT_DEFAULT_MAXIMUM_LEVEL = 18;
const TDT_TERRAIN_MAXIMUM_LEVEL = 14;

interface MapPalette {
  background: string;
  globe: string;
  brightness: number;
  contrast: number;
  gamma: number;
  saturation: number;
}

let dataSource: Cesium.CustomDataSource | null = null;
let handler: Cesium.ScreenSpaceEventHandler | null = null;
let initVersion = 0;

type TdtLayer = "vec" | "cva" | "img" | "cia" | "ter" | "cta";

function getTdtMaximumLevel(layer: TdtLayer) {
  return layer === "ter" || layer === "cta" ? TDT_TERRAIN_MAXIMUM_LEVEL : TDT_DEFAULT_MAXIMUM_LEVEL;
}

function getMapPalette(mode: BaseMapMode): MapPalette {
  if (props.darkMode) {
    if (mode === "satellite") {
      return {
        background: "#050B14",
        globe: "#07101B",
        brightness: 0.64,
        contrast: 1.18,
        gamma: 0.9,
        saturation: 0.82,
      };
    }

    if (mode === "terrain") {
      return {
        background: "#09131F",
        globe: "#0B1623",
        brightness: 0.7,
        contrast: 1.12,
        gamma: 0.92,
        saturation: 0.78,
      };
    }

    return {
      background: "#08111F",
      globe: "#0A1628",
      brightness: 0.76,
      contrast: 1.08,
      gamma: 0.94,
      saturation: 0.84,
    };
  }

  if (mode === "satellite") {
    return {
      background: "#DBE7F4",
      globe: "#D0DFEE",
      brightness: 1,
      contrast: 1.08,
      gamma: 1,
      saturation: 1.04,
    };
  }

  if (mode === "terrain") {
    return {
      background: "#EEF4FB",
      globe: "#DCE6F2",
      brightness: 1,
      contrast: 1.04,
      gamma: 0.98,
      saturation: 0.98,
    };
  }

  return {
    background: "#EAF4FF",
    globe: "#DDEEFF",
    brightness: 1.02,
    contrast: 1,
    gamma: 0.98,
    saturation: 1,
  };
}

function createTdtImageryProvider(layer: TdtLayer) {
  return new Cesium.WebMapTileServiceImageryProvider({
    url:
      `https://t{s}.tianditu.gov.cn/${layer}_w/wmts` +
      `?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0` +
      `&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles` +
      `&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}` +
      `&tk=${TDT_TOKEN}`,
    layer,
    style: "default",
    format: "tiles",
    tileMatrixSetID: "w",
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: getTdtMaximumLevel(layer),
    subdomains: TDT_SUBDOMAINS,
  });
}

function createTdtBaseLayer(mode: BaseMapMode) {
  const layer: TdtLayer = mode === "satellite" ? "img" : mode === "terrain" ? "ter" : "vec";
  return new Cesium.ImageryLayer(createTdtImageryProvider(layer));
}

function createTdtLabelProvider(mode: BaseMapMode) {
  const layer: TdtLayer = mode === "satellite" ? "cia" : mode === "terrain" ? "cta" : "cva";
  return createTdtImageryProvider(layer);
}

async function createNaturalEarthLayer() {
  const imageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(NATURAL_EARTH_URL);
  return new Cesium.ImageryLayer(imageryProvider);
}

async function createOnlineLayer(mode: BaseMapMode) {
  return createTdtBaseLayer(mode);
}

async function createIonLayer(mode: BaseMapMode) {
  return createTdtBaseLayer(mode);
}

async function createBaseLayer(mode: BaseMapMode, hasIonToken: boolean) {
  if (hasIonToken) {
    try {
      return await createIonLayer(mode);
    } catch (error) {
      console.warn(
        "[route-planner] Failed to load Cesium world imagery, fallback to NaturalEarthII.",
        error
      );
    }
  }

  try {
    return await createOnlineLayer(mode);
  } catch (error) {
    console.warn(
      "[route-planner] Failed to load online imagery, fallback to NaturalEarthII.",
      error
    );
  }

  try {
    return await createNaturalEarthLayer();
  } catch (error) {
    console.warn(
      "[route-planner] Failed to load NaturalEarthII imagery, fallback to single tile.",
      error
    );
    return new Cesium.ImageryLayer(
      new Cesium.SingleTileImageryProvider({
        url:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#173867" />
                  <stop offset="100%" stop-color="#08111f" />
                </linearGradient>
              </defs>
              <rect width="1024" height="512" fill="url(#bg)" />
              <g fill="none" stroke="#51F4F3" stroke-opacity="0.22">
                <ellipse cx="512" cy="256" rx="420" ry="168" />
                <ellipse cx="512" cy="256" rx="312" ry="124" />
                <ellipse cx="512" cy="256" rx="198" ry="78" />
                <path d="M128 256h768M512 76v360M256 110c120 76 392 76 512 0M256 402c120-76 392-76 512 0" />
              </g>
            </svg>
          `),
      })
    );
  }
}

async function initViewer() {
  const currentVersion = ++initVersion;
  destroyViewer();

  if (!mapRef.value) {
    return;
  }

  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (ionToken) {
    Cesium.Ion.defaultAccessToken = ionToken;
  }

  const baseLayer = await createBaseLayer(props.baseMapMode, Boolean(ionToken));
  if (currentVersion !== initVersion || !mapRef.value) {
    return;
  }

  const terrain =
    props.baseMapMode === "terrain" && ionToken ? Cesium.Terrain.fromWorldTerrain() : undefined;

  const viewer = new Cesium.Viewer(mapRef.value, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    projectionPicker: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    vrButton: false,
    requestRenderMode: true,
    shouldAnimate: false,
    skyBox: false,
    skyAtmosphere: false,
    showRenderLoopErrors: false,
    baseLayer,
    terrain,
  });

  if (currentVersion !== initVersion) {
    viewer.destroy();
    return;
  }

  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.globe.showWaterEffect = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.showGroundAtmosphere = !props.darkMode;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  if (viewer.scene.sun) {
    viewer.scene.sun.show = false;
  }
  if (viewer.scene.moon) {
    viewer.scene.moon.show = false;
  }
  viewer.imageryLayers.addImageryProvider(createTdtLabelProvider(props.baseMapMode));
  const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement | null;
  if (creditContainer) {
    creditContainer.style.display = "none";
  }

  applySceneTheme(viewer);

  dataSource = new Cesium.CustomDataSource("route-planner");
  viewer.dataSources.add(dataSource);

  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const ray = viewer.camera.getPickRay(movement.position);
    if (!ray) {
      return;
    }

    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) {
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    emit("mapClick", {
      lng: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      DEFAULT_VIEW.lng,
      DEFAULT_VIEW.lat,
      DEFAULT_VIEW.height
    ),
  });

  viewerRef.value = viewer;
  drawRoute();
}

function applySceneTheme(viewer: Cesium.Viewer) {
  const palette = getMapPalette(props.baseMapMode);
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(palette.globe);
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(palette.background);
  viewer.scene.globe.showGroundAtmosphere = props.baseMapMode !== "satellite" && !props.darkMode;
  viewer.scene.fog.enabled = false;

  const imageryLayer = viewer.imageryLayers.get(0);
  if (imageryLayer) {
    imageryLayer.alpha = 1;
    imageryLayer.brightness = palette.brightness;
    imageryLayer.contrast = palette.contrast;
    imageryLayer.gamma = palette.gamma;
    imageryLayer.saturation = palette.saturation;
  }

  viewer.scene.requestRender();
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
    const pointPosition = Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt);
    const groundPosition = Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 0);

    entities.add({
      position: pointPosition,
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

    entities.add({
      polyline: {
        positions: [pointPosition, groundPosition],
        width: 1.5,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString("#0ABAFF").withAlpha(0.5),
          dashLength: 8.0,
        }),
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
