<template>
  <div data-testid="task-data-table" class="space-y-4">
    <div class="overflow-x-auto rounded-2xl border border-border/70">
      <Table class="min-w-[1500px]">
        <TableHeader>
          <TableRow>
            <TableHead class="w-10">
              <Checkbox :model-value="allSelected" @update:model-value="toggleAll" />
            </TableHead>
            <TableHead class="w-16">ID</TableHead>
            <TableHead>任务名称</TableHead>
            <TableHead>任务航线</TableHead>
            <TableHead>执行无人机</TableHead>
            <TableHead>计划执行时间</TableHead>
            <TableHead>任务状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead>开始时间</TableHead>
            <TableHead>结束时间</TableHead>
            <TableHead>备注</TableHead>
            <TableHead class="min-w-72 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="rows.length > 0">
            <TableRow v-for="row in rows" :key="row.id">
              <TableCell>
                <Checkbox
                  :model-value="selectedIds.includes(row.id)"
                  @update:model-value="toggleOne(row.id, $event)"
                />
              </TableCell>
              <TableCell>{{ row.id }}</TableCell>
              <TableCell class="max-w-44 truncate">{{ row.name }}</TableCell>
              <TableCell class="max-w-44 truncate">{{ row.routeName || "-" }}</TableCell>
              <TableCell class="max-w-40 truncate">{{ row.droneName || "-" }}</TableCell>
              <TableCell>{{ formatTime(row.scheduledAt) }}</TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(row.status)">
                  {{ formatStatus(row.status) }}
                </Badge>
              </TableCell>
              <TableCell>{{ formatTime(row.createdAt) }}</TableCell>
              <TableCell>{{ formatTime(row.updatedAt) }}</TableCell>
              <TableCell>{{ formatTime(row.startedAt) }}</TableCell>
              <TableCell>{{ formatTime(row.finishedAt) }}</TableCell>
              <TableCell class="max-w-40 truncate">{{ row.remark || "-" }}</TableCell>
              <TableCell>
                <div class="flex flex-wrap justify-end gap-2">
                  <Button variant="ghost" size="sm" @click="emit('detail', row)">详情</Button>
                  <Button variant="ghost" size="sm" @click="emit('edit', row)">编辑</Button>
                  <Button variant="ghost" size="sm" @click="emit('delete', row.id)">删除</Button>
                  <Button variant="ghost" size="sm" @click="emit('advance', row)">推进任务</Button>
                  <Button variant="ghost" size="sm" @click="emit('live', row)">直播画面</Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <TableEmpty v-else :colspan="13">
            <FlightEmptyState
              title="暂无任务"
              :description="
                hasActiveFilters
                  ? '当前筛选条件下暂无任务，请调整筛选条件后重试。'
                  : '任务数据还没有准备好，可以先创建一个新任务。'
              "
              :action-label="hasActiveFilters ? '清空筛选' : undefined"
              @action="emit('clearFilters')"
            />
          </TableEmpty>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TaskVO } from "@/api/flight/task";
import FlightEmptyState from "@/components/flight/FlightEmptyState.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const props = defineProps<{
  rows: TaskVO[];
  selectedIds: number[];
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  "update:selectedIds": [ids: number[]];
  detail: [row: TaskVO];
  edit: [row: TaskVO];
  delete: [id: number];
  advance: [row: TaskVO];
  live: [row: TaskVO];
  clearFilters: [];
}>();

const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((row) => props.selectedIds.includes(row.id))
);

function formatTime(value: string | undefined | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatStatus(status: number | undefined): string {
  return ["待执行", "执行中", "执行完成", "飞行中"][status ?? -1] ?? "-";
}

function getStatusVariant(status: number | undefined) {
  if (status === 1) return "secondary";
  if (status === 2) return "outline";
  if (status === 3) return "default";
  return "outline";
}

function toggleAll(checked: boolean | string) {
  emit("update:selectedIds", checked ? props.rows.map((row) => row.id) : []);
}

function toggleOne(id: number, checked: boolean | string) {
  const next = new Set(props.selectedIds);
  if (checked) next.add(id);
  else next.delete(id);
  emit("update:selectedIds", [...next]);
}
</script>
