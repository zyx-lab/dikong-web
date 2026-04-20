import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { RouteType } from "@/api/flight/types";
import { createEmptyRoute } from "@/views/route/utils";

const push = vi.fn();
const replace = vi.fn();

vi.mock("vue-router", () => ({
  useRoute: () => ({
    params: { id: "draft-1" },
    query: { draft: "1" },
  }),
  useRouter: () => ({
    push,
    replace,
  }),
}));

vi.mock("@/store/modules/settings", () => ({
  useSettingsStore: () => ({
    theme: "light",
  }),
}));

vi.mock("@/views/route/components/RoutePlannerMap.vue", () => ({
  default: defineComponent({
    setup(_, { expose }) {
      expose({
        flyToRoute: vi.fn(),
      });
      return {};
    },
    template: '<div data-testid="route-planner-map" />',
  }),
}));

vi.mock("@/views/route/components/RoutePlannerSidebar.vue", () => ({
  default: {
    template: '<div data-testid="route-planner-sidebar" />',
  },
}));

vi.mock("@/views/route/storage", () => ({
  getRouteDraftById: () =>
    createEmptyRoute({
      id: "draft-1",
      persisted: false,
      routeName: "测试航线",
      routeType: RouteType.POINT,
    }),
  saveRouteDraft: vi.fn(),
  removeRouteDraft: vi.fn(),
}));

vi.mock("@/utils", () => ({
  downloadFile: vi.fn(),
}));

vi.mock("@/api/flight/route", () => ({
  default: {
    getDetail: vi.fn(),
    getKmz: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}));

import RouteDetailPage from "@/views/route/detail.vue";

describe("RouteDetailPage shell", () => {
  it("renders the route detail title as the primary h1 heading", async () => {
    render(RouteDetailPage, {
      global: {
        directives: {
          loading: {},
        },
        stubs: {
          ElButton: { template: "<button type='button'><slot /></button>" },
          ElRow: { template: "<div><slot /></div>" },
          ElCol: { template: "<div><slot /></div>" },
          ElCard: { template: "<section><slot /><slot name='header' /></section>" },
          ElEmpty: { template: "<div />" },
          ElDialog: { template: "<div><slot /><slot name='footer' /></div>" },
          ElTag: { template: "<span><slot /></span>" },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: "测试航线", level: 1 })).not.toBeNull();
    expect(screen.getByTestId("route-detail-shell")).not.toBeNull();
    expect(screen.getByTestId("route-detail-sidebar-card")).not.toBeNull();
    expect(screen.getByTestId("route-detail-map-card")).not.toBeNull();
    expect(screen.getByTestId("route-planner-map")).not.toBeNull();
    expect(screen.getByTestId("route-planner-sidebar")).not.toBeNull();
  });
});
