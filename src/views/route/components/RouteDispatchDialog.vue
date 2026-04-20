<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>下发航线</DialogTitle>
        <DialogDescription>确认后将生成当前航线的下发包并进入正式下发流程。</DialogDescription>
      </DialogHeader>

      <template v-if="routeDraft">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-lg border p-4">
            <div class="text-xs uppercase tracking-wide text-muted-foreground">航线名称</div>
            <div class="mt-2 text-base font-medium">{{ routeDraft.routeName || "-" }}</div>
          </div>
          <div class="rounded-lg border p-4">
            <div class="text-xs uppercase tracking-wide text-muted-foreground">航线类型</div>
            <div class="mt-2 text-base font-medium">{{ routeTypeLabel }}</div>
          </div>
          <div class="rounded-lg border p-4">
            <div class="text-xs uppercase tracking-wide text-muted-foreground">当前状态</div>
            <div class="mt-2">
              <Badge :variant="routeDraft.isPublished ? 'secondary' : 'outline'">
                {{ routeDraft.isPublished ? "已发布" : "待发布" }}
              </Badge>
            </div>
          </div>
        </div>

        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
          :class="
            canPublishRoute
              ? 'border-border bg-muted/20 text-foreground'
              : 'border-destructive/40 bg-destructive/5 text-destructive'
          "
        >
          <span>{{ dispatchStatusText }}</span>
          <Badge :variant="routeDraft.isPublished ? 'secondary' : 'outline'">
            {{ routeDraft.isPublished ? "已发布" : "待发布" }}
          </Badge>
        </div>

        <div class="mt-4 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          当前下发动作会直接调用正式业务接口获取 KMZ 下发包，旧的上传链路已移除。
        </div>
      </template>

      <FlightEmptyState
        v-else
        title="未找到航线"
        description="当前没有可用于下发的航线，请先返回详情页重新加载。"
      />

      <DialogFooter>
        <Button variant="outline" @click="handleClose">取消</Button>
        <Button :disabled="dispatching || !routeDraft" @click="handleConfirm">
          {{ dispatching ? "下发中..." : "确认下发" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouteType } from "@/api/flight/types";
import FlightEmptyState from "@/components/flight/FlightEmptyState.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RouteRecordModel } from "../types";

const props = defineProps<{
  open: boolean;
  routeDraft: RouteRecordModel | null;
  canPublishRoute: boolean;
  dispatchStatusText: string;
  dispatching: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
  confirm: [];
}>();

const routeTypeLabel = computed(() => {
  if (!props.routeDraft) return "-";
  switch (props.routeDraft.routeType) {
    case RouteType.AREA:
      return "面状航线";
    case RouteType.LOOP:
      return "环状航线";
    default:
      return "点状航线";
  }
});

function handleClose() {
  emit("close");
}

function handleConfirm() {
  emit("confirm");
}
</script>
