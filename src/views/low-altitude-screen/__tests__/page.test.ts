import { render, waitFor } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mountDashboardSceneMock } = vi.hoisted(() => ({
  mountDashboardSceneMock: vi.fn(),
}));

vi.mock("../scene/runtime", () => ({
  mountDashboardScene: mountDashboardSceneMock,
}));

import LowAltitudeScreenPage from "../index.vue";

describe("low-altitude screen page", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("shows the scene failure state when the runtime returns an error", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "error",
      errorMessage: "asset-error",
    });

    const { container, findByText } = render(LowAltitudeScreenPage);

    expect(await findByText("asset-error")).toBeTruthy();
    expect(container.querySelector(".low-altitude-scene-host__status")).toBeTruthy();
  });

  it("renders the dashboard chrome around the Cesium and 3DGS stage", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    expect(await findAllByRole("button")).not.toHaveLength(0);
    expect(container.querySelector(".dashboard-stage")).toBeTruthy();
    expect(container.querySelector(".screen-header")).toBeTruthy();
    expect(container.querySelector(".screen-content")).toBeTruthy();
    expect(container.querySelector(".side-panel--left")).toBeTruthy();
    expect(container.querySelector(".side-panel--right")).toBeTruthy();
    expect(container.querySelector(".screen-center__viewer-shell")).toBeTruthy();
  });

  it("keeps the center stage clean without route or marker overlays", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelector(".low-altitude-scene-host__overlay")).toBeNull();
    expect(container.querySelector(".low-altitude-scene-host__marker")).toBeNull();
  });

  it("mounts the Cesium scene host behind the dashboard chrome without a standalone Spark canvas", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    const host = container.querySelector(".low-altitude-scene-host");
    const map = container.querySelector(".low-altitude-scene-host__map");
    const slot = container.querySelector(".low-altitude-scene-host__slot");

    expect(host).toBeTruthy();
    expect(map).toBeTruthy();
    expect(container.querySelector(".low-altitude-scene-host__canvas")).toBeNull();
    expect(slot).toBeTruthy();
    expect(getComputedStyle(host as HTMLElement).position).toBe("relative");
    expect(getComputedStyle(map as HTMLElement).position).toBe("absolute");
    expect(getComputedStyle(slot as HTMLElement).position).toBe("relative");
  });

  it("keeps the fullscreen chrome from blocking Cesium map drag interactions", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    const slot = container.querySelector(".low-altitude-scene-host__slot");
    const header = container.querySelector(".screen-header");
    const leftPanel = container.querySelector(".side-panel--left");
    const rightPanel = container.querySelector(".side-panel--right");

    expect(slot).toBeTruthy();
    expect(header).toBeTruthy();
    expect(leftPanel).toBeTruthy();
    expect(rightPanel).toBeTruthy();
    expect(getComputedStyle(slot as HTMLElement).pointerEvents).toBe("none");
    expect(getComputedStyle(header as HTMLElement).pointerEvents).toBe("auto");
    expect(getComputedStyle(leftPanel as HTMLElement).pointerEvents).toBe("auto");
    expect(getComputedStyle(rightPanel as HTMLElement).pointerEvents).toBe("auto");
  });

  it("renders four stable duty panels around the center stage", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelectorAll(".screen-panel")).toHaveLength(4);
  });

  it("keeps the center stage free of the framed shell border", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    const viewerShell = container.querySelector(".screen-center__viewer-shell");
    expect(viewerShell).toBeTruthy();
    expect(getComputedStyle(viewerShell as HTMLElement).boxShadow).toBe("");
  });

  it("keeps the calibration panel hidden by default", async () => {
    window.location.hash = "#/low-altitude-screen";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelector('[data-testid="scene-calibration-panel"]')).toBeNull();
  });

  it("shows the calibration panel when the route hash enables calibrate=1", async () => {
    window.location.hash = "#/low-altitude-screen?calibrate=1";
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    const { container, findAllByRole } = render(LowAltitudeScreenPage);

    await findAllByRole("button");

    expect(container.querySelector('[data-testid="scene-calibration-panel"]')).toBeTruthy();
    expect(container.querySelector('input[name="anchorLng"]')).toBeTruthy();
    expect(container.querySelector('input[name="scale"]')).toBeTruthy();
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.textContent).toContain("复制当前视角 JSON");
  });

  it("passes a camera snapshot callback through scene options", async () => {
    window.location.hash = "#/low-altitude-screen?calibrate=1";
    mountDashboardSceneMock.mockClear();
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      updateConfig() {},
      status: "ready",
      errorMessage: "",
    });

    render(LowAltitudeScreenPage);

    await waitFor(() => {
      expect(mountDashboardSceneMock).toHaveBeenCalledTimes(1);
    });

    expect(mountDashboardSceneMock.mock.calls.at(-1)?.[2]).toEqual(
      expect.objectContaining({
        onCameraViewChange: expect.any(Function),
      })
    );
  });
});
