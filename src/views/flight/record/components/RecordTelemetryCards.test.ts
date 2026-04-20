import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import RecordTelemetryCards from "./RecordTelemetryCards.vue";

describe("RecordTelemetryCards", () => {
  it("renders telemetry metrics and control labels", async () => {
    render(RecordTelemetryCards, {
      props: {
        currentAltitude: 265,
        currentSpeed: 18,
        projectorFov: 38,
        projectionOpacity: 0.8,
        showProjectionMesh: false,
        debugProjectionMode: false,
        showProjectorHelper: true,
        showDroneModel: true,
        debugDroneModel: true,
      },
      global: {
        stubs: {
          ElSlider: { template: "<div />" },
          ElSwitch: { template: "<button type='button' />" },
        },
      },
    });

    expect(await screen.findByText("距地高度")).not.toBeNull();
    expect(screen.getByText("速度")).not.toBeNull();
    expect(screen.getByText("视频 FoV")).not.toBeNull();
    expect(screen.getByText("投影混合")).not.toBeNull();
    expect(screen.getByText("显示无人机")).not.toBeNull();
  });
});
