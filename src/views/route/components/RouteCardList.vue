<template>
  <section v-if="routes.length > 0" class="grid gap-4 xl:grid-cols-2">
    <RouteCard
      v-for="route in routes"
      :key="route.id"
      :route="route"
      :route-type-label="getRouteTypeLabel(route.routeType)"
      :route-stats="getRouteCardStats(route)"
      :usage-status="getRouteUsageStatus(route)"
      @preview="emit('preview', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </section>

  <FlightEmptyState
    v-else
    title="暂无航线"
    :description="
      hasActiveFilters
        ? '当前筛选条件下暂无航线，请调整筛选条件后重试。'
        : '航线数据还没有准备好，先创建一条新的航线。'
    "
    :action-label="hasActiveFilters ? '清空筛选' : undefined"
    @action="emit('clearFilters')"
  />
</template>

<script setup lang="ts">
import FlightEmptyState from "@/components/flight/FlightEmptyState.vue";
import type { RouteRecordModel } from "../types";
import RouteCard from "./RouteCard.vue";

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
  routes: RouteRecordModel[];
  hasActiveFilters: boolean;
  getRouteTypeLabel: (routeType: RouteRecordModel["routeType"]) => string;
  getRouteCardStats: (route: RouteRecordModel) => RouteStatItem[];
  getRouteUsageStatus: (route: RouteRecordModel) => RouteUsageStatus;
}>();

const emit = defineEmits<{
  preview: [route: RouteRecordModel];
  edit: [route: RouteRecordModel];
  delete: [route: RouteRecordModel];
  clearFilters: [];
}>();
</script>
