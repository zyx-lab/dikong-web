import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import LayoutToolbar from "./LayoutToolbar.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (value: string) => value,
  }),
}));

vi.mock("@/settings", () => ({
  defaults: {
    showSettings: true,
  },
}));

vi.mock("@/store", () => ({
  useAppStore: () => ({
    device: "desktop",
  }),
  useSettingsStore: () => ({
    theme: "light",
    sidebarColorScheme: "classic_blue",
    layout: "left",
    settingsVisible: false,
  }),
  useUserStore: () => ({
    userInfo: {
      avatar: "",
      username: "tester",
      canSwitchTenant: false,
      perms: [],
    },
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/store/modules/tenant", () => ({
  useTenantStoreHook: () => ({
    tenantList: [],
    switchTenant: vi.fn(),
  }),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => ({
      fullPath: "/dashboard",
    }),
    useRouter: () => ({
      push: vi.fn(),
      resolve: vi.fn().mockReturnValue({ href: "/#/low-altitude-screen" }),
    }),
  };
});

vi.mock("@/components/CommandPalette/index.vue", () => ({
  default: { template: '<div data-testid="command-palette" />' },
}));
vi.mock("@/components/Fullscreen/index.vue", () => ({
  default: { template: '<div data-testid="toolbar-fullscreen" />' },
}));
vi.mock("@/components/SizeSelect/index.vue", () => ({
  default: { template: '<div data-testid="size-select" />' },
}));
vi.mock("@/components/LangSelect/index.vue", () => ({
  default: { template: '<div data-testid="lang-select" />' },
}));
vi.mock("@/components/NoticeDropdown/index.vue", () => ({
  default: { template: '<div data-testid="notice-dropdown" />' },
}));
vi.mock("@/components/TenantSwitcher/index.vue", () => ({
  default: { template: '<div data-testid="tenant-switcher" />' },
}));

describe("LayoutToolbar", () => {
  it("opens low-altitude-screen in a new tab from the toolbar", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    render(LayoutToolbar, {
      global: {
        stubs: {
          ElDropdown: {
            template: "<div><slot /><slot name='dropdown' /></div>",
          },
          ElDropdownMenu: {
            template: "<div><slot /></div>",
          },
          ElDropdownItem: {
            template: "<button type='button'><slot /></button>",
          },
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "打开低空管理大屏" }));

    expect(openSpy).toHaveBeenCalledWith("/#/low-altitude-screen", "_blank", "noopener,noreferrer");
  });
});
