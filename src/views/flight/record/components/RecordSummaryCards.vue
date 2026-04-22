<template>
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <FlightMetricCard label="飞行记录" :value="totalCount" note="当前筛选范围内的架次总数" />
    <FlightMetricCard label="待核实架次" :value="pendingRecordCount" note="待人工确认的飞行" />
    <FlightMetricCard label="待核实告警" :value="pendingAlarmCount" note="待处理预警" />
    <FlightMetricCard label="媒体资产" :value="mediaAssetCount" note="图像和视频数量" />
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
