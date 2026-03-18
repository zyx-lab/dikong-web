---
name: youlai-admin-page
description: Use when building, updating, or documenting Vue 3 + Element Plus + Youlai-style admin pages and the user wants the result to stay visually and structurally consistent with the existing backend project. Prioritize cloning the closest existing management page, preserving the project's layout, class names, toolbar structure, dialog patterns, component conventions, and validation workflow instead of inventing a fresh UI.
---

# Youlai Admin Page

Use this skill when the user asks for a new backend management page, a CRUD screen, or a refactor that should match an existing Youlai-style admin project.

## Goal

Keep AI-generated admin pages consistent with the current project. The default behavior is reuse, not redesign.

## Read This Reference When Needed

- If the user asks for the current project's admin design rules, component styling conventions, or page skeleton guidance, read `references/dikong-admin-design-spec.md`.
- If the current repo is `C:\Users\Admin\Desktop\Web\dikong-web`, read `references/dikong-admin-design-spec.md` before generating a new CRUD page unless the request is too small to need it.

## Workflow

1. Find the active repo root and read any in-scope `AGENTS.md`.
2. If design consistency matters, load the skill reference file for the active repo before editing.
3. Identify the closest fully implemented page in the same module.
4. If no close sibling exists, fall back to a proven project-wide template page.
5. Copy the page structure first, then replace business fields, API calls, enums, labels, and permission codes.
6. Preserve the original layout, spacing style, button order, table rhythm, and dialog style unless the user explicitly asks to change them.
7. Validate with the repo's existing commands after editing.

## Hard Rules

- Do not invent a new page layout when an existing management page can be reused.
- Do not introduce a new visual language, custom color system, or unusual card composition unless the repo already uses it.
- Do not mix multiple interaction patterns in one page.
- Do not replace project utility components with raw Element Plus widgets unless the repo does not have a local abstraction.
- Do not add large inline style blocks when the target pattern already has reusable classes.
- Do not optimize for novelty; optimize for sameness with the surrounding pages.

## Page Pattern Priority

Choose references in this order:

1. The closest completed page in the same feature module.
2. A project-wide CRUD list page with the same search-table-dialog rhythm.
3. A project-wide account-management page when the page includes status switches, permissions, reset-password flows, import/export, or tree filtering.

When working in `C:\Users\Admin\Desktop\Web\dikong-web`, use these defaults unless a closer sibling exists:

- Primary CRUD shell: `src/views/flight/task/index.vue`
- Secondary account-style reference: `src/views/system/user/index.vue`

## Structure To Preserve

For standard admin list pages, keep this structure unless an existing sibling page proves otherwise:

1. `app-container`
2. Search area with `filter-section`
3. Card-wrapped table area with `table-section`
4. Toolbar with left-side primary actions and right-side secondary info or tools
5. `el-table`
6. `pagination`
7. Create/edit dialog or drawer

For search forms:

- Keep query fields inline when the reference page uses an inline form.
- Keep the action buttons at the end of the form.
- Preserve the project's usual wording and order, typically `查询/搜索` first and `重置` second.
- Reuse the same placeholder tone as nearby pages.

For toolbars:

- Keep primary create actions on the left.
- Keep destructive bulk actions near the create action, not separated to a distant area.
- Keep import/export or auxiliary tools in the right-side tools area when the reference page does that.

For tables:

- Reuse border, stripe, highlight, selection column, row key, and overflow behavior from the reference page.
- Match nearby pages for operation-column width, button order, and link-style action buttons.
- Prefer existing enum tags, `DictTag`, `DictSelect`, switches, and local helper components over custom render logic.

For create/edit containers:

- Use the same container type as the closest reference page: dialog stays dialog, drawer stays drawer.
- Preserve footer button order used by the reference page.
- Keep label width and field grouping aligned with the copied pattern.

## Coding Style Rules

- Keep `script setup` with TypeScript if the surrounding page uses it.
- Reuse nearby imports, composables, enums, helper functions, and API typing conventions.
- Follow existing naming patterns for `queryParams`, `tableData` or `xxxList`, `dialogState`, `formData`, `rules`, and handler functions such as `handleQuery`, `handleResetQuery`, `handleCreateClick`, `handleEditClick`, `handleDelete`, `handleSubmit`, and `closeDialog`.
- Prefer adapting an existing method set over inventing a new controller style.
- Keep comments sparse and only where they help explain a non-obvious block.

## Repo-Specific Guidance For `dikong`

When the current repo is `C:\Users\Admin\Desktop\Web\dikong-web`:

- Start by comparing the target page against `src/views/flight/task/index.vue`.
- If the page behaves like user, account, or permission management, also inspect `src/views/system/user/index.vue`.
- Use `references/dikong-admin-design-spec.md` as the source of truth for page skeleton, search area, table area, dialog or drawer, button, form, and status-tag conventions.
- Prefer the repo's existing `pagination` component and management-page class names such as `filter-section`, `table-section`, and `table-section__toolbar`.
- Keep Element Plus usage aligned with nearby files instead of introducing a different abstraction style.
- Treat `组件设计规范.md` and dark-theme variables as theme guidance, not as permission to redesign CRUD pages into a large-screen cockpit style.
- Run validation in this order when possible:
  1. `pnpm type-check`
  2. `pnpm exec prettier --write <changed files>`
  3. `pnpm exec eslint <changed files>`

## Response Behavior

When using this skill, explicitly say which existing page is being used as the template and why.

Before coding, summarize the reuse decision in one short line:

- "Using `src/views/flight/task/index.vue` as the base CRUD shell."
- "Using `src/views/system/user/index.vue` as the account-style interaction reference."

## Done Criteria

The work is only done when all of these are true:

- The new page looks like it belongs next to existing pages in the repo.
- The page uses the same structural rhythm as its chosen reference.
- The code reuses project patterns instead of introducing a parallel style.
- Validation has been run, or any skipped validation is clearly disclosed.
