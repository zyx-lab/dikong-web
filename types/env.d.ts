/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 */
interface ImportMetaEnv {
  readonly VITE_APP_PORT: number;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_BASE_API: string;
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_TENANT_ENABLED?: string;
  readonly VITE_MOCK_DEV_SERVER: boolean;
  readonly VITE_CESIUM_ION_TOKEN?: string;
  readonly VITE_CESIUM_ION_TERRAIN_ASSET_ID?: string;
  readonly VITE_CESIUM_TERRAIN_URL?: string;
  readonly VITE_RADAR_START_LATITUDE?: string;
  readonly VITE_RADAR_START_LONGITUDE?: string;
  readonly VITE_RADAR_START_ALTITUDE_METERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_INFO__: {
  pkg: {
    name: string;
    version: string;
    engines: {
      node: string;
    };
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  buildTimestamp: number;
};

declare const CESIUM_BASE_URL: string;
