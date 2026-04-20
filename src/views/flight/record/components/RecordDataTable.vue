<template>
  <div data-testid="record-data-table" class="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-10">
            <Checkbox :model-value="allSelected" @update:model-value="toggleAll" />
          </TableHead>
          <TableHead class="w-16">ID</TableHead>
          <TableHead>飞行记录编号</TableHead>
          <TableHead>任务名称</TableHead>
          <TableHead>航线名称</TableHead>
          <TableHead>无人机名称</TableHead>
          <TableHead>设备序列号</TableHead>
          <TableHead>飞手姓名</TableHead>
          <TableHead>开始时间</TableHead>
          <TableHead>结束时间</TableHead>
          <TableHead>飞行时长</TableHead>
          <TableHead>照片数量</TableHead>
          <TableHead>视频数量</TableHead>
          <TableHead class="min-w-56 text-right">操作</TableHead>
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
            <TableCell class="max-w-40 truncate">{{ row.flightNo }}</TableCell>
            <TableCell class="max-w-44 truncate">{{ row.missionName }}</TableCell>
            <TableCell class="max-w-40 truncate">{{ row.routeName }}</TableCell>
            <TableCell class="max-w-40 truncate">{{ row.droneName }}</TableCell>
            <TableCell class="max-w-44 truncate">{{ row.deviceSn }}</TableCell>
            <TableCell>{{ row.pilotName }}</TableCell>
            <TableCell>{{ formatTime(row.startTime) }}</TableCell>
            <TableCell>{{ formatTime(row.endTime) }}</TableCell>
            <TableCell>{{ formatDuration(row.flightDuration) }}</TableCell>
            <TableCell>{{ row.photoCount }}</TableCell>
            <TableCell>{{ row.videoCount }}</TableCell>
            <TableCell>
              <div class="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" @click="emit('detail', row)">详情</Button>
                <Button variant="ghost" size="sm" @click="emit('edit', row)">编辑</Button>
                <Button variant="ghost" size="sm" @click="emit('delete', row.id)">删除</Button>
                <Button variant="ghost" size="sm" @click="emit('video', row)">视频回放</Button>
              </div>
            </TableCell>
          </TableRow>
        </template>
        <TableEmpty v-else :colspan="14">
          <FlightEmptyState
            title="暂无飞行记录"
            :description="
              hasActiveFilters
                ? '当前筛选条件下暂无飞行记录，请调整筛选条件后重试。'
                : '飞行记录还没有同步完成，稍后再来查看。'
            "
            :action-label="hasActiveFilters ? '清空筛选' : undefined"
            @action="emit('clearFilters')"
          />
        </TableEmpty>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FlightRecordInfo } from "@/api/flight/types";
import FlightEmptyState from "@/components/flight/FlightEmptyState.vue";
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
  rows: FlightRecordInfo[];
  selectedIds: number[];
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  "update:selectedIds": [ids: number[]];
  detail: [row: FlightRecordInfo];
  edit: [row: FlightRecordInfo];
  delete: [id: number];
  video: [row: FlightRecordInfo];
  clearFilters: [];
}>();

const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((row) => props.selectedIds.includes(row.id))
);

function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
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
