import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import DispatchPage from "@/views/flight/dispatch/index.vue";

describe("FlightDispatch page", () => {
  it("renders the dispatch page title and key action sections", async () => {
    render(DispatchPage);

    expect(await screen.findByRole("heading", { name: "一键调飞", level: 1 })).not.toBeNull();
    expect(screen.getAllByText("可用无人机").length).toBeGreaterThan(0);
    expect(screen.getAllByText("待执行航线").length).toBeGreaterThan(0);
    expect(screen.getByText("调飞指令")).not.toBeNull();
  });
});
