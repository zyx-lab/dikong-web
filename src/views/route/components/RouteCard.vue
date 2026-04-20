<template>
  <Card class="overflow-hidden border-border/70 shadow-none">
    <div class="border-b bg-muted/30 px-6 py-4">
      <svg viewBox="0 0 220 124" class="h-28 w-full">
        <g v-if="route.routeType === 'point'">
          <polyline
            points="18,92 56,50 98,66 140,34 182,48 202,74"
            class="fill-none stroke-primary stroke-[6]"
          />
          <circle cx="18" cy="92" r="5" class="fill-primary" />
          <circle cx="56" cy="50" r="5" class="fill-primary" />
          <circle cx="98" cy="66" r="5" class="fill-primary" />
          <circle cx="140" cy="34" r="5" class="fill-primary" />
          <circle cx="182" cy="48" r="5" class="fill-primary" />
          <circle cx="202" cy="74" r="5" class="fill-primary" />
        </g>
        <g v-else-if="route.routeType === 'area'">
          <polygon
            points="34,28 182,24 194,92 44,98"
            class="fill-primary/10 stroke-primary stroke-[4]"
          />
          <line x1="56" y1="36" x2="170" y2="34" class="stroke-primary/60 stroke-[3]" />
          <line x1="54" y1="54" x2="176" y2="52" class="stroke-primary/60 stroke-[3]" />
          <line x1="50" y1="72" x2="182" y2="70" class="stroke-primary/60 stroke-[3]" />
          <line x1="46" y1="88" x2="188" y2="86" class="stroke-primary/60 stroke-[3]" />
        </g>
        <g v-else>
          <circle cx="110" cy="62" r="38" class="fill-none stroke-primary stroke-[6]" />
          <circle cx="110" cy="62" r="6" class="fill-primary" />
          <circle cx="148" cy="62" r="5" class="fill-primary" />
        </g>
      </svg>
    </div>

    <CardHeader class="gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <CardTitle class="text-xl">{{ route.routeName }}</CardTitle>
          <p class="text-sm text-muted-foreground">{{ route.description }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="getStatusVariant(usageStatus.state)">
            {{ usageStatus.label }}
          </Badge>
          <Badge variant="outline">
            {{ routeTypeLabel }}
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        <div>机型：{{ route.droneModel }}</div>
        <div>创建人：{{ route.creatorName || "-" }}</div>
        <div>创建时间：{{ route.createdAt }}</div>
        <div>更新时间：{{ route.updatedAt }}</div>
      </div>

      <div class="rounded-lg border bg-muted/20 px-4 py-3">
        <div class="text-sm font-medium">当前状态</div>
        <p class="mt-1 text-sm text-muted-foreground">{{ usageStatus.hint }}</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in routeStats"
          :key="item.label"
          class="rounded-lg border bg-background px-4 py-3"
        >
          <div class="text-xs uppercase tracking-wide text-muted-foreground">
            {{ item.label }}
          </div>
          <div class="mt-2 text-lg font-semibold">
            {{ item.value }}
          </div>
        </div>
      </div>
    </CardContent>

    <CardFooter class="justify-end gap-2 border-t bg-muted/10">
      <Button variant="ghost" size="sm" @click="emit('preview', route)">规划</Button>
      <Button variant="ghost" size="sm" :disabled="usageStatus.locked" @click="emit('edit', route)">
        编辑
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :disabled="usageStatus.locked"
        @click="emit('delete', route)"
      >
        删除
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { RouteRecordModel } from "../types";

interface RouteStatItem {
  label: string;
  value: string | number;
}

interface RouteUsageStatus {
  state: "idle" | "occupied" | "executing";
  label: string;
  hint: string;
  locked: boolean;
}

defineProps<{
  route: RouteRecordModel;
  routeTypeLabel: string;
  routeStats: RouteStatItem[];
  usageStatus: RouteUsageStatus;
}>();

const emit = defineEmits<{
  preview: [route: RouteRecordModel];
  edit: [route: RouteRecordModel];
  delete: [route: RouteRecordModel];
}>();

function getStatusVariant(status: RouteUsageStatus["state"]) {
  if (status === "executing") return "destructive";
  if (status === "occupied") return "outline";
  return "secondary";
}
</script>
