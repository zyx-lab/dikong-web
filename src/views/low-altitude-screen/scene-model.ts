import type { SceneMarker, SceneRouteLine } from "./types";

export function buildSceneModel(input: {
  routes: SceneRouteLine[];
  markers: SceneMarker[];
  selectedMarkerId?: string | null;
}) {
  return {
    routes: input.routes,
    markers: input.markers.map((marker) => ({
      ...marker,
      expanded: input.selectedMarkerId === marker.id,
    })),
    selectedMarkerId: input.selectedMarkerId ?? null,
  };
}
