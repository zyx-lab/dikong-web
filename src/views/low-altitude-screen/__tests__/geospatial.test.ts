import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCENE_ORIGIN,
  createSplatTransformMatrix,
  geodeticToEnu,
} from "../scene/geospatial";

describe("low-altitude geospatial helpers", () => {
  it("maps the configured scene origin to zero in ENU space", () => {
    const enu = geodeticToEnu(
      {
        longitude: DEFAULT_SCENE_ORIGIN.longitude,
        latitude: DEFAULT_SCENE_ORIGIN.latitude,
        altitudeMeters: DEFAULT_SCENE_ORIGIN.altitudeMeters,
      },
      DEFAULT_SCENE_ORIGIN
    );

    expect(enu.x).toBeCloseTo(0, 6);
    expect(enu.y).toBeCloseTo(0, 6);
    expect(enu.z).toBeCloseTo(0, 6);
  });

  it("applies ENU offset, scale, and heading into the splat transform matrix", () => {
    const baselineMatrix = createSplatTransformMatrix({
      sceneOrigin: DEFAULT_SCENE_ORIGIN,
      splatPlacement: {
        anchorLng: DEFAULT_SCENE_ORIGIN.longitude,
        anchorLat: DEFAULT_SCENE_ORIGIN.latitude,
        heightOffsetMeters: 0,
        eastMeters: 12,
        northMeters: -4,
        upMeters: 6,
        headingDeg: 0,
        pitchDeg: 0,
        rollDeg: 0,
        scale: 2,
      },
    });

    const headingAdjustedMatrix = createSplatTransformMatrix({
      sceneOrigin: DEFAULT_SCENE_ORIGIN,
      splatPlacement: {
        anchorLng: DEFAULT_SCENE_ORIGIN.longitude,
        anchorLat: DEFAULT_SCENE_ORIGIN.latitude,
        heightOffsetMeters: 0,
        eastMeters: 12,
        northMeters: -4,
        upMeters: 6,
        headingDeg: 90,
        pitchDeg: 0,
        rollDeg: 0,
        scale: 2,
      },
    });

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    baselineMatrix.decompose(position, quaternion, scale);

    const baselinePoint = new THREE.Vector3(1, 0, 0).applyMatrix4(baselineMatrix);
    const rotatedPoint = new THREE.Vector3(1, 0, 0).applyMatrix4(headingAdjustedMatrix);

    expect(position.x).toBeCloseTo(12, 6);
    expect(position.y).toBeCloseTo(6, 6);
    expect(position.z).toBeCloseTo(4, 6);
    expect(scale.x).toBeCloseTo(2, 6);
    expect(scale.y).toBeCloseTo(2, 6);
    expect(scale.z).toBeCloseTo(2, 6);
    expect(rotatedPoint.distanceTo(baselinePoint)).toBeGreaterThan(0.5);
  });
});
