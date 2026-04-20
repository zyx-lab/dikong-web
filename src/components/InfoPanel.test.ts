import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import InfoPanel from "./InfoPanel.vue";

describe("InfoPanel", () => {
  it("renders title and header-extra slot content inside a panel shell", async () => {
    render(InfoPanel, {
      props: {
        title: "测试面板",
        bodyClass: "custom-body",
      },
      slots: {
        default: "<div>面板内容</div>",
        "header-extra": "<button type='button'>更多</button>",
      },
    });

    expect(await screen.findByText("测试面板")).not.toBeNull();
    expect(screen.getByText("面板内容")).not.toBeNull();
    expect(screen.getByRole("button", { name: "更多" })).not.toBeNull();
  });
});
