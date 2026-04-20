<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>飞行记录详情</DialogTitle>
        <DialogDescription>查看架次、航线、设备和执行结果等复盘关键信息。</DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">加载中...</div>

      <div v-else-if="data" class="grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">飞行记录编号</div>
          <div class="mt-2 text-base font-medium">{{ data.flightNo }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">任务名称</div>
          <div class="mt-2 text-base font-medium">{{ data.missionName }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">航线名称</div>
          <div class="mt-2 text-base font-medium">{{ data.routeName }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">执行机场</div>
          <div class="mt-2 text-base font-medium">{{ data.airportName }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">无人机名称</div>
          <div class="mt-2 text-base font-medium">{{ data.droneName }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">设备序列号</div>
          <div class="mt-2 text-base font-medium">{{ data.deviceSn }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">飞手姓名</div>
          <div class="mt-2 text-base font-medium">{{ data.pilotName }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">飞行时长</div>
          <div class="mt-2 text-base font-medium">{{ formatDuration(data.flightDuration) }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">开始时间</div>
          <div class="mt-2 text-base font-medium">{{ formatTime(data.startTime) }}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-xs uppercase tracking-wide text-muted-foreground">结束时间</div>
          <div class="mt-2 text-base font-medium">{{ formatTime(data.endTime) }}</div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('close')">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { FlightRecordInfo } from "@/api/flight/types";
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
  data: FlightRecordInfo | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

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
</script>
