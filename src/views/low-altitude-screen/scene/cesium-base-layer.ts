import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import * as THREE from "three";
import type {
  LowAltitudeSceneConfig,
  SceneBaseMapMode,
  SceneHomeViewConfig,
  SceneOriginConfig,
} from "../types";
import { applyCameraStateToThreeCamera, enuToRenderVector } from "./geospatial";

interface MapPalette {
  background: string;
  globe: string;
  brightness: number;
  contrast: number;
  gamma: number;
  saturation: number;
}

const NATURAL_EARTH_URL = Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII");
const TDT_TOKEN = "ee242ce841590ad7342ea4be574716ce";
const TDT_SUBDOMAINS = ["0", "1", "2", "3", "4", "5", "6", "7"];
const TDT_MAXIMUM_LEVEL = 18;

type TdtLayer = "vec" | "cva" | "img" | "cia" | "ter" | "cta";

function getMapPalette(mode: SceneBaseMapMode, backgroundColor: string): MapPalette {
  if (mode === "terrain") {
    return {
      background: backgroundColor,
      globe: "#0B1623",
      brightness: 0.7,
      contrast: 1.12,
      gamma: 0.92,
      saturation: 0.78,
    };
  }

  if (mode === "vector") {
    return {
      background: backgroundColor,
      globe: "#0A1628",
      brightness: 0.76,
      contrast: 1.08,
      gamma: 0.94,
      saturation: 0.84,
    };
  }

  return {
    background: backgroundColor,
    globe: "#07101B",
    brightness: 0.64,
    contrast: 1.18,
    gamma: 0.9,
    saturation: 0.82,
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
    format: "tiles",
    layer,
    maximumLevel: TDT_MAXIMUM_LEVEL,
    style: "default",
    subdomains: TDT_SUBDOMAINS,
    tileMatrixSetID: "w",
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
  });
}

function createTdtBaseLayer(mode: SceneBaseMapMode) {
  const layer: TdtLayer = mode === "satellite" ? "img" : mode === "terrain" ? "ter" : "vec";
  return new Cesium.ImageryLayer(createTdtImageryProvider(layer));
}

function createTdtLabelProvider(mode: SceneBaseMapMode) {
  const layer: TdtLayer = mode === "satellite" ? "cia" : mode === "terrain" ? "cta" : "cva";
  return createTdtImageryProvider(layer);
}

async function createNaturalEarthLayer() {
  const imageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(NATURAL_EARTH_URL);
  return new Cesium.ImageryLayer(imageryProvider);
}

async function createBaseLayer(mode: SceneBaseMapMode, hasIonToken: boolean) {
  if (hasIonToken) {
    try {
      return createTdtBaseLayer(mode);
    } catch (error) {
      console.warn("[low-altitude-screen] Failed to load Ion-compatible imagery.", error);
    }
  }

  try {
    return createTdtBaseLayer(mode);
  } catch (error) {
    console.warn("[low-altitude-screen] Failed to load Tianditu imagery.", error);
  }

  try {
    return await createNaturalEarthLayer();
  } catch (error) {
    console.warn("[low-altitude-screen] Failed to load NaturalEarthII imagery.", error);
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

function applySceneTheme(viewer: Cesium.Viewer, mode: SceneBaseMapMode, backgroundColor: string) {
  const palette = getMapPalette(mode, backgroundColor);
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(palette.globe);
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(palette.background);
  viewer.scene.globe.showGroundAtmosphere = mode !== "satellite";
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

function setHomeView(viewer: Cesium.Viewer, config: LowAltitudeSceneConfig) {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      config.homeView.longitude,
      config.homeView.latitude,
      config.homeView.height
    ),
    orientation: {
      heading: Cesium.Math.toRadians(config.homeView.headingDeg),
      pitch: Cesium.Math.toRadians(config.homeView.pitchDeg),
      roll: Cesium.Math.toRadians(config.homeView.rollDeg),
    },
  });
}

function roundCoordinate(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

export function getSceneHomeViewSnapshot(viewer: Cesium.Viewer): SceneHomeViewConfig {
  const cartographic =
    viewer.camera.positionCartographic ??
    Cesium.Cartographic.fromCartesian(viewer.camera.positionWC, Cesium.Ellipsoid.WGS84);

  return {
    longitude: roundCoordinate(Cesium.Math.toDegrees(cartographic.longitude), 6),
    latitude: roundCoordinate(Cesium.Math.toDegrees(cartographic.latitude), 6),
    height: roundCoordinate(cartographic.height, 3),
    headingDeg: roundCoordinate(Cesium.Math.toDegrees(viewer.camera.heading), 3),
    pitchDeg: roundCoordinate(Cesium.Math.toDegrees(viewer.camera.pitch), 3),
    rollDeg: roundCoordinate(Cesium.Math.toDegrees(viewer.camera.roll), 3),
  };
}

export async function createLowAltitudeCesiumViewer(
  container: HTMLElement,
  config: LowAltitudeSceneConfig
): Promise<Cesium.Viewer> {
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (ionToken) {
    Cesium.Ion.defaultAccessToken = ionToken;
  }

  const baseLayer = await createBaseLayer(config.baseMapMode, Boolean(ionToken));
  const terrain =
    config.baseMapMode === "terrain" && ionToken ? Cesium.Terrain.fromWorldTerrain() : undefined;
  const viewer = new Cesium.Viewer(container, {
    animation: false,
    baseLayer,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    projectionPicker: false,
    requestRenderMode: false,
    sceneModePicker: false,
    selectionIndicator: false,
    shouldAnimate: false,
    showRenderLoopErrors: false,
    skyAtmosphere: false,
    skyBox: false,
    terrain,
    timeline: false,
    vrButton: false,
  });

  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.showGroundAtmosphere = false;
  viewer.scene.globe.showWaterEffect = false;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  if (viewer.scene.sun) {
    viewer.scene.sun.show = false;
  }
  if (viewer.scene.moon) {
    viewer.scene.moon.show = false;
  }

  viewer.imageryLayers.addImageryProvider(createTdtLabelProvider(config.baseMapMode));
  const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement | null;
  if (creditContainer) {
    creditContainer.style.display = "none";
  }

  applySceneTheme(viewer, config.baseMapMode, config.backgroundColor);
  setHomeView(viewer, config);
  return viewer;
}

export function syncThreeCameraFromCesiumViewer(
  viewer: Cesium.Viewer,
  camera: THREE.PerspectiveCamera,
  sceneOrigin: SceneOriginConfig
): void {
  const originCartesian = Cesium.Cartesian3.fromDegrees(
    sceneOrigin.longitude,
    sceneOrigin.latitude,
    sceneOrigin.altitudeMeters
  );
  const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(originCartesian);
  const inverseEnuFrame = Cesium.Matrix4.inverseTransformation(enuFrame, new Cesium.Matrix4());
  const inverseRotation = Cesium.Matrix4.getMatrix3(inverseEnuFrame, new Cesium.Matrix3());
  const positionEnu = Cesium.Matrix4.multiplyByPoint(
    inverseEnuFrame,
    viewer.camera.positionWC,
    new Cesium.Cartesian3()
  );
  const directionEnu = Cesium.Matrix3.multiplyByVector(
    inverseRotation,
    viewer.camera.directionWC,
    new Cesium.Cartesian3()
  );
  const upEnu = Cesium.Matrix3.multiplyByVector(
    inverseRotation,
    viewer.camera.upWC,
    new Cesium.Cartesian3()
  );
  const frustum = viewer.camera.frustum as Cesium.PerspectiveFrustum;
  const aspect =
    viewer.scene.canvas.clientWidth && viewer.scene.canvas.clientHeight
      ? viewer.scene.canvas.clientWidth / viewer.scene.canvas.clientHeight
      : 1;

  applyCameraStateToThreeCamera(camera, {
    aspect,
    direction: enuToRenderVector(directionEnu),
    far: Number.isFinite(frustum.far) ? frustum.far : 250000,
    fovDeg: Cesium.Math.toDegrees(frustum.fovy ?? Math.PI / 3),
    near: Number.isFinite(frustum.near) ? frustum.near : 0.1,
    position: enuToRenderVector(positionEnu),
    up: enuToRenderVector(upEnu),
  });
}
