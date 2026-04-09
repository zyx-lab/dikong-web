import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/vue";

const { mountDashboardSceneMock } = vi.hoisted(() => ({
  mountDashboardSceneMock: vi.fn(),
}));

vi.mock("../scene/runtime", () => ({
  mountDashboardScene: mountDashboardSceneMock,
}));

import LowAltitudeScreenPage from "../index.vue";

describe("low-altitude screen page", () => {
  it("shows the scene failure state when 3DGS runtime cannot load the model asset", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      status: "error",
      errorMessage: "3DGS 资源地址返回了 HTML 页面",
    });

    render(LowAltitudeScreenPage);

    expect(await screen.findByText("3DGS 场景加载失败")).toBeTruthy();
    expect(screen.getByText("3DGS 资源地址返回了 HTML 页面")).toBeTruthy();
  });

  it("renders the dashboard-style chrome around the 3DGS stage", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      status: "ready",
      errorMessage: "",
    });

    const { container } = render(LowAltitudeScreenPage);

    expect(await screen.findByText("低空智能巡检平台")).toBeTruthy();
    expect(container.querySelector(".dashboard-stage")).toBeTruthy();
    expect(container.querySelector(".screen-header")).toBeTruthy();
    expect(container.querySelector(".screen-content")).toBeTruthy();
    expect(container.querySelector(".side-panel--left")).toBeTruthy();
    expect(container.querySelector(".side-panel--right")).toBeTruthy();
    expect(container.querySelector(".screen-center__viewer-shell")).toBeTruthy();
    expect(screen.getByRole("button", { name: "返回系统" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "进入浏览器全屏" })).toBeTruthy();
  });

  it("keeps the center stage clean for the future 3DGS scene without route or marker overlays", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      status: "ready",
      errorMessage: "",
    });

    const { container } = render(LowAltitudeScreenPage);

    await screen.findByText("任务总览");

    expect(container.querySelector(".low-altitude-scene-host__overlay")).toBeNull();
    expect(container.querySelector(".low-altitude-scene-host__marker")).toBeNull();
  });

  it("stretches the 3DGS canvas behind the dashboard chrome", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      status: "ready",
      errorMessage: "",
    });

    const { container } = render(LowAltitudeScreenPage);

    await screen.findByText("低空智能巡检平台");

    const host = container.querySelector(".low-altitude-scene-host");
    const canvas = container.querySelector(".low-altitude-scene-host__canvas");
    const slot = container.querySelector(".low-altitude-scene-host__slot");

    expect(host).toBeTruthy();
    expect(canvas).toBeTruthy();
    expect(slot).toBeTruthy();
    expect(getComputedStyle(host as HTMLElement).position).toBe("relative");
    expect(getComputedStyle(canvas as HTMLElement).position).toBe("absolute");
    expect(getComputedStyle(canvas as HTMLElement).display).toBe("block");
    expect(getComputedStyle(slot as HTMLElement).position).toBe("relative");
  });

  it("keeps the fullscreen chrome from blocking canvas drag interactions", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      status: "ready",
      errorMessage: "",
    });

    const { container } = render(LowAltitudeScreenPage);

    await screen.findByText("低空智能巡检平台");

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
      status: "ready",
      errorMessage: "",
    });

    const { container } = render(LowAltitudeScreenPage);

    expect(await screen.findByText("任务总览")).toBeTruthy();
    expect(screen.getByText("资源保障")).toBeTruthy();
    expect(screen.getByText("异常告警")).toBeTruthy();
    expect(screen.getByText("飞行闭环")).toBeTruthy();
    expect(container.querySelectorAll(".screen-panel")).toHaveLength(4);
  });

  it("keeps the center stage free of the framed shell border", async () => {
    mountDashboardSceneMock.mockResolvedValueOnce({
      destroy() {},
      resize() {},
      status: "ready",
      errorMessage: "",
    });

    const { container } = render(LowAltitudeScreenPage);

    await screen.findByText("低空智能巡检平台");

    const viewerShell = container.querySelector(".screen-center__viewer-shell");
    expect(viewerShell).toBeTruthy();
    expect(getComputedStyle(viewerShell as HTMLElement).boxShadow).toBe("");
  });
});
