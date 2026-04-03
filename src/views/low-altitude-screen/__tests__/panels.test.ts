import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import TaskSituationPanel from "../components/TaskSituationPanel.vue";
import DroneOnlinePanel from "../components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "../components/AlertBroadcastPanel.vue";
import {
  LOW_ALTITUDE_TASK_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_ALERT_PANEL,
} from "../static-data";

describe("low-altitude screen panels", () => {
  it("renders the merged task panel with only 今日任务 and 执行中 summaries", () => {
    render(TaskSituationPanel, { props: { model: LOW_ALTITUDE_TASK_PANEL } });

    expect(screen.getByText("任务态势")).toBeTruthy();
    expect(screen.getByText("今日任务")).toBeTruthy();
    expect(screen.getAllByText("执行中").length).toBeGreaterThan(0);
    expect(screen.queryByText("覆盖区域")).toBeNull();
  });

  it("renders the drone panel with exactly three drone rows", () => {
    render(DroneOnlinePanel, { props: { model: LOW_ALTITUDE_DRONE_PANEL } });

    expect(screen.getAllByTestId("drone-row")).toHaveLength(3);
  });

  it("renders the alert panel with exactly three alert rows", () => {
    render(AlertBroadcastPanel, { props: { model: LOW_ALTITUDE_ALERT_PANEL } });

    expect(screen.getAllByTestId("alert-row")).toHaveLength(3);
  });
});
