<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>任务详情</DialogTitle>
        <DialogDescription>查看任务与航线、执行人员、时间和备注等关键信息。</DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">加载中...</div>

      <div v-else-if="data" class="grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">任务名称</div>
          <div class="mt-2 text-base font-medium">{{ data.name }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">任务状态</div>
          <div class="mt-2 text-base font-medium">{{ formatStatus(data.status) }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">任务航线</div>
          <div class="mt-2 text-base font-medium">{{ data.routeName || "-" }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">执行无人机</div>
          <div class="mt-2 text-base font-medium">{{ data.droneName || "-" }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">执行飞手</div>
          <div class="mt-2 text-base font-medium">{{ data.pilotName || "-" }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">计划时间</div>
          <div class="mt-2 text-base font-medium">{{ formatTime(data.scheduledAt) }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">创建时间</div>
          <div class="mt-2 text-base font-medium">{{ formatTime(data.createdAt) }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">更新时间</div>
          <div class="mt-2 text-base font-medium">{{ formatTime(data.updatedAt) }}</div>
        </div>
        <div class="rounded-lg border p-4 md:col-span-2">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">备注</div>
          <div class="mt-2 text-base font-medium">{{ data.remark || "-" }}</div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('close')">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { TaskVO } from "@/api/flight/task";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

defineProps<{
  open: boolean;
  loading: boolean;
  data: TaskVO | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

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
</script>
