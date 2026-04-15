import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import TaskSituationPanel from "../components/TaskSituationPanel.vue";
import DroneOnlinePanel from "../components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "../components/AlertBroadcastPanel.vue";
import FlightClosurePanel from "../components/FlightClosurePanel.vue";
import {
  LOW_ALTITUDE_ALERT_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_FLIGHT_PANEL,
  LOW_ALTITUDE_TASK_PANEL,
} from "../static-data";

describe("low-altitude screen panels", () => {
  it("renders the task overview panel with fixed metrics, status rows, and three running tasks", () => {
    render(TaskSituationPanel, { props: { model: LOW_ALTITUDE_TASK_PANEL } });

    expect(screen.getByText("任务总览")).toBeTruthy();
    expect(screen.getByText("任务状态分布")).toBeTruthy();
    expect(screen.getByText("当前执行任务")).toBeTruthy();
    expect(screen.getAllByTestId("task-overview-metric-card")).toHaveLength(4);
    expect(screen.getAllByTestId("task-status-row")).toHaveLength(4);
    expect(screen.getAllByTestId("task-running-item")).toHaveLength(3);
  });

  it("renders the resource support panel with two metrics and three fixed drone rows", () => {
    render(DroneOnlinePanel, { props: { model: LOW_ALTITUDE_DRONE_PANEL } });

    expect(screen.getByText("资源保障")).toBeTruthy();
    expect(screen.getAllByText("当前值守无人机")).toHaveLength(2);
    expect(screen.getAllByTestId("resource-metric-card")).toHaveLength(2);
    expect(screen.getAllByTestId("resource-drone-item")).toHaveLength(3);
  });

  it("renders the alert warning panel with one headline metric, closure progress, and three recent events", () => {
    render(AlertBroadcastPanel, { props: { model: LOW_ALTITUDE_ALERT_PANEL } });

    expect(screen.getByText("异常告警")).toBeTruthy();
    expect(screen.getByText("闭环进度")).toBeTruthy();
    expect(screen.getByText("最近异常事件")).toBeTruthy();
    expect(screen.getByTestId("alert-headline-metric")).toBeTruthy();
    expect(screen.getAllByTestId("alert-event-item")).toHaveLength(3);
  });

  it("renders the flight closure panel with four metrics and three recent abnormal flights", () => {
    render(FlightClosurePanel, { props: { model: LOW_ALTITUDE_FLIGHT_PANEL } });

    expect(screen.getByText("飞行闭环")).toBeTruthy();
    expect(screen.getByText("最近异常飞行")).toBeTruthy();
    expect(screen.getAllByTestId("flight-metric-card")).toHaveLength(4);
    expect(screen.getAllByTestId("flight-abnormal-item")).toHaveLength(3);
  });
});
