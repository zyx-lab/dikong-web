<template>
  <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div class="flex flex-col gap-3">
      <Button variant="ghost" class="w-fit" @click="emit('back')">返回列表</Button>
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ record.recordNo }}</Badge>
          <Badge variant="secondary">{{ record.routeName }}</Badge>
          <Badge variant="outline">{{ record.locationLabel }}</Badge>
        </div>
        <h1 class="text-3xl font-semibold tracking-tight">{{ record.taskName }}</h1>
        <p class="max-w-3xl text-sm text-muted-foreground">
          {{ record.droneName }} · 飞手 {{ record.pilotName }} · 执行于 {{ record.executeTime }}
        </p>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <div class="rounded-lg border bg-card px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">飞行时长</div>
        <div class="mt-2 text-lg font-semibold">{{ record.flightDurationText }}</div>
      </div>
      <div class="rounded-lg border bg-card px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">告警核实</div>
        <div class="mt-2 text-lg font-semibold">
          {{ record.verifiedAlarmCount }}/{{ record.totalAlarmCount }}
        </div>
      </div>
      <div class="rounded-lg border bg-card px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">电池余量</div>
        <div class="mt-2 text-lg font-semibold">{{ record.batteryPercent }}%</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FlightRecordItem } from "@/views/flight/record/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

defineProps<{
  record: FlightRecordItem;
}>();

const emit = defineEmits<{
  back: [];
}>();
</script>
