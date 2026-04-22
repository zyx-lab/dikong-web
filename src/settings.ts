/**
 * 应用配置
 */

import type { AppSettings } from "@/types/ui";
import { LayoutMode, ComponentSize, SidebarColor, ThemeMode, LanguageEnum } from "@/enums";

const env = import.meta.env;
const { pkg } = __APP_INFO__;

// ============================================
// 应用配置
// ============================================
export const appConfig = {
  name: pkg.name as string,
  version: pkg.version as string,
  title: (env.VITE_APP_TITLE as string) || pkg.name,

  // 功能开关
  tenantEnabled: env.VITE_APP_TENANT_ENABLED === "true",
} as const;

// ============================================
// 用户偏好默认值
// ============================================
export const defaultSettings: AppSettings = {
  title: pkg.name,
  version: pkg.version,
  showSettings: true,
  showTagsView: true,
  showAppLogo: true,
  layout: LayoutMode.MIX,
  theme: ThemeMode.LIGHT,
  size: ComponentSize.DEFAULT,
  language: LanguageEnum.ZH_CN,
  themeColor: "#2B5B9E",
  showWatermark: false,
  watermarkContent: pkg.name,
  sidebarColorScheme: SidebarColor.MINIMAL_WHITE,
};

export const defaults = {
  ...defaultSettings,
  pageSwitchingAnimation: "fade-slide",
} as const;

// ============================================
// 主题色预设
// ============================================
export const themeColorPresets = [
  "#4080FF",
  "#1890FF",
  "#409EFF",
  "#FA8C16",
  "#722ED1",
  "#13C2C2",
  "#52C41A",
  "#F5222D",
  "#2F54EB",
  "#EB2F96",
] as const;
