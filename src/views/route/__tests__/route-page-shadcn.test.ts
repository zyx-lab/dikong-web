import { render, screen } from "@testing-library/vue";
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
});
