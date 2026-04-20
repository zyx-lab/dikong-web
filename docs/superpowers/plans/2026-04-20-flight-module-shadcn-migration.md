# Flight Module Shadcn Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `shadcn-vue` to the existing Vue/Vite app, rebuild the flight module page shell with it, and migrate `航线管理` first, then reuse the same patterns for `任务管理` and `飞行记录`.

**Architecture:** Keep the current Vue 3 + Vite + UnoCSS + Element Plus project running, then layer `shadcn-vue` on top instead of rebuilding the app. Create a reusable flight-page shell, migrate the route page to that shell first, and only then port the same building blocks into the task and record pages while preserving existing business logic.

**Tech Stack:** Vue 3, Vite, TypeScript, Vitest, UnoCSS, Element Plus, `shadcn-vue`, Tailwind CSS v4, `@tailwindcss/vite`

---

## File Structure

### New files

- `components.json`
  Purpose: `shadcn-vue` project configuration for generated UI components and aliases.
- `src/lib/utils.ts`
  Purpose: host the shared `cn()` helper used by generated UI components.
- `src/styles/shadcn.css`
  Purpose: Tailwind v4 import, theme variables, and `shadcn-vue` global tokens.
- `src/components/ui/*`
  Purpose: generated `shadcn-vue` source components such as button, card, badge, input, select, dialog, sheet, separator, skeleton, and pagination.
- `src/components/flight/FlightPageHeader.vue`
  Purpose: shared page header used by route, task, and record pages.
- `src/components/flight/FlightMetricCard.vue`
  Purpose: shared metric/stat card used across flight-module pages.
- `src/components/flight/FlightEmptyState.vue`
  Purpose: shared empty-state block for list pages.
- `src/views/route/components/RouteFilterBar.vue`
  Purpose: route-page filter area built on `shadcn-vue` controls.
- `src/views/route/components/RouteSummaryCards.vue`
  Purpose: route-page summary metrics wrapper using shared metric cards.
- `src/views/route/components/RouteCard.vue`
  Purpose: one route card with status, metadata, stats, and actions.
- `src/views/route/components/RouteCardList.vue`
  Purpose: route card grid and empty-state wrapper.
- `src/views/route/components/RouteEditorSheet.vue`
  Purpose: shadcn-styled create/edit shell while preserving existing route form logic.
- `src/views/route/__tests__/route-page-shadcn.test.ts`
  Purpose: verify the new route-page shell renders, filters render, and key actions stay visible.
- `src/views/flight/task/__tests__/page-shell.test.ts`
  Purpose: verify task page uses the shared shadcn shell without breaking its key toolbar and list entry points.
- `src/views/flight/record/__tests__/page-shell.test.ts`
  Purpose: verify record page uses the shared shadcn shell without breaking its list and detail entry points.

### Modified files

- `package.json`
  Purpose: add the dependencies required by `shadcn-vue` and Tailwind v4 if the init command does not already update them.
- `vite.config.ts`
  Purpose: register the Tailwind v4 Vite plugin alongside the existing Vue and UnoCSS plugins.
- `src/main.ts`
  Purpose: load the new global `shadcn` stylesheet without removing the existing app styles.
- `src/views/route/index.vue`
  Purpose: reduce the page to orchestration, wiring props and callbacks into the new shadcn-based subcomponents.
- `src/views/flight/task/index.vue`
  Purpose: replace the current Element-heavy top-level shell with shared shadcn page sections while preserving existing task logic.
- `src/views/flight/record/index.vue`
  Purpose: replace the current Element-heavy top-level shell with shared shadcn page sections while preserving existing record logic.
- `src/styles/common.scss`
  Purpose: stop being the source of truth for the rebuilt route page; only keep styles still needed by untouched pages during the migration.

### Existing files to read before editing

- `docs/superpowers/specs/2026-04-20-flight-module-shadcn-design.md`
- `src/views/route/index.vue`
- `src/views/flight/task/index.vue`
- `src/views/flight/record/index.vue`
- `src/views/route/components/RoutePlannerMap.vue`
- `src/views/route/components/RoutePlannerSidebar.vue`
- `src/test/setup.ts`
- `vitest.config.ts`

---

### Task 1: Add `shadcn-vue` Foundation To The Existing App

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/styles/shadcn.css`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `src/main.ts`
- Test: `src/views/route/__tests__/route-page-shadcn.test.ts`

- [ ] **Step 1: Write the failing route-shell smoke test**

Create `src/views/route/__tests__/route-page-shadcn.test.ts` with a first test that expects a future shadcn-style page header and main action to exist:

```ts
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import RoutePage from "@/views/route/index.vue";

describe("RoutePage shadcn shell", () => {
  it("renders the route page heading and primary action", async () => {
    render(RoutePage);

    expect(await screen.findByText("航线管理")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /新增航线/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails for the right reason**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- FAIL because the current page still depends on old global styling and the new shadcn shell components do not exist yet.

- [ ] **Step 3: Initialize `shadcn-vue` in the current project**

Use the official Vite flow from the current `shadcn-vue` docs:

- [Vite installation](https://www.shadcn-vue.com/docs/installation/vite)
- [CLI reference](https://www.shadcn-vue.com/docs/cli)

Run:

```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm dlx shadcn-vue@latest init
pnpm dlx shadcn-vue@latest add button card badge input select dialog sheet separator skeleton pagination
```

Then make sure the project ends up with:

- a `components.json` file rooted at the current app
- a `src/lib/utils.ts` file exporting `cn`
- a global CSS file for theme tokens, stored at `src/styles/shadcn.css`

If the CLI chooses a different global CSS file, normalize it back to `src/styles/shadcn.css` before moving on.

- [ ] **Step 4: Wire Tailwind and the new stylesheet into the app**

Apply the minimum implementation:

`vite.config.ts`

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    UnoCSS(),
  ],
});
```

`src/main.ts`

```ts
import "@/styles/shadcn.css";
```

`src/styles/shadcn.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.75rem;
}
```

- [ ] **Step 5: Re-run the route-shell smoke test and a production build**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
pnpm run build
```

Expected:

- The smoke test still fails only because the route page has not been migrated yet.
- The build succeeds with both UnoCSS and Tailwind enabled.

- [ ] **Step 6: Commit the foundation**

```bash
git add components.json package.json vite.config.ts src/main.ts src/lib/utils.ts src/styles/shadcn.css src/components/ui src/views/route/__tests__/route-page-shadcn.test.ts
git commit -m "feat: add shadcn vue foundation"
```

---

### Task 2: Create Shared Flight Page Shell Components

**Files:**
- Create: `src/components/flight/FlightPageHeader.vue`
- Create: `src/components/flight/FlightMetricCard.vue`
- Create: `src/components/flight/FlightEmptyState.vue`
- Test: `src/views/route/__tests__/route-page-shadcn.test.ts`

- [ ] **Step 1: Extend the route-page test to assert the shared shell contract**

Add expectations for:

- the eyebrow/description block being replaced by one shared header
- four metric cards being rendered
- the empty state action label when no data exists

```ts
expect(screen.getByText("Route Planning Hub")).toBeInTheDocument();
expect(screen.getAllByTestId("flight-metric-card")).toHaveLength(4);
```

- [ ] **Step 2: Run the route-page test again**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- FAIL because the new shared shell components do not exist yet.

- [ ] **Step 3: Implement the shared shell components**

Create `src/components/flight/FlightPageHeader.vue`:

```vue
<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div class="flex flex-col gap-2">
      <p v-if="eyebrow" class="text-sm font-medium text-muted-foreground">{{ eyebrow }}</p>
      <div class="space-y-1">
        <h1 class="text-3xl font-semibold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm text-muted-foreground">{{ description }}</p>
      </div>
    </div>
    <Button v-if="actionLabel" @click="emit('action')">{{ actionLabel }}</Button>
  </section>
</template>
```

Create `src/components/flight/FlightMetricCard.vue` with `Card` + `CardHeader` + `CardContent`, and expose a `data-testid="flight-metric-card"` on the card root.

Create `src/components/flight/FlightEmptyState.vue` using `Card`, `Button`, and muted text instead of legacy `ElEmpty`.

- [ ] **Step 4: Re-run the test to confirm the shared shell contract now passes**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- PASS for the header and metric-card expectations.

- [ ] **Step 5: Commit the shared flight shell**

```bash
git add src/components/flight/FlightPageHeader.vue src/components/flight/FlightMetricCard.vue src/components/flight/FlightEmptyState.vue src/views/route/__tests__/route-page-shadcn.test.ts
git commit -m "feat: add shared flight page shell components"
```

---

### Task 3: Migrate `航线管理` Header, Metrics, And Filters

**Files:**
- Create: `src/views/route/components/RouteSummaryCards.vue`
- Create: `src/views/route/components/RouteFilterBar.vue`
- Modify: `src/views/route/index.vue`
- Test: `src/views/route/__tests__/route-page-shadcn.test.ts`

- [ ] **Step 1: Add failing assertions for the new route filter layout**

Extend the route-page test so it checks:

- the page uses a shared `FlightPageHeader`
- the filter region renders a text box for `航线名称`
- the primary query button and reset button still exist

```ts
expect(screen.getByLabelText("航线名称")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "查询" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the route-page test to verify the filter assertions fail**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- FAIL because `RouteFilterBar.vue` and the new page composition are not wired yet.

- [ ] **Step 3: Replace the top-of-page composition in `src/views/route/index.vue`**

Create `RouteSummaryCards.vue` to map existing computed counts into four `FlightMetricCard` blocks.

Create `RouteFilterBar.vue` using:

- `Input`
- `Select`
- `Button`
- `Popover` or existing date-range input fallback only if needed

In `src/views/route/index.vue`, replace the current hero and legacy filter markup with:

```vue
<FlightPageHeader
  eyebrow="Route Planning Hub"
  title="航线管理"
  description="统一管理点状、面状与环状航线资产。"
  action-label="新增航线"
  @action="openCreateDialog"
/>

<RouteSummaryCards
  :total-count="totalCount"
  :point-route-count="pointRouteCount"
  :area-route-count="areaRouteCount"
  :loop-route-count="loopRouteCount"
/>

<RouteFilterBar
  v-model:filter-form="filterForm"
  :route-type-options="routeTypeOptions"
  @query="handleQuery"
  @reset="handleResetQuery"
/>
```

Keep the existing query logic and computed state in `index.vue`.

- [ ] **Step 4: Re-run the route-page test**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- PASS for header, metrics, and filter controls.

- [ ] **Step 5: Run a focused build check**

Run:

```bash
pnpm run build
```

Expected:

- PASS with the route page now using the new shell.

- [ ] **Step 6: Commit the route header and filter migration**

```bash
git add src/views/route/index.vue src/views/route/components/RouteSummaryCards.vue src/views/route/components/RouteFilterBar.vue src/views/route/__tests__/route-page-shadcn.test.ts
git commit -m "feat: migrate route page header and filters"
```

---

### Task 4: Migrate Route Cards And Empty State

**Files:**
- Create: `src/views/route/components/RouteCard.vue`
- Create: `src/views/route/components/RouteCardList.vue`
- Modify: `src/views/route/index.vue`
- Modify: `src/styles/common.scss`
- Test: `src/views/route/__tests__/route-page-shadcn.test.ts`

- [ ] **Step 1: Add a failing test for route cards**

Extend the route-page test to verify that:

- at least one route card renders route title text
- card actions `规划`, `编辑`, and `删除` are present
- the empty state renders when given an empty list

```ts
expect(screen.getByRole("button", { name: "规划" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the route-page test**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- FAIL because the new route card list components do not exist yet.

- [ ] **Step 3: Extract the card grid into dedicated components**

Create `RouteCard.vue` using:

- `Card`
- `Badge`
- `Button`
- `Separator`

Keep the existing route status helpers and card-stat helpers, but pass them into the card as props rather than duplicating logic.

Create `RouteCardList.vue` that receives:

- `routes`
- `has-active-filters`
- action handlers for preview/edit/delete

Use `FlightEmptyState` when `routes.length === 0`.

In `src/views/route/index.vue`, replace the current inline card-grid markup with:

```vue
<RouteCardList
  :routes="pagedRoutes"
  :has-active-filters="hasActiveFilters"
  :get-route-type-label="getRouteTypeLabel"
  :get-route-card-stats="getRouteCardStats"
  :get-route-usage-status="getRouteUsageStatus"
  @preview="openPreviewFromList"
  @edit="editRoute"
  @delete="handleDeleteRoute"
  @clear-filters="handleResetQuery"
/>
```

- [ ] **Step 4: Remove route-page-specific visual rules from `src/styles/common.scss` only after the new components render correctly**

Delete or neutralize the old selectors that are now replaced by component-local styling:

- `.command-page__hero`
- `.route-card-grid`
- `.route-card__*`

Do not remove shared selectors still used by untouched pages.

- [ ] **Step 5: Re-run the route-page test and the existing route playback test**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
pnpm vitest run src/views/route/__tests__/playback-entry.test.ts
```

Expected:

- PASS for both tests.

- [ ] **Step 6: Commit the route card migration**

```bash
git add src/views/route/index.vue src/views/route/components/RouteCard.vue src/views/route/components/RouteCardList.vue src/styles/common.scss src/views/route/__tests__/route-page-shadcn.test.ts
git commit -m "feat: migrate route cards to shadcn shell"
```

---

### Task 5: Wrap Route Create/Edit In A Shadcn Sheet

**Files:**
- Create: `src/views/route/components/RouteEditorSheet.vue`
- Modify: `src/views/route/index.vue`
- Modify: `src/views/route/components/RoutePlannerSidebar.vue`
- Test: `src/views/route/__tests__/route-page-shadcn.test.ts`

- [ ] **Step 1: Add a failing test for the route editor shell**

Add a test that opens the create flow and expects:

- a sheet/dialog title of `新增航线` or `编辑航线`
- visible cancel/save actions

```ts
await user.click(screen.getByRole("button", { name: "新增航线" }));
expect(await screen.findByText("新增航线")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the route-page test to confirm the editor-shell assertion fails**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- FAIL because the route editor is still wired to the old Element dialog shell.

- [ ] **Step 3: Build `RouteEditorSheet.vue` around existing form logic**

Use `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetFooter`, and keep the route editor internals alive by passing through:

- current form state
- save handler
- cancel handler
- route planner sidebar content

The goal is not to rewrite route drawing now. The goal is to move the shell from Element dialog markup to a shadcn sheet while preserving current planner behavior.

- [ ] **Step 4: Re-run the route-page test**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts
```

Expected:

- PASS with the new sheet shell.

- [ ] **Step 5: Run a full route-page safety check**

Run:

```bash
pnpm vitest run src/views/route/__tests__/route-page-shadcn.test.ts src/views/route/__tests__/playback-entry.test.ts
pnpm run build
```

Expected:

- PASS for tests and build.

- [ ] **Step 6: Commit the route editor shell migration**

```bash
git add src/views/route/index.vue src/views/route/components/RouteEditorSheet.vue src/views/route/components/RoutePlannerSidebar.vue src/views/route/__tests__/route-page-shadcn.test.ts
git commit -m "feat: migrate route editor shell to shadcn sheet"
```

---

### Task 6: Reuse The Shared Shell In `任务管理`

**Files:**
- Create: `src/views/flight/task/__tests__/page-shell.test.ts`
- Modify: `src/views/flight/task/index.vue`
- Modify: `src/styles/common.scss`

- [ ] **Step 1: Write a failing task-page shell test**

Create `src/views/flight/task/__tests__/page-shell.test.ts`:

```ts
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import TaskPage from "@/views/flight/task/index.vue";

describe("TaskPage shadcn shell", () => {
  it("renders the page title and create action", async () => {
    render(TaskPage);

    expect(await screen.findByText("任务管理")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /新增任务/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing task-page shell test**

Run:

```bash
pnpm vitest run src/views/flight/task/__tests__/page-shell.test.ts
```

Expected:

- FAIL because the page still uses the old Element-heavy shell.

- [ ] **Step 3: Replace only the top-level shell in `src/views/flight/task/index.vue`**

Reuse:

- `FlightPageHeader`
- `FlightMetricCard`
- `FlightEmptyState`

Keep:

- current task query logic
- current task table/list logic
- current create/edit/delete handlers

Do not rewrite task business rules in this task.

- [ ] **Step 4: Re-run the task-page shell test**

Run:

```bash
pnpm vitest run src/views/flight/task/__tests__/page-shell.test.ts
```

Expected:

- PASS.

- [ ] **Step 5: Commit the task-page shell migration**

```bash
git add src/views/flight/task/index.vue src/views/flight/task/__tests__/page-shell.test.ts src/styles/common.scss
git commit -m "feat: migrate task page shell to shadcn"
```

---

### Task 7: Reuse The Shared Shell In `飞行记录`

**Files:**
- Create: `src/views/flight/record/__tests__/page-shell.test.ts`
- Modify: `src/views/flight/record/index.vue`
- Modify: `src/styles/common.scss`

- [ ] **Step 1: Write a failing record-page shell test**

Create `src/views/flight/record/__tests__/page-shell.test.ts`:

```ts
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import RecordPage from "@/views/flight/record/index.vue";

describe("RecordPage shadcn shell", () => {
  it("renders the page title and the record summary", async () => {
    render(RecordPage);

    expect(await screen.findByText("飞行记录")).toBeInTheDocument();
    expect(screen.getByText(/共/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing record-page shell test**

Run:

```bash
pnpm vitest run src/views/flight/record/__tests__/page-shell.test.ts
```

Expected:

- FAIL because the page still uses the old Element-heavy shell.

- [ ] **Step 3: Replace only the top-level shell in `src/views/flight/record/index.vue`**

Reuse:

- `FlightPageHeader`
- `FlightMetricCard`
- `FlightEmptyState`

Keep:

- existing record query logic
- current table/list logic
- current detail/edit/delete/video handlers

Do not rewrite route playback or detail payload logic in this task.

- [ ] **Step 4: Re-run the record-page shell test**

Run:

```bash
pnpm vitest run src/views/flight/record/__tests__/page-shell.test.ts
```

Expected:

- PASS.

- [ ] **Step 5: Commit the record-page shell migration**

```bash
git add src/views/flight/record/index.vue src/views/flight/record/__tests__/page-shell.test.ts src/styles/common.scss
git commit -m "feat: migrate record page shell to shadcn"
```

---

### Task 8: Stabilize, Verify, And Document The New Flight Module Baseline

**Files:**
- Modify: `docs/superpowers/specs/2026-04-20-flight-module-shadcn-design.md`
- Modify: `docs/superpowers/plans/2026-04-20-flight-module-shadcn-migration.md`
- Modify: `README.md` (only if local setup instructions changed materially)

- [ ] **Step 1: Run the full targeted test suite**

Run:

```bash
pnpm vitest run \
  src/views/route/__tests__/route-page-shadcn.test.ts \
  src/views/route/__tests__/playback-entry.test.ts \
  src/views/flight/task/__tests__/page-shell.test.ts \
  src/views/flight/record/__tests__/page-shell.test.ts
```

Expected:

- PASS for all targeted flight-module migration tests.

- [ ] **Step 2: Run the production build**

Run:

```bash
pnpm run build
```

Expected:

- PASS.

- [ ] **Step 3: Run one manual visual smoke pass in the browser**

Check:

- `/route`
- `/flight/task`
- `/flight/record`

Verify:

- page header spacing
- metric cards
- filter alignment
- empty states
- create/edit shells

- [ ] **Step 4: Update docs only if the implementation changed setup or deferred scope**

If needed, append a short “implemented in phase 1” note to the spec or add a migration note to the README. Do not rewrite docs if the code already matches the plan.

- [ ] **Step 5: Commit the verification pass**

```bash
git add docs/superpowers/specs/2026-04-20-flight-module-shadcn-design.md docs/superpowers/plans/2026-04-20-flight-module-shadcn-migration.md README.md
git commit -m "chore: finalize flight module shadcn baseline"
```

