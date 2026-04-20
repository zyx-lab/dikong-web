<template>
  <Card data-testid="task-filter-bar" class="border-border/70 shadow-none">
    <CardContent class="pt-6">
      <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">任务名称</label>
          <Input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            @keyup.enter="emit('query')"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">执行状态</label>
          <Select :model-value="getStatusValue()" @update:model-value="setStatusValue">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_STATUS">全部</SelectItem>
              <SelectItem value="0">待执行</SelectItem>
              <SelectItem value="1">执行中</SelectItem>
              <SelectItem value="2">执行完成</SelectItem>
              <SelectItem value="3">飞行中</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-end gap-3 md:col-span-1 xl:col-span-2 xl:justify-end">
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
import type { TaskPageQuery } from "@/api/flight/task";

const props = defineProps<{
  queryParams: TaskPageQuery;
}>();

const emit = defineEmits<{
  query: [];
  reset: [];
}>();

const ALL_STATUS = "__all__";

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
