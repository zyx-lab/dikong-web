import { describe, expect, it } from "vitest";

import { shouldShowSceneCalibrationPanel } from "../query";

describe("low-altitude screen query helpers", () => {
  it("keeps the calibration panel hidden without an explicit calibrate=1 flag", () => {
    expect(
      shouldShowSceneCalibrationPanel({
        hash: "#/low-altitude-screen",
        search: "",
      })
    ).toBe(false);
  });

  it("shows the calibration panel when calibrate=1 is present in the hash query", () => {
    expect(
      shouldShowSceneCalibrationPanel({
        hash: "#/low-altitude-screen?calibrate=1",
        search: "",
      })
    ).toBe(true);
  });

  it("shows the calibration panel when calibrate=1 is present in the search query", () => {
    expect(
      shouldShowSceneCalibrationPanel({
        hash: "#/low-altitude-screen",
        search: "?calibrate=1",
      })
    ).toBe(true);
  });
});
