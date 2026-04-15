import * as THREE from "three";
import type { SceneOriginConfig, SceneSplatPlacement } from "../types";

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface ThreeCameraState {
  aspect: number;
  direction: Vector3Like;
  far: number;
  fovDeg: number;
  near: number;
  position: Vector3Like;
  up: Vector3Like;
}

export interface CreateSplatTransformMatrixOptions {
  anchorHeightMeters?: number;
  sceneOrigin: SceneOriginConfig;
  splatPlacement: SceneSplatPlacement;
}

export interface CreateRadarTransformMatrixOptions {
  localVerticalOffsetMeters?: number;
  radarLocalToEnuMatrix?: THREE.Matrix4;
  sceneOrigin: SceneOriginConfig;
  sensorOrigin: SceneOriginConfig;
}

export const DEFAULT_SCENE_ORIGIN: SceneOriginConfig = Object.freeze({
  altitudeMeters: 86.885,
  latitude: 22.252818819444443,
  longitude: 113.52958706944445,
});

export const DEFAULT_SCENE_LOCAL_TO_ENU_MATRIX = new THREE.Matrix4().set(
  23.32268437,
  23.71730027,
  -52.64161238,
  35.91473514,
  57.73477094,
  -10.15823258,
  21.00247195,
  52.1704996,
  -0.58814194,
  -56.67360295,
  -25.79445891,
  24.2211397,
  0,
  0,
  0,
  1
);

export const RADAR_LOCAL_TO_ENU_MATRIX = new THREE.Matrix4().set(
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  1
);

export const ENU_TO_RENDER_MATRIX = new THREE.Matrix4().set(
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  -1,
  0,
  0,
  0,
  0,
  0,
  1
);

export function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function readEnvNumber(
  rawValue: string | number | undefined,
  fallbackValue: number
): number {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }
  if (typeof rawValue === "string") {
    const parsed = Number(rawValue.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallbackValue;
}

export function cloneSceneSplatPlacement(placement: SceneSplatPlacement): SceneSplatPlacement {
  return {
    anchorLng: placement.anchorLng,
    anchorLat: placement.anchorLat,
    heightOffsetMeters: placement.heightOffsetMeters,
    eastMeters: placement.eastMeters,
    northMeters: placement.northMeters,
    upMeters: placement.upMeters,
    headingDeg: placement.headingDeg,
    pitchDeg: placement.pitchDeg,
    rollDeg: placement.rollDeg,
    scale: placement.scale,
  };
}

export function geodeticToEcef(input: SceneOriginConfig): THREE.Vector3 {
  const semiMajorAxis = 6378137;
  const flattening = 1 / 298.257223563;
  const eccentricitySquared = 2 * flattening - flattening * flattening;
  const latitudeRad = degreesToRadians(input.latitude);
  const longitudeRad = degreesToRadians(input.longitude);
  const sinLatitude = Math.sin(latitudeRad);
  const cosLatitude = Math.cos(latitudeRad);
  const sinLongitude = Math.sin(longitudeRad);
  const cosLongitude = Math.cos(longitudeRad);
  const primeVerticalRadius =
    semiMajorAxis / Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);

  return new THREE.Vector3(
    (primeVerticalRadius + input.altitudeMeters) * cosLatitude * cosLongitude,
    (primeVerticalRadius + input.altitudeMeters) * cosLatitude * sinLongitude,
    (primeVerticalRadius * (1 - eccentricitySquared) + input.altitudeMeters) * sinLatitude
  );
}

export function geodeticToEnu(
  input: SceneOriginConfig,
  origin: SceneOriginConfig = DEFAULT_SCENE_ORIGIN
): THREE.Vector3 {
  const ecef = geodeticToEcef(input);
  const originEcef = geodeticToEcef(origin);
  const delta = ecef.sub(originEcef);
  const originLatitudeRad = degreesToRadians(origin.latitude);
  const originLongitudeRad = degreesToRadians(origin.longitude);
  const sinLatitude = Math.sin(originLatitudeRad);
  const cosLatitude = Math.cos(originLatitudeRad);
  const sinLongitude = Math.sin(originLongitudeRad);
  const cosLongitude = Math.cos(originLongitudeRad);

  return new THREE.Vector3(
    -sinLongitude * delta.x + cosLongitude * delta.y,
    -sinLatitude * cosLongitude * delta.x -
      sinLatitude * sinLongitude * delta.y +
      cosLatitude * delta.z,
    cosLatitude * cosLongitude * delta.x +
      cosLatitude * sinLongitude * delta.y +
      sinLatitude * delta.z
  );
}

export function enuToRenderVector(input: Vector3Like): THREE.Vector3 {
  return new THREE.Vector3(input.x, input.z, -input.y);
}

export function getAverageMatrixScale(matrix: THREE.Matrix4): number {
  const xAxis = new THREE.Vector3().setFromMatrixColumn(matrix, 0).length();
  const yAxis = new THREE.Vector3().setFromMatrixColumn(matrix, 1).length();
  const zAxis = new THREE.Vector3().setFromMatrixColumn(matrix, 2).length();
  return (xAxis + yAxis + zAxis) / 3;
}

function createPlacementRotationMatrix(splatPlacement: SceneSplatPlacement): THREE.Matrix4 {
  const euler = new THREE.Euler(
    degreesToRadians(splatPlacement.pitchDeg),
    degreesToRadians(splatPlacement.headingDeg),
    degreesToRadians(splatPlacement.rollDeg),
    "YXZ"
  );
  return new THREE.Matrix4().makeRotationFromEuler(euler);
}

export function createSplatTransformMatrix({
  anchorHeightMeters,
  sceneOrigin,
  splatPlacement,
}: CreateSplatTransformMatrixOptions): THREE.Matrix4 {
  const anchorEnu = geodeticToEnu(
    {
      altitudeMeters:
        anchorHeightMeters ?? sceneOrigin.altitudeMeters + splatPlacement.heightOffsetMeters,
      latitude: splatPlacement.anchorLat,
      longitude: splatPlacement.anchorLng,
    },
    sceneOrigin
  );
  const offsetRender = enuToRenderVector({
    x: splatPlacement.eastMeters,
    y: splatPlacement.northMeters,
    z: splatPlacement.upMeters,
  });
  const renderTranslation = enuToRenderVector(anchorEnu).add(offsetRender);

  const translationMatrix = new THREE.Matrix4().makeTranslation(
    renderTranslation.x,
    renderTranslation.y,
    renderTranslation.z
  );
  const rotationMatrix = createPlacementRotationMatrix(splatPlacement);
  const scaleMatrix = new THREE.Matrix4().makeScale(
    splatPlacement.scale,
    splatPlacement.scale,
    splatPlacement.scale
  );

  return translationMatrix
    .multiply(rotationMatrix)
    .multiply(scaleMatrix)
    .multiply(ENU_TO_RENDER_MATRIX.clone());
}

export function createRadarTransformMatrix({
  sceneOrigin,
  sensorOrigin,
  localVerticalOffsetMeters = 0,
  radarLocalToEnuMatrix = RADAR_LOCAL_TO_ENU_MATRIX,
}: CreateRadarTransformMatrixOptions): THREE.Matrix4 {
  const sensorEnu = geodeticToEnu(sensorOrigin, sceneOrigin);
  const sensorRender = enuToRenderVector(sensorEnu);
  const translationMatrix = new THREE.Matrix4().makeTranslation(
    sensorRender.x,
    sensorRender.y + localVerticalOffsetMeters,
    sensorRender.z
  );

  return translationMatrix.multiply(ENU_TO_RENDER_MATRIX.clone().multiply(radarLocalToEnuMatrix));
}

export function applyCameraStateToThreeCamera(
  camera: THREE.PerspectiveCamera,
  state: ThreeCameraState
): void {
  camera.position.set(state.position.x, state.position.y, state.position.z);
  camera.up.set(state.up.x, state.up.y, state.up.z);
  camera.aspect = state.aspect;
  camera.fov = state.fovDeg;
  camera.near = state.near;
  camera.far = state.far;
  camera.lookAt(
    state.position.x + state.direction.x,
    state.position.y + state.direction.y,
    state.position.z + state.direction.z
  );
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

export function applyStaticMatrix(object: THREE.Object3D, matrix: THREE.Matrix4): void {
  object.matrixAutoUpdate = false;
  object.matrix.copy(matrix);
  object.matrixWorldNeedsUpdate = true;
}
