import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import ConsolePage from "@/views/flight/console/index.vue";

describe("FlightConsole page", () => {
  it("renders the console page title and key operation panels", async () => {
    render(ConsolePage);

    expect(await screen.findByRole("heading", { name: "飞行控制台", level: 1 })).not.toBeNull();
    expect(screen.getByText("无人机视频")).not.toBeNull();
    expect(screen.getByText("任务操作")).not.toBeNull();
    expect(screen.getByText("飞行轨迹")).not.toBeNull();
  });
});
