import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/api/flight/route", () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      list: [],
      total: 0,
    }),
    getKmz: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/api/flight/mission", () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      list: [],
      total: 0,
    }),
  },
}));

import RoutePage from "@/views/route/index.vue";

describe("RoutePage shadcn shell", () => {
  it("renders the route page title as the primary h1 heading with four metric cards", async () => {
    render(RoutePage);

    expect(await screen.findByRole("heading", { name: "航线管理", level: 1 })).not.toBeNull();
    expect(screen.getAllByTestId("flight-metric-card")).toHaveLength(4);
    expect(screen.getByTestId("route-filter-bar")).not.toBeNull();
    expect(screen.getByTestId("flight-empty-state")).not.toBeNull();
  });

  it("opens the route create sheet from the primary action", async () => {
    render(RoutePage);

    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull();

    await fireEvent.click(screen.getByRole("button", { name: "新增航线" }));

    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toContain(
      "新增航线"
    );
    expect(screen.getByRole("button", { name: "取消" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "保存" })).not.toBeNull();
  });
});
