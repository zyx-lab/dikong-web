import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import LowAltitudeScreenPage from "../index.vue";

describe("low-altitude screen page", () => {
  it("renders the fullscreen scene and the three merged overlay areas", async () => {
    render(LowAltitudeScreenPage);

    expect(await screen.findByText("任务态势")).toBeTruthy();
    expect(screen.getByText("无人机在线态势")).toBeTruthy();
    expect(screen.getByText("重点告警")).toBeTruthy();
  });
});
