import { describe, expect, it } from "vitest";
import { buildSceneModel } from "../scene-model";
import { LOW_ALTITUDE_SCENE_MARKERS, LOW_ALTITUDE_SCENE_ROUTES } from "../static-data";

describe("buildSceneModel", () => {
  it("hides labels by default and only expands the selected marker", () => {
    const scene = buildSceneModel({
      routes: LOW_ALTITUDE_SCENE_ROUTES,
      markers: LOW_ALTITUDE_SCENE_MARKERS,
      selectedMarkerId: "alert-1",
    });

    expect(scene.routes).toHaveLength(1);
    expect(scene.markers.find((item) => item.id === "alert-1")?.expanded).toBe(true);
    expect(
      scene.markers.filter((item) => item.id !== "alert-1").every((item) => item.expanded === false)
    ).toBe(true);
  });
});
