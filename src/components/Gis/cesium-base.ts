import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import type { BaseMapMode } from "@/views/route/types";

const NATURAL_EARTH_URL = Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII");

interface MapPalette {
  background: string;
  globe: string;
  brightness: number;
  contrast: number;
  gamma: number;
  saturation: number;
}

export interface CesiumDefaultView {
  lng: number;
  lat: number;
  height: number;
}

export interface CreateCesiumViewerOptions {
  container: HTMLElement;
  baseMapMode: BaseMapMode;
  darkMode: boolean;
  defaultView: CesiumDefaultView;
  enableTerrain?: boolean;
}

function getMapPalette(mode: BaseMapMode, darkMode: boolean): MapPalette {
  if (darkMode) {
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

function getIonImageryStyle(mode: BaseMapMode) {
  if (mode === "standard") {
    return Cesium.IonWorldImageryStyle.ROAD;
  }

  return mode === "terrain"
    ? Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
    : Cesium.IonWorldImageryStyle.AERIAL;
}

async function createNaturalEarthLayer() {
  const imageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(NATURAL_EARTH_URL);
  return new Cesium.ImageryLayer(imageryProvider);
}

async function createOnlineLayer(mode: BaseMapMode) {
  if (mode === "satellite") {
    const imageryProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
    );
    return new Cesium.ImageryLayer(imageryProvider);
  }

  return new Cesium.ImageryLayer(
    new Cesium.OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
    })
  );
}

async function createIonLayer(mode: BaseMapMode) {
  const imageryProvider = await Cesium.createWorldImageryAsync({
    style: getIonImageryStyle(mode),
  });

  return new Cesium.ImageryLayer(imageryProvider);
}

async function createBaseLayer(mode: BaseMapMode, hasIonToken: boolean) {
  if (hasIonToken) {
    try {
      return await createIonLayer(mode);
    } catch (error) {
      console.warn("[gis] Failed to load Cesium world imagery, fallback to NaturalEarthII.", error);
    }
  }

  try {
    return await createOnlineLayer(mode === "terrain" ? "standard" : mode);
  } catch (error) {
    console.warn("[gis] Failed to load online imagery, fallback to NaturalEarthII.", error);
  }

  try {
    return await createNaturalEarthLayer();
  } catch (error) {
    console.warn("[gis] Failed to load NaturalEarthII imagery, fallback to single tile.", error);
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

export function applyCesiumSceneTheme(
  viewer: Cesium.Viewer,
  baseMapMode: BaseMapMode,
  darkMode: boolean
) {
  const palette = getMapPalette(baseMapMode, darkMode);
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(palette.globe);
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(palette.background);
  viewer.scene.globe.showGroundAtmosphere = baseMapMode !== "satellite" && !darkMode;
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

export async function createCesiumViewer({
  container,
  baseMapMode,
  darkMode,
  defaultView,
  enableTerrain = true,
}: CreateCesiumViewerOptions) {
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (ionToken) {
    Cesium.Ion.defaultAccessToken = ionToken;
  }

  const baseLayer = await createBaseLayer(baseMapMode, Boolean(ionToken));
  const terrain =
    enableTerrain && baseMapMode === "terrain" && ionToken
      ? Cesium.Terrain.fromWorldTerrain()
      : undefined;

  const viewer = new Cesium.Viewer(container, {
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

  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.globe.showWaterEffect = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  if (viewer.scene.sun) {
    viewer.scene.sun.show = false;
  }
  if (viewer.scene.moon) {
    viewer.scene.moon.show = false;
  }

  applyCesiumSceneTheme(viewer, baseMapMode, darkMode);
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      defaultView.lng,
      defaultView.lat,
      defaultView.height
    ),
  });

  return viewer;
}
