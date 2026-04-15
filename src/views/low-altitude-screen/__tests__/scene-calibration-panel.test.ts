import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SceneCalibrationPanel from "../components/SceneCalibrationPanel.vue";
import type { SceneHomeViewConfig, SceneSplatPlacement } from "../types";

const writeTextMock = vi.fn();
const execCommandMock = vi.fn(() => true);

function createPlacement(): SceneSplatPlacement {
  return {
    anchorLng: 113.52964,
    anchorLat: 22.25333,
    heightOffsetMeters: 80,
    eastMeters: 0,
    northMeters: 0,
    upMeters: 0,
    headingDeg: 290,
    pitchDeg: 0,
    rollDeg: 90,
    scale: 57,
  };
}

function renderPanel() {
  const host = defineComponent({
    components: {
      SceneCalibrationPanel,
    },
    setup() {
      const placement = ref(createPlacement());
      const defaultPlacement = createPlacement();
      const cameraViewSnapshot = ref<SceneHomeViewConfig>({
        longitude: 113.52961,
        latitude: 22.25331,
        height: 1450,
        headingDeg: 286,
        pitchDeg: -42,
        rollDeg: 0,
      });
      return {
        cameraViewSnapshot,
        defaultPlacement,
        placement,
      };
    },
    template: `
      <SceneCalibrationPanel
        :camera-view-snapshot="cameraViewSnapshot"
        v-model="placement"
        :default-placement="defaultPlacement"
      />
    `,
  });

  return render(host);
}

describe("scene calibration panel", () => {
  beforeEach(() => {
    writeTextMock.mockReset();
    execCommandMock.mockReset();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommandMock,
    });
  });

  it("renders quick axis controls and the live placement JSON preview", () => {
    renderPanel();

    expect(screen.getByTestId("rotate-pitch-minus-90")).toBeTruthy();
    expect(screen.getByTestId("flip-heading")).toBeTruthy();
    expect(screen.getByTestId("rotate-roll-plus-90")).toBeTruthy();
    expect(screen.getByTestId("scene-calibration-json").textContent).toContain('"scale": 57');
  });

  it("updates the placement when a quick rotate button is clicked", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("rotate-heading-plus-90"));

    expect(screen.getByDisplayValue("20")).toBeTruthy();
    expect(screen.getByTestId("scene-calibration-json").textContent).toContain('"headingDeg": 20');
  });

  it("applies 180 degree flips and keeps the preview in sync", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("flip-roll"));

    expect(screen.getByDisplayValue("-90")).toBeTruthy();
    expect(screen.getByTestId("scene-calibration-json").textContent).toContain('"rollDeg": -90');
  });

  it("allows typing negative offsets into the calibration inputs", async () => {
    const user = userEvent.setup();
    renderPanel();

    const eastOffsetInput = screen.getByRole("spinbutton", { name: "东向偏移" });
    await user.clear(eastOffsetInput);
    await user.type(eastOffsetInput, "-10");
    await user.tab();

    expect(screen.getByDisplayValue("-10")).toBeTruthy();
    expect(screen.getByTestId("scene-calibration-json").textContent).toContain('"eastMeters": -10');
  });

  it("copies the current camera view snapshot as homeView JSON", async () => {
    const user = userEvent.setup();
    renderPanel();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    await user.click(screen.getByRole("button", { name: "复制当前视角 JSON" }));

    expect(execCommandMock).toHaveBeenCalledWith("copy");
    expect(screen.getByText("当前视角 JSON 已复制到剪贴板。")).toBeTruthy();
  });
});
