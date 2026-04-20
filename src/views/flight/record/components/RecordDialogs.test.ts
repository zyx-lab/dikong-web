import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import RecordDetailDialog from "./RecordDetailDialog.vue";
import RecordEditSheet from "./RecordEditSheet.vue";

const detailData = {
  id: 1,
  flightNo: "FLIGHT-001",
  missionName: "河道巡检",
  routeName: "北段航线",
  airportName: "北区机场",
  deviceSn: "SN-001",
  droneName: "Matrice 350",
  pilotName: "张三",
  startTime: "2026-04-20 09:00:00",
  endTime: "2026-04-20 09:30:00",
  flightDuration: 1800,
  photoCount: 32,
  videoCount: 2,
  status: 1,
  replayUrl: null,
  createdAt: "2026-04-20 08:30:00",
  updatedAt: "2026-04-20 09:35:00",
};

const editForm = {
  id: 1,
  missionName: "河道巡检",
  routeName: "北段航线",
  airportName: "北区机场",
  droneName: "Matrice 350",
  pilotName: "张三",
  flightDuration: 1800,
  photoCount: 32,
  videoCount: 2,
};

describe("Record dialogs", () => {
  it("renders the record detail dialog as a dialog", async () => {
    render(RecordDetailDialog, {
      props: {
        open: true,
        loading: false,
        data: detailData,
      },
    });

    expect(await screen.findByText("飞行记录详情")).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toContain(
      "飞行记录详情"
    );
    expect(screen.getByText("FLIGHT-001")).not.toBeNull();
  });

  it("renders the record editor as a sheet", async () => {
    render(RecordEditSheet, {
      props: {
        open: true,
        formData: editForm,
        submitLoading: false,
      },
    });

    expect(await screen.findByText("编辑飞行记录")).not.toBeNull();
    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toContain(
      "编辑飞行记录"
    );
    expect(screen.getByRole("button", { name: "取消" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "保存" })).not.toBeNull();
  });
});
