<template>
  <Card data-testid="record-filter-bar" class="border-border/70 shadow-none">
    <CardContent class="pt-6">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">架次编号</label>
          <Input
            v-model="queryParams.flightNo"
            placeholder="请输入架次编号"
            @keyup.enter="emit('query')"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">无人机</label>
          <Select :model-value="getDroneValue()" @update:model-value="setDroneValue">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_DRONE">全部</SelectItem>
              <SelectItem
                v-for="option in droneOptions"
                :key="option.id"
                :value="String(option.id)"
              >
                {{ option.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">飞手</label>
          <Select :model-value="getPilotValue()" @update:model-value="setPilotValue">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_PILOT">全部</SelectItem>
              <SelectItem
                v-for="option in pilotOptions"
                :key="option.memberId"
                :value="String(option.memberId)"
              >
                {{ option.displayName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">飞行状态</label>
          <Select :model-value="getStatusValue()" @update:model-value="setStatusValue">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_STATUS">全部</SelectItem>
              <SelectItem value="0">飞行中</SelectItem>
              <SelectItem value="1">已完成</SelectItem>
              <SelectItem value="2">异常终止</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-end gap-3 md:col-span-2 xl:col-span-1 xl:justify-end">
          <Button @click="emit('query')">查询</Button>
          <Button variant="outline" @click="emit('reset')">重置</Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { AcceptableValue } from "reka-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlightRecordQuery } from "@/api/flight/types";
import type { MemberOption } from "@/api/flight/task";

const props = defineProps<{
  queryParams: FlightRecordQuery;
  droneOptions: Array<{ id: number; name: string }>;
  pilotOptions: MemberOption[];
}>();

const emit = defineEmits<{
  query: [];
  reset: [];
}>();

const ALL_STATUS = "__all__";
const ALL_DRONE = "__all_drone__";
const ALL_PILOT = "__all_pilot__";

function getDroneValue() {
  return props.queryParams.droneId === undefined ? ALL_DRONE : String(props.queryParams.droneId);
}

function setDroneValue(value: AcceptableValue) {
  if (!value || value === ALL_DRONE) {
    props.queryParams.droneId = undefined;
    return;
  }
  props.queryParams.droneId = Number(value);
}

function getPilotValue() {
  return props.queryParams.pilotId === undefined ? ALL_PILOT : String(props.queryParams.pilotId);
}

function setPilotValue(value: AcceptableValue) {
  if (!value || value === ALL_PILOT) {
    props.queryParams.pilotId = undefined;
    return;
  }
  props.queryParams.pilotId = Number(value);
}

function getStatusValue() {
  return props.queryParams.status === undefined ? ALL_STATUS : String(props.queryParams.status);
}

function setStatusValue(value: AcceptableValue) {
  if (!value) {
    props.queryParams.status = undefined;
    return;
  }
  props.queryParams.status = value === ALL_STATUS ? undefined : Number(value);
}
</script>
