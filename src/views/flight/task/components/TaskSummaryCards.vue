<template>
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <FlightMetricCard label="任务总量" :value="totalCount" note="当前筛选条件下的任务池规模" />
    <FlightMetricCard label="执行中" :value="activeTaskCount" note="当前执行中的任务" />
    <FlightMetricCard label="已完成" :value="completedTaskCount" note="已完成任务" />
    <FlightMetricCard label="需关注" :value="attentionTaskCount" note="暂停或失败任务" />
  </section>
</template>

<script setup lang="ts">
import FlightMetricCard from "@/components/flight/FlightMetricCard.vue";

defineProps<{
  totalCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  attentionTaskCount: number;
}>();
</script>
