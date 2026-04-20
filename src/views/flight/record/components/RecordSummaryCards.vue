<template>
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <FlightMetricCard label="飞行记录" :value="totalCount" note="当前筛选范围内的架次总数" />
    <FlightMetricCard
      label="待核实架次"
      :value="pendingRecordCount"
      note="仍需人工确认的异常飞行"
    />
    <FlightMetricCard label="待核实告警" :value="pendingAlarmCount" note="需要尽快闭环的告警事件" />
    <FlightMetricCard label="媒体资产" :value="mediaAssetCount" note="图像与视频证据同步沉淀" />
  </section>
</template>

<script setup lang="ts">
import FlightMetricCard from "@/components/flight/FlightMetricCard.vue";

defineProps<{
  totalCount: number;
  pendingRecordCount: number;
  pendingAlarmCount: number;
  mediaAssetCount: number;
}>();
</script>
