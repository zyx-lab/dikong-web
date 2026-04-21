import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import type { FlightLogItem } from "@/views/flight/record/data";
import RecordFlightLogList from "./RecordFlightLogList.vue";

const logs: FlightLogItem[] = [
  { id: 1, time: "10:20:31", level: "danger", content: "电机异常，任务已中止，正在执行紧急返航" },
  {
    id: 2,
    time: "10:18:05",
    level: "warning",
    content: "注意：通信信号波动，已自动切换至备用链路",
  },
];

describe("RecordFlightLogList", () => {
  it("renders the provided flight logs in order", async () => {
    render(RecordFlightLogList, {
      props: {
        logs,
      },
    });

    expect(await screen.findByText("10:20:31")).not.toBeNull();
    expect(screen.getByText("电机异常，任务已中止，正在执行紧急返航")).not.toBeNull();
    expect(screen.getByText("10:18:05")).not.toBeNull();
  });
});
