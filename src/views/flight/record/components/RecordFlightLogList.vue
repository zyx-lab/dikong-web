<template>
  <div class="max-h-[360px] overflow-auto">
    <div class="flight-log-list">
      <div v-for="item in logs" :key="item.id" class="flight-log-list__item">
        <span class="flight-log-list__time" :class="`is-${item.level}`">
          {{ item.time }}
        </span>
        <span class="flight-log-list__content">{{ item.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlightLogItem } from "@/views/flight/record/data";

defineProps<{
  logs: FlightLogItem[];
}>();
</script>
