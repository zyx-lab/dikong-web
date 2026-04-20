import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import type { FlightRecordItem } from "@/views/flight/record/data";
import { AlarmVerifyStatus } from "@/views/flight/record/data";
import RecordDetailHeader from "./RecordDetailHeader.vue";

const record: FlightRecordItem = {
  id: 1,
  recordNo: "REC-001",
  taskName: "河道巡检任务",
  routeName: "北段航线",
  airportName: "北区机场",
  droneName: "Matrice 350",
  pilotName: "张三",
  flightDurationText: "5分18秒",
  durationSeconds: 318,
  alarmCount: 2,
  imageCount: 12,
  videoCount: 1,
  executeTime: "2026-04-20 09:30:55",
  executeDate: "2026-04-20",
  verifiedAlarmCount: 2,
  totalAlarmCount: 3,
  alarmVerifyStatus: AlarmVerifyStatus.PENDING,
  batteryPercent: 76,
  locationLabel: "秦淮河东段河道走廊",
  mapTheme: "linear-gradient(#111, #222)",
  telemetry: [],
  flightLogs: [],
};

describe("RecordDetailHeader", () => {
  it("renders the record summary in a shadcn-style header block", async () => {
    render(RecordDetailHeader, {
      props: {
        record,
      },
    });

    expect(await screen.findByRole("heading", { name: "河道巡检任务", level: 1 })).not.toBeNull();
    expect(screen.getByText("REC-001")).not.toBeNull();
    expect(screen.getByText("5分18秒")).not.toBeNull();
    expect(screen.getByText("76%")).not.toBeNull();
  });
});
