import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "@/views/route/utils";
import RouteDispatchDialog from "./RouteDispatchDialog.vue";

describe("RouteDispatchDialog", () => {
  it("renders as a shadcn dialog and exposes confirm/cancel actions", async () => {
    const close = vi.fn();
    const confirm = vi.fn();

    render(RouteDispatchDialog, {
      props: {
        open: true,
        routeDraft: createEmptyRoute({
          id: "route-1",
          persisted: true,
          isPublished: false,
          routeName: "测试航线",
          routeType: RouteType.POINT,
        }),
        canPublishRoute: true,
        dispatchStatusText: "确认后将通过正式业务 API 获取当前航线的 KMZ 下发包。",
        dispatching: false,
        onClose: close,
        onConfirm: confirm,
      },
    });

    expect(await screen.findByText("下发航线")).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toContain(
      "下发航线"
    );

    await fireEvent.click(screen.getByRole("button", { name: "确认下发" }));
    expect(confirm).toHaveBeenCalled();
  });
});
