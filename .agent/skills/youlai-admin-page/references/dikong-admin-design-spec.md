# Dikong Admin Design Spec

This reference captures the actual admin-page conventions in `E:\高栏港\dikong\fronted` by combining:

- `组件设计规范.md`
- `src/views/flight/task/index.vue`
- `src/views/system/user/index.vue`
- `src/styles/common.scss`
- `src/styles/element-plus.scss`
- `src/styles/variables.scss`

Use this file when the task is to build a new backend management page, refactor one to match the project, or explain the current admin-page design rules.

## Scope And Priority

The repo has two overlapping style signals:

1. A dark-tech visual spec from `组件设计规范.md`
2. A Youlai-style admin CRUD implementation in the actual Vue pages

For backend management pages, prioritize the live CRUD implementation over the broad dark-tech document. The document is still useful for theme vocabulary and dark-mode token choices, but it does not override the current admin layout rhythm.

That means:

- Reuse existing admin page structure before introducing visual decoration.
- Prefer theme variables and Element Plus tokens over hard-coded deep-blue styling in page files.
- Only use dark-tech dialog decoration, dark table colors, and deep-blue surfaces through the project's theme layer or an existing page pattern.

## 1. Page Skeleton Spec

### Standard CRUD Page

Use this order by default:

1. `div.app-container`
2. `div.filter-section`
3. `el-card.table-section`
4. `.table-section__toolbar`
5. `el-table.table-section__content`
6. `pagination`
7. create or edit `el-dialog` or `el-drawer`

This is the default rhythm shown by `src/views/flight/task/index.vue`.

### Optional Split Layout

When the page contains a tree filter, department pane, or another master-detail side area, use:

1. `div.app-container`
2. `el-row` with `:gutter="20"`
3. left `el-col` for the tree or side filter
4. right `el-col` for the standard CRUD shell

This is the user-management variant shown by `src/views/system/user/index.vue`.

### Container Spacing

Global spacing comes from `src/styles/common.scss`:

- `.app-container` uses `padding: 15px`
- major blocks keep a compact admin rhythm instead of large decorative spacing
- vertical spacing is typically `8px` to `12px` between search, toolbar, table, and pagination areas

### Theme Rule

- Do not hand-write cockpit-style backgrounds or gradients inside admin page components.
- Use the existing CSS variables from `src/styles/variables.scss`.
- If dark mode is active, the theme layer already provides deep-blue backgrounds, borders, and shadows.

## 2. Table And Search Area Spec

### Search Area

Use `div.filter-section` for the search block.

Current shared style from `src/styles/common.scss`:

- `padding: 8px 12px 0`
- `margin-bottom: 8px`
- `background-color: var(--el-bg-color-overlay)`
- `border: 1px solid var(--el-border-color-light)`
- `border-radius: 4px`

Inside the search area:

- Use `el-form` with `:inline="true"` unless the closest sibling page proves a different pattern.
- Keep form items compact with the shared `8px` bottom spacing.
- Put the action buttons in a trailing `el-form-item.search-buttons`.
- Keep button order as `查询/搜索` first, `重置` second.
- Use plain, task-oriented placeholders such as `请输入任务名称`, `请选择航线`, `用户名/昵称/手机号`.

When the page needs a range filter or tree filter:

- keep the extra filter in the same search block if it is a normal field
- move it to a left-side panel only when an existing page already uses the split layout

### Table Container

Use `el-card.table-section` as the standard table wrapper.

Shared table-area rules from `src/styles/common.scss`:

- `.table-section` has `margin-bottom: 12px`
- `.table-section__toolbar` uses horizontal flex layout with `justify-content: space-between`
- action groups use `gap: 4px`
- `.table-section__content` uses `margin: 8px 0`
- pagination is right-aligned with `margin-top: 12px`

### Toolbar Rules

Left side:

- primary action such as `新增` or `新增任务`
- destructive bulk action such as `删除` or `批量删除`

Right side:

- data summary, such as total count
- import or export tools
- other auxiliary actions only if the sibling page already has them

Do not scatter toolbar actions across multiple unrelated regions.

### Table Rules

Default CRUD table settings:

- `border`
- `highlight-current-row`
- selection column when bulk actions exist
- `show-overflow-tooltip` on long text columns
- fixed right-side operation column when there are row actions

Use `stripe` only when the chosen reference page already uses it. The user-management page does; the task-management page currently does not.

Column rules:

- prefer `min-width` for flexible business columns
- use fixed widths for status, selection, time, and operation columns
- keep operation column width stable and wide enough for the expected action count
- align status and operation columns to center when the reference page does so

Pagination rules:

- always use the project's existing `pagination` component
- bind `page` and `limit` to `queryParams.pageNum` and `queryParams.pageSize`
- wire the `@pagination` event to the list fetch function

## 3. Dialog And Drawer Spec

### How To Choose

Use `el-dialog` when:

- the form is a standard CRUD editor
- the fields fit comfortably in a medium-width modal
- the page follows the task-management pattern

Use `el-drawer` when:

- the form is longer or more account-oriented
- the page needs a responsive side panel
- the page follows the user-management pattern

Do not switch dialog and drawer casually. Match the closest completed page.

### Dialog Rules

From `src/views/flight/task/index.vue` and `src/styles/element-plus.scss`:

- task-style CRUD dialog width is `600px`
- header padding is `15px 20px`
- body padding is `20px`
- footer padding is `15px`
- header and footer use a shared border based on `var(--el-border-color-light)`

For form dialogs in this project:

- prefer `label-width="100px"` for medium CRUD forms
- use `custom-class="dialog-form-decorated"` only when the page follows the decorated dialog pattern
- in dark mode, `dialog-form-decorated` adds a primary-color vertical accent line in the header

### Drawer Rules

From `src/views/system/user/index.vue` and `src/styles/element-plus.scss`:

- use a computed width when the existing page is responsive
- desktop width can be `600px`
- mobile width can fall back to `90%`
- keep the same header, body, and footer padding rhythm as dialogs

### Footer Rules

Use `div.dialog-footer` for bottom actions.

Shared footer style:

- `display: flex`
- `gap: 8px`
- `justify-content: flex-end`

Button order:

- `取消` on the left
- `确定` or the primary submit action on the right

Do not invent centered or left-aligned footer actions for standard CRUD forms.

## 4. Button, Form, And Status Tag Spec

### Buttons

Follow the current admin meaning before the broad visual document.

Primary toolbar buttons:

- use `type="primary"` for the main create action in standard CRUD pages
- user-management may use `type="success"` for `新增` because that page already does so; reuse the local pattern instead of normalizing everything globally

Destructive buttons:

- use `type="danger"` for delete or bulk delete
- disable the bulk delete button when nothing is selected

Table operation buttons:

- use `link`
- use `size="small"`
- keep edit as primary-colored text action
- keep delete as danger-colored text action
- place common read actions such as `详情` or `飞行记录` before edit and delete when the reference page does so

Search buttons:

- keep the first button as the main action
- keep reset as the neutral secondary action
- do not add extra emphasis styles beyond the shared theme

### Forms

Label and layout:

- use `label-width="100px"` for medium dialog forms
- use `label-width="80px"` for compact drawer forms when the sibling page already does so
- keep field ordering aligned with the business flow already used by the closest reference page

Field width:

- use full-width controls inside dialogs and drawers for `select`, `tree-select`, and date pickers
- use helper class `w-full` or the existing local full-width pattern instead of new ad hoc widths
- reserve inline fixed widths mainly for search-area selects

Validation:

- required fields use `blur` for text inputs and `change` for selects
- message copy follows direct task language such as `请输入任务名称`, `请选择所属部门`
- clear validation state when opening a fresh form

Behavior:

- `queryParams`, `formData`, `dialogState`, `rules`, and refs such as `queryFormRef` or `dataFormRef` are the preferred naming pattern
- on create or edit, reset form state before populating data
- on close, reset fields and validation state

### Status Tags

Prefer `el-tag` or existing dictionary helpers rather than custom badge markup.

Task-style status mapping:

- pending or waiting uses `info`
- in progress uses `primary`
- paused uses `warning`
- completed uses `success`
- failed uses `danger`

Account-style status mapping:

- enabled or normal uses `success`
- disabled uses `info`

When the status comes from a platform dictionary:

- prefer `DictTag`
- prefer `DictSelect` for the corresponding editable form field

### Switches And Dict Controls

Use `el-switch` for binary account status when the reference page already uses it.

Use `DictTag` and `DictSelect` when:

- the project already has a dictionary code
- the field is a reusable enum rather than a one-off status

Do not replace dictionary-based fields with hand-written tag text unless no dictionary helper exists.

## Practical Guardrails For Future Page Generation

When generating a new page in this repo:

1. Copy the nearest completed page first.
2. Preserve `app-container`, `filter-section`, `table-section`, `dialog-footer`, and the existing toolbar grouping.
3. Reuse the exact search, table, and form rhythm before changing business content.
4. Treat dark-tech styling as a theme layer, not a page-layout license.
5. Avoid large inline styles and avoid writing new one-off component shells when the shared classes already solve the layout.
