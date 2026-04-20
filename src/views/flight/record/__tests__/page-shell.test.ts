import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

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
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElInput: { template: "<input />" },
          ElSelect: { template: "<div><slot /></div>" },
          ElOption: { template: "<option><slot /></option>" },
          ElButton: { template: "<button type='button'><slot /></button>" },
          ElTag: { template: "<span><slot /></span>" },
          ElTable: { template: "<div><slot /><slot name='empty' /></div>" },
          ElTableColumn: { template: "<div />" },
          ElEmpty: { template: "<div />" },
          ElCard: { template: "<section><slot /></section>" },
          ElDatePicker: { template: "<input />" },
          ElDialog: { template: "<div><slot /><slot name='footer' /></div>" },
          ElInputNumber: { template: "<input />" },
          pagination: { template: "<div />" },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: "飞行记录", level: 1 })).not.toBeNull();
    expect(screen.getAllByTestId("flight-metric-card")).toHaveLength(4);
    expect(screen.getByTestId("record-filter-bar")).not.toBeNull();
    expect(screen.getByTestId("flight-empty-state")).not.toBeNull();
    expect(screen.getByTestId("record-table-shell")).not.toBeNull();
    expect(screen.getByTestId("record-data-table")).not.toBeNull();
  });
});
