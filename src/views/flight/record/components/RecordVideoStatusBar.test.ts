import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import RecordVideoStatusBar from "./RecordVideoStatusBar.vue";

describe("RecordVideoStatusBar", () => {
  it("renders drone, battery and frame badges", async () => {
    render(RecordVideoStatusBar, {
      props: {
        droneName: "Matrice 350",
        batteryPercent: 76,
        currentFrameIndex: 4,
        poseFrameCount: 20,
        radarReady: true,
        radarFrameIndex: 2,
        radarFrameCount: 12,
        projectorFov: 38,
      },
    });

    expect(await screen.findByText("Matrice 350")).not.toBeNull();
    expect(screen.getByText("76%")).not.toBeNull();
    expect(screen.getByText("Frame 5 / 20")).not.toBeNull();
    expect(screen.getByText("FoV 38.0°")).not.toBeNull();
  });
});
