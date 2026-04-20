<template>
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <FlightMetricCard label="航线总量" :value="totalCount" note="当前筛选条件下的航线资产规模" />
    <FlightMetricCard label="点状航线" :value="pointRouteCount" note="适合单点巡检与离散目标采集" />
    <FlightMetricCard
      label="面状航线"
      :value="areaRouteCount"
      note="适合测绘建模与大范围巡护任务"
    />
    <FlightMetricCard label="环状航线" :value="loopRouteCount" note="适合环拍展示与重点目标观察" />
  </section>
</template>

<script setup lang="ts">
import FlightMetricCard from "@/components/flight/FlightMetricCard.vue";

defineProps<{
  totalCount: number;
  pointRouteCount: number;
  areaRouteCount: number;
  loopRouteCount: number;
}>();
</script>
