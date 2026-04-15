# Low-Altitude Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a brand-new `/low-altitude-screen` page using local static display data, a fullscreen 3DGS-ready scene shell, and floating left/right overlay panels, without wiring any existing business page APIs.

**Architecture:** Add a dedicated route entry in `src/router/index.ts` for `/low-altitude-screen`, and place all implementation files under a new folder `src/views/low-altitude-screen/`, parallel to `src/views/dashboard/`. The first version is a static visual page: all task, drone, alert, and scene content comes from one feature-local `static-data.ts`. The background scene is isolated behind `scene/runtime.ts` so the current shell can ship now and later swap to a real 3DGS runtime without rewriting the page or overlay panels.

**Tech Stack:** Vue 3 + TypeScript + Element Plus + Three.js runtime shell + SCSS + Vitest + Testing Library

---

## File Map

- Modify: `src/router/index.ts`
  - Add a dedicated route for `/low-altitude-screen`.
- Create: `src/views/low-altitude-screen/index.vue`
  - Route entry page for the new large screen.
- Create: `src/views/low-altitude-screen/types.ts`
  - Feature-local display types for task summary, task list rows, drone rows, alert rows, and scene overlays.
- Create: `src/views/low-altitude-screen/static-data.ts`
  - Single source of first-version static screen data. No API calls and no split fake business modules.
- Create: `src/views/low-altitude-screen/scene-model.ts`
  - Pure helpers that turn static screen data into scene line/point models and selected-label state.
- Create: `src/views/low-altitude-screen/scene/runtime.ts`
  - Encapsulated background scene bootstrap/teardown seam. First pass uses a simple `three` shell and leaves the renderer swappable for future 3DGS runtime integration.
- Create: `src/views/low-altitude-screen/components/LowAltitudeSceneHost.vue`
  - Fullscreen scene container that owns the canvas, overlay slots, and point-label expansion behavior.
- Create: `src/views/low-altitude-screen/components/TaskSituationPanel.vue`
  - Left floating panel. Header summary only keeps `今日任务` and `执行中`. Body is the auto-rolling executing task list.
- Create: `src/views/low-altitude-screen/components/DroneOnlinePanel.vue`
  - Right-top floating panel. Header summary keeps `在线 / 可调度 / 待命`. Body keeps exactly 3 drone rows.
- Create: `src/views/low-altitude-screen/components/AlertBroadcastPanel.vue`
  - Right-bottom floating panel. Header summary keeps `总数 / 高等级 / 跟踪中`. Body keeps exactly 3 alert rows.
- Create: `src/views/low-altitude-screen/styles.scss`
  - Feature-local fullscreen layout, floating panel positioning, and screen-specific visual language.
- Create: `vitest.config.ts`
  - Explicit happy-dom config and `@` alias for screen tests.
- Create: `src/test/setup.ts`
  - Shared browser shims for tests.
- Create: `src/views/low-altitude-screen/__tests__/scene-model.test.ts`
  - Unit tests for overlay visibility and selected-label behavior.
- Create: `src/views/low-altitude-screen/__tests__/panels.test.ts`
  - Component render tests for the three panels using static screen data.
- Create: `src/views/low-altitude-screen/__tests__/page.test.ts`
  - Composition test for the new route page shell.

## Scope Guard

This implementation plan intentionally does **not** include:

- business API integration
- route storage reuse
- task-to-scene camera focus
- task-to-alert linkage
- time/weather chrome
- dynamic fetching of task/route/drone/pilot/alert data
- split fake files such as `mock-task.ts`, `mock-drone.ts`, `mock-alert.ts`

The first version is a static visual page with a stable structure. Dynamic data and real 3DGS runtime integration happen later behind the same layout and scene/runtime seam.

### Task 1: Add The Feature Folder, Route Entry, Static Data Contracts, And Test Harness

**Files:**
- Modify: `src/router/index.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/views/low-altitude-screen/types.ts`
- Create: `src/views/low-altitude-screen/static-data.ts`
- Test: `src/views/low-altitude-screen/__tests__/panels.test.ts`

- [ ] **Step 1: Write the failing panel test against the static screen contract**

```ts
// src/views/low-altitude-screen/__tests__/panels.test.ts
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import TaskSituationPanel from "../components/TaskSituationPanel.vue";
import DroneOnlinePanel from "../components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "../components/AlertBroadcastPanel.vue";
import {
  LOW_ALTITUDE_TASK_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_ALERT_PANEL,
} from "../static-data";

describe("low-altitude screen panels", () => {
  it("renders the merged task panel with only 今日任务 and 执行中 summaries", () => {
    render(TaskSituationPanel, { props: { model: LOW_ALTITUDE_TASK_PANEL } });

    expect(screen.getByText("任务态势")).toBeTruthy();
    expect(screen.getByText("今日任务")).toBeTruthy();
    expect(screen.getByText("执行中")).toBeTruthy();
    expect(screen.queryByText("覆盖区域")).toBeNull();
  });

  it("renders the drone panel with exactly three drone rows", () => {
    render(DroneOnlinePanel, { props: { model: LOW_ALTITUDE_DRONE_PANEL } });

    expect(screen.getAllByTestId("drone-row")).toHaveLength(3);
  });

  it("renders the alert panel with exactly three alert rows", () => {
    render(AlertBroadcastPanel, { props: { model: LOW_ALTITUDE_ALERT_PANEL } });

    expect(screen.getAllByTestId("alert-row")).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/panels.test.ts`

Expected: FAIL with missing `vitest.config.ts`, static data exports, or panel components.

- [ ] **Step 3: Add the route entry and test harness**

```ts
// add to src/router/index.ts inside constantRoutes children under "/"
{
  path: "low-altitude-screen",
  component: () => import("@/views/low-altitude-screen/index.vue"),
  name: "LowAltitudeScreen",
  meta: {
    title: "低空管理大屏",
    icon: "homepage",
    keepAlive: true,
  },
},
```

```ts
// vitest.config.ts
import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    css: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

```ts
// src/test/setup.ts
import { vi } from "vitest";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.scrollTo = vi.fn();
```

- [ ] **Step 4: Define the screen-local types and one static data source**

```ts
// src/views/low-altitude-screen/types.ts
export interface TaskSituationRow {
  id: string;
  taskName: string;
  statusLabel: string;
  routeName: string;
  startTime: string;
}

export interface TaskSituationPanelModel {
  summary: {
    todayCount: number;
    executingCount: number;
  };
  rows: TaskSituationRow[];
}

export interface DroneOnlineRow {
  id: string;
  droneName: string;
  currentLabel: string;
  statusLabel: string;
}

export interface DroneOnlinePanelModel {
  summary: {
    onlineCount: number;
    dispatchableCount: number;
    standbyCount: number;
  };
  rows: DroneOnlineRow[];
}

export interface AlertBroadcastRow {
  id: string;
  title: string;
  levelLabel: string;
  happenedAt: string;
}

export interface AlertBroadcastPanelModel {
  summary: {
    totalCount: number;
    highLevelCount: number;
    trackingCount: number;
  };
  rows: AlertBroadcastRow[];
}

export interface SceneRouteLine {
  id: string;
  label: string;
  points: Array<{ x: number; y: number }>;
}

export interface SceneMarker {
  id: string;
  kind: "drone" | "pilot" | "alert";
  x: number;
  y: number;
  tone: "primary" | "success" | "danger";
  label: string;
}
```

```ts
// src/views/low-altitude-screen/static-data.ts
import type {
  AlertBroadcastPanelModel,
  DroneOnlinePanelModel,
  SceneMarker,
  SceneRouteLine,
  TaskSituationPanelModel,
} from "./types";

export const LOW_ALTITUDE_TASK_PANEL: TaskSituationPanelModel = {
  summary: {
    todayCount: 128,
    executingCount: 82,
  },
  rows: [
    { id: "task-1", taskName: "港区东侧岸线巡查", statusLabel: "执行中", routeName: "东侧岸线主航线 A-03", startTime: "09:15" },
    { id: "task-2", taskName: "危化区外场巡检", statusLabel: "重点关注", routeName: "危化区巡检环线 B-02", startTime: "09:42" },
    { id: "task-3", taskName: "园区围界协同飞巡", statusLabel: "按计划", routeName: "园区外围巡检线 C-05", startTime: "10:03" },
    { id: "task-4", taskName: "西岸水域协同巡查", statusLabel: "执行中", routeName: "西岸水域巡查 D-01", startTime: "10:16" },
  ],
};

export const LOW_ALTITUDE_DRONE_PANEL: DroneOnlinePanelModel = {
  summary: {
    onlineCount: 46,
    dispatchableCount: 39,
    standbyCount: 7,
  },
  rows: [
    { id: "drone-1", droneName: "M30T-03", currentLabel: "港区东侧岸线巡查", statusLabel: "执行中" },
    { id: "drone-2", droneName: "M300-01", currentLabel: "危化区外场巡检", statusLabel: "重点关注" },
    { id: "drone-3", droneName: "M350-02", currentLabel: "综合待命机位", statusLabel: "待命" },
  ],
};

export const LOW_ALTITUDE_ALERT_PANEL: AlertBroadcastPanelModel = {
  summary: {
    totalCount: 7,
    highLevelCount: 2,
    trackingCount: 5,
  },
  rows: [
    { id: "alert-1", title: "危化区热异常告警", levelLabel: "高", happenedAt: "10:26" },
    { id: "alert-2", title: "航线偏移预警", levelLabel: "中", happenedAt: "09:52" },
    { id: "alert-3", title: "重点区域围界触发", levelLabel: "低", happenedAt: "08:41" },
  ],
};

export const LOW_ALTITUDE_SCENE_ROUTES: SceneRouteLine[] = [
  {
    id: "route-a-03",
    label: "东侧岸线主航线 A-03",
    points: [
      { x: 0.08, y: 0.72 },
      { x: 0.28, y: 0.42 },
      { x: 0.62, y: 0.28 },
      { x: 0.92, y: 0.64 },
    ],
  },
];

export const LOW_ALTITUDE_SCENE_MARKERS: SceneMarker[] = [
  { id: "drone-1", kind: "drone", x: 0.24, y: 0.36, tone: "success", label: "M30T-03" },
  { id: "drone-2", kind: "drone", x: 0.40, y: 0.48, tone: "success", label: "M300-01" },
  { id: "pilot-1", kind: "pilot", x: 0.56, y: 0.62, tone: "primary", label: "张工" },
  { id: "alert-1", kind: "alert", x: 0.76, y: 0.58, tone: "danger", label: "危化区热异常告警" },
];
```

- [ ] **Step 5: Run the panel test again**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/panels.test.ts`

Expected: FAIL now only because the panel components do not exist yet.

- [ ] **Step 6: Commit**

```bash
git add src/router/index.ts vitest.config.ts src/test/setup.ts src/views/low-altitude-screen/types.ts src/views/low-altitude-screen/static-data.ts src/views/low-altitude-screen/__tests__/panels.test.ts
git commit -m "test: add low-altitude screen contracts"
```

### Task 2: Build The Fullscreen Scene Model And 3DGS-Ready Runtime Seam

**Files:**
- Create: `src/views/low-altitude-screen/scene-model.ts`
- Create: `src/views/low-altitude-screen/scene/runtime.ts`
- Create: `src/views/low-altitude-screen/components/LowAltitudeSceneHost.vue`
- Test: `src/views/low-altitude-screen/__tests__/scene-model.test.ts`
- Reference: `package.json`

- [ ] **Step 1: Write the failing scene model test**

```ts
// src/views/low-altitude-screen/__tests__/scene-model.test.ts
import { describe, expect, it } from "vitest";
import { buildSceneModel } from "../scene-model";
import {
  LOW_ALTITUDE_SCENE_MARKERS,
  LOW_ALTITUDE_SCENE_ROUTES,
} from "../static-data";

describe("buildSceneModel", () => {
  it("hides labels by default and only expands the selected marker", () => {
    const scene = buildSceneModel({
      routes: LOW_ALTITUDE_SCENE_ROUTES,
      markers: LOW_ALTITUDE_SCENE_MARKERS,
      selectedMarkerId: "alert-1",
    });

    expect(scene.routes).toHaveLength(1);
    expect(scene.markers.find((item) => item.id === "alert-1")?.expanded).toBe(true);
    expect(
      scene.markers.filter((item) => item.id !== "alert-1").every((item) => item.expanded === false)
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/scene-model.test.ts`

Expected: FAIL with missing `scene-model.ts`.

- [ ] **Step 3: Implement the pure scene model**

```ts
// src/views/low-altitude-screen/scene-model.ts
import type { SceneMarker, SceneRouteLine } from "./types";

export function buildSceneModel(input: {
  routes: SceneRouteLine[];
  markers: SceneMarker[];
  selectedMarkerId?: string | null;
}) {
  return {
    routes: input.routes,
    markers: input.markers.map((marker) => ({
      ...marker,
      expanded: input.selectedMarkerId === marker.id,
    })),
    selectedMarkerId: input.selectedMarkerId ?? null,
  };
}
```

- [ ] **Step 4: Implement the 3DGS-ready runtime seam**

```ts
// src/views/low-altitude-screen/scene/runtime.ts
import * as THREE from "three";

export interface DashboardSceneRuntime {
  destroy(): void;
  resize(): void;
}

export function mountDashboardScene(canvas: HTMLCanvasElement): DashboardSceneRuntime {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  camera.position.set(0, 2.2, 7.5);
  renderer.setPixelRatio(window.devicePixelRatio);

  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }

  resize();

  return {
    destroy() {
      renderer.dispose();
    },
    resize,
  };
}
```

- [ ] **Step 5: Implement the fullscreen host component**

```vue
<!-- src/views/low-altitude-screen/components/LowAltitudeSceneHost.vue -->
<template>
  <div class="low-altitude-scene-host">
    <canvas ref="canvasRef" class="low-altitude-scene-host__canvas" />

    <svg class="low-altitude-scene-host__overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        v-for="route in model.routes"
        :key="route.id"
        :points="route.points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')"
        class="low-altitude-scene-host__route"
      />
    </svg>

    <button
      v-for="marker in model.markers"
      :key="marker.id"
      type="button"
      class="low-altitude-scene-host__marker"
      :class="[
        `is-${marker.kind}`,
        `is-${marker.tone}`,
        { 'is-expanded': marker.expanded },
      ]"
      :style="{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }"
    >
      <span v-if="marker.expanded" class="low-altitude-scene-host__label">{{ marker.label }}</span>
    </button>

    <div class="low-altitude-scene-host__slot">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 6: Run the scene-model test again**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/scene-model.test.ts`

Expected: PASS with one expanded marker and all others collapsed.

- [ ] **Step 7: Commit**

```bash
git add src/views/low-altitude-screen/scene-model.ts src/views/low-altitude-screen/scene/runtime.ts src/views/low-altitude-screen/components/LowAltitudeSceneHost.vue src/views/low-altitude-screen/__tests__/scene-model.test.ts
git commit -m "feat: add low-altitude scene shell"
```

### Task 3: Build The Three Floating Overlay Panels

**Files:**
- Create: `src/views/low-altitude-screen/components/TaskSituationPanel.vue`
- Create: `src/views/low-altitude-screen/components/DroneOnlinePanel.vue`
- Create: `src/views/low-altitude-screen/components/AlertBroadcastPanel.vue`
- Create: `src/views/low-altitude-screen/styles.scss`
- Test: `src/views/low-altitude-screen/__tests__/panels.test.ts`

- [ ] **Step 1: Implement the left task panel**

```vue
<!-- src/views/low-altitude-screen/components/TaskSituationPanel.vue -->
<script setup lang="ts">
import type { TaskSituationPanelModel } from "../types";

defineProps<{
  model: TaskSituationPanelModel;
}>();
</script>
```

Requirements:

- header title is `任务态势`
- summary only shows `今日任务` and `执行中`
- body renders auto-rolling task rows
- each row only shows `任务名称 / 执行状态 / 当前航线 / 开始时间`

- [ ] **Step 2: Implement the right-top drone panel**

```vue
<!-- src/views/low-altitude-screen/components/DroneOnlinePanel.vue -->
<script setup lang="ts">
import type { DroneOnlinePanelModel } from "../types";

defineProps<{
  model: DroneOnlinePanelModel;
}>();
</script>
```

Requirements:

- title is `无人机在线态势`
- summary shows `在线 / 可调度 / 待命`
- body renders exactly 3 drone rows
- every row must include a `data-testid="drone-row"` hook

- [ ] **Step 3: Implement the right-bottom alert panel**

```vue
<!-- src/views/low-altitude-screen/components/AlertBroadcastPanel.vue -->
<script setup lang="ts">
import type { AlertBroadcastPanelModel } from "../types";

defineProps<{
  model: AlertBroadcastPanelModel;
}>();
</script>
```

Requirements:

- title is `重点告警`
- summary shows `总数 / 高等级 / 跟踪中`
- body renders exactly 3 alert rows
- every row must include a `data-testid="alert-row"` hook
- every row only shows `告警名称 / 告警等级 / 发生时间`

- [ ] **Step 4: Add feature-local fullscreen and floating-panel styles**

```scss
// src/views/low-altitude-screen/styles.scss
.low-altitude-screen-page {
  position: relative;
  min-height: calc(100vh - 30px);
  overflow: hidden;
  border-radius: 24px;
  background: #08131d;
}

.low-altitude-screen-page__left {
  position: absolute;
  top: 22px;
  left: 22px;
  bottom: 22px;
  width: 304px;
  z-index: 4;
}

.low-altitude-screen-page__right {
  position: absolute;
  top: 22px;
  right: 22px;
  bottom: 22px;
  width: 290px;
  z-index: 4;
  display: grid;
  grid-template-rows: 240px 1fr;
  gap: 14px;
}
```

- [ ] **Step 5: Run the panel test again**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/panels.test.ts`

Expected: PASS with merged task summary, 3 drone rows, and 3 alert rows.

- [ ] **Step 6: Commit**

```bash
git add src/views/low-altitude-screen/components/TaskSituationPanel.vue src/views/low-altitude-screen/components/DroneOnlinePanel.vue src/views/low-altitude-screen/components/AlertBroadcastPanel.vue src/views/low-altitude-screen/styles.scss src/views/low-altitude-screen/__tests__/panels.test.ts
git commit -m "feat: add low-altitude screen panels"
```

### Task 4: Compose The New Page Entry

**Files:**
- Create: `src/views/low-altitude-screen/index.vue`
- Test: `src/views/low-altitude-screen/__tests__/page.test.ts`

- [ ] **Step 1: Write the failing page composition test**

```ts
// src/views/low-altitude-screen/__tests__/page.test.ts
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import LowAltitudeScreenPage from "../index.vue";

describe("low-altitude screen page", () => {
  it("renders the fullscreen scene and the three merged overlay areas", async () => {
    render(LowAltitudeScreenPage);

    expect(await screen.findByText("任务态势")).toBeTruthy();
    expect(screen.getByText("无人机在线态势")).toBeTruthy();
    expect(screen.getByText("重点告警")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/page.test.ts`

Expected: FAIL because `src/views/low-altitude-screen/index.vue` does not exist yet.

- [ ] **Step 3: Create the page entry**

```vue
<!-- src/views/low-altitude-screen/index.vue -->
<template>
  <div class="app-container">
    <section class="low-altitude-screen-page">
      <LowAltitudeSceneHost :model="sceneModel">
        <TaskSituationPanel class="low-altitude-screen-page__left" :model="taskPanel" />
        <div class="low-altitude-screen-page__right">
          <DroneOnlinePanel :model="dronePanel" />
          <AlertBroadcastPanel :model="alertPanel" />
        </div>
      </LowAltitudeSceneHost>
    </section>
  </div>
</template>

<script setup lang="ts">
import "./styles.scss";
import LowAltitudeSceneHost from "./components/LowAltitudeSceneHost.vue";
import TaskSituationPanel from "./components/TaskSituationPanel.vue";
import DroneOnlinePanel from "./components/DroneOnlinePanel.vue";
import AlertBroadcastPanel from "./components/AlertBroadcastPanel.vue";
import {
  LOW_ALTITUDE_ALERT_PANEL,
  LOW_ALTITUDE_DRONE_PANEL,
  LOW_ALTITUDE_SCENE_MARKERS,
  LOW_ALTITUDE_SCENE_ROUTES,
  LOW_ALTITUDE_TASK_PANEL,
} from "./static-data";
import { buildSceneModel } from "./scene-model";

defineOptions({ name: "LowAltitudeScreenPage" });

const taskPanel = LOW_ALTITUDE_TASK_PANEL;
const dronePanel = LOW_ALTITUDE_DRONE_PANEL;
const alertPanel = LOW_ALTITUDE_ALERT_PANEL;
const sceneModel = buildSceneModel({
  routes: LOW_ALTITUDE_SCENE_ROUTES,
  markers: LOW_ALTITUDE_SCENE_MARKERS,
  selectedMarkerId: null,
});
</script>
```

- [ ] **Step 4: Run the page test again**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/page.test.ts`

Expected: PASS with the new page entry mounted directly.

- [ ] **Step 5: Run full screen verification**

Run: `pnpm test:run src/views/low-altitude-screen/__tests__/scene-model.test.ts src/views/low-altitude-screen/__tests__/panels.test.ts src/views/low-altitude-screen/__tests__/page.test.ts`

Expected: PASS with all low-altitude screen tests green.

Run: `pnpm type-check`

Expected: PASS with no TypeScript errors.

Run: `pnpm exec eslint "src/views/low-altitude-screen/**/*.{ts,vue}" "src/test/**/*.ts"`

Expected: PASS with no lint errors.

Run: `pnpm exec stylelint "src/views/low-altitude-screen/**/*.vue" "src/views/low-altitude-screen/**/*.scss"`

Expected: PASS with no stylelint errors.

- [ ] **Step 6: Manually verify the browser result**

Run: `pnpm dev`

Expected manual checks:

- `/low-altitude-screen` is a fullscreen large-screen layout
- the central scene visually covers the whole page behind overlays
- the left panel shows only `今日任务` and `执行中` summaries
- the right-top panel keeps 3 drone rows
- the right-bottom panel keeps 3 alert rows
- the page has no top info bar and no title card
- the scene shows only point/icon state by default and only expands text for a selected marker

- [ ] **Step 7: Commit**

```bash
git add src/router/index.ts src/views/low-altitude-screen/index.vue
git commit -m "feat: add low-altitude screen page route"
```

## Self-Review Checklist

- Spec coverage:
  - fullscreen 3DGS-ready scene shell -> Task 2 + Task 4
  - left merged `任务态势` with only `今日任务 / 执行中` -> Task 1 + Task 3 + Task 4
  - right-top `无人机在线态势` with 3 rows -> Task 1 + Task 3 + Task 4
  - right-bottom `重点告警` with summary + 3 rows -> Task 1 + Task 3 + Task 4
  - no scene focus linkage / no alert linkage -> Task 2 + Task 4 manual checks
  - route and file structure moved out of `dashboard` -> Task 1 + Task 4
- Placeholder scan:
  - no `TODO`
  - no `TBD`
  - every task includes exact files, commands, and expected outcomes
- Type consistency:
  - display models live in one `types.ts`
  - first-version content comes only from `static-data.ts`
  - scene expansion state is derived only in `scene-model.ts`

## Notes For The Implementer

- First version must stay static. Do not pull data from any business page or API.
- The route path is `/low-altitude-screen`, and the file tree lives entirely under `src/views/low-altitude-screen/`.
- Do not create split fake modules such as `mock-task.ts`, `mock-drone.ts`, or `mock-alert.ts`. Keep the first screen source in one `static-data.ts`.
- Keep scene boot logic isolated in `scene/runtime.ts` so later 3DGS integration replaces one seam instead of touching all panels and page composition.
- Keep all fullscreen overlay styling local to `src/views/low-altitude-screen/styles.scss`. Do not push these absolute-position large-screen rules into `src/styles/common.scss`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-02-low-altitude-screen-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
