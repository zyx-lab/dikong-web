import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import type { TaskForm, TaskVO } from "@/api/flight/task";
import type { RouteOption, MemberOption } from "@/api/flight/task";
import { RouteType } from "@/api/flight/types";

import TaskDetailDialog from "./TaskDetailDialog.vue";
import TaskEditorSheet from "./TaskEditorSheet.vue";

const routeOptions: RouteOption[] = [{ id: 1, name: "测试航线" }];
const droneOptions = [{ id: 7, name: "测试无人机" }];
const pilotOptions: MemberOption[] = [
  { memberId: 5, displayName: "张三", roleCodes: ["pilot_operator"] },
];

const formData: TaskForm = {
  name: "任务 A",
  routeId: 1,
  droneId: 7,
  pilotId: 5,
  scheduledAt: "2026-04-20 10:00:00",
  remark: "备注",
};

const detailData: TaskVO = {
  id: 1,
  name: "任务 A",
  routeId: 1,
  routeName: "测试航线",
  droneId: 7,
  droneName: "测试无人机",
  pilotId: 5,
  pilotName: "张三",
  scheduledAt: "2026-04-20 10:00:00",
  status: 1,
  createdAt: "2026-04-20 09:00:00",
  updatedAt: "2026-04-20 09:30:00",
  remark: "备注",
};

describe("Task dialogs", () => {
  it("renders the task editor as a sheet", async () => {
    render(TaskEditorSheet, {
      props: {
        open: true,
        title: "新增任务",
        formData,
        routeOptions,
        droneOptions,
        pilotOptions,
        submitLoading: false,
      },
      global: {
        stubs: {
          ElDatePicker: { template: "<input />" },
        },
      },
    });

    expect(await screen.findByText("新增任务")).not.toBeNull();
    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toContain(
      "新增任务"
    );
    expect(screen.getByRole("button", { name: "取消" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "保存" })).not.toBeNull();
  });

  it("renders the task detail dialog as a dialog", async () => {
    render(TaskDetailDialog, {
      props: {
        open: true,
        loading: false,
        data: detailData,
      },
    });

    expect(await screen.findByText("任务详情")).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toContain(
      "任务详情"
    );
    expect(screen.getByText("测试无人机")).not.toBeNull();
  });
});
