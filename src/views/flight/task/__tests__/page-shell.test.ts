import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/flight/task", () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      list: [],
      total: 0,
    }),
    getDetail: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    advance: vi.fn(),
    getRoutes: vi.fn().mockResolvedValue([]),
    getMembers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/api/resource/drone", () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      list: [],
      total: 0,
    }),
    liveStart: vi.fn(),
    liveStop: vi.fn(),
  },
}));

import TaskPage from "@/views/flight/task/index.vue";

describe("TaskPage shadcn shell", () => {
  it("renders the task page title as the primary h1 heading", async () => {
    render(TaskPage, {
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
          pagination: { template: "<div />" },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: "任务管理", level: 1 })).not.toBeNull();
    expect(screen.getAllByTestId("flight-metric-card")).toHaveLength(4);
    expect(screen.getByTestId("task-filter-bar")).not.toBeNull();
    expect(screen.getByTestId("flight-empty-state")).not.toBeNull();
  });
});
