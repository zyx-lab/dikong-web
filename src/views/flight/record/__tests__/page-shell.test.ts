import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/api/flight/task", () => ({
  default: {
    getMembers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/api/resource/drone", () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      list: [],
      total: 0,
    }),
  },
}));

vi.mock("@/api/flight/record", () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      list: [],
      total: 0,
    }),
    getDetail: vi.fn(),
    update: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getReplayUrl: vi.fn(),
    getPlaybackUrl: vi.fn(),
  },
}));

import RecordPage from "@/views/flight/record/index.vue";

describe("RecordPage shadcn shell", () => {
  it("renders the record page title as the primary h1 heading", async () => {
    render(RecordPage, {
      global: {
        directives: {
          loading: {},
        },
        stubs: {
          pagination: { template: "<div />" },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: "飞行记录", level: 1 })).not.toBeNull();
    expect(screen.getByTestId("record-filter-bar")).not.toBeNull();
    expect(screen.getByTestId("flight-empty-state")).not.toBeNull();
    expect(screen.getByTestId("record-table-shell")).not.toBeNull();
    expect(screen.getByTestId("record-data-table")).not.toBeNull();
  });
});
