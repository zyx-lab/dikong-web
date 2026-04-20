<template>
  <Card data-testid="route-filter-bar" class="border-border/70 shadow-none">
    <CardContent class="pt-6">
      <div class="grid gap-4 xl:grid-cols-6">
        <div class="space-y-2 xl:col-span-2">
          <label class="text-sm font-medium text-foreground">航线名称</label>
          <Input
            v-model="filterForm.routeName"
            placeholder="请输入航线名称"
            @keyup.enter="emit('query')"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">航线类型</label>
          <Select v-model="routeTypeValue">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_ROUTE_TYPES">全部类型</SelectItem>
              <SelectItem
                v-for="option in routeTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">创建人</label>
          <Input
            v-model="filterForm.creatorName"
            placeholder="请输入创建人"
            @keyup.enter="emit('query')"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">创建时间</label>
          <el-date-picker
            v-model="filterForm.createdRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            class="w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">更新时间</label>
          <el-date-picker
            v-model="filterForm.updatedRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            class="w-full"
          />
        </div>

        <div class="flex items-end gap-3 xl:justify-end">
          <Button @click="emit('query')">查询</Button>
          <Button variant="outline" @click="emit('reset')">重置</Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RouteType } from "@/api/flight/types";
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
import type { RouteFilterForm } from "../types";

interface RouteTypeOption {
  value: RouteType;
  label: string;
}

const props = defineProps<{
  filterForm: RouteFilterForm;
  routeTypeOptions: readonly RouteTypeOption[];
}>();

const emit = defineEmits<{
  query: [];
  reset: [];
}>();

const ALL_ROUTE_TYPES = "__all__";

const routeTypeValue = computed({
  get: () => props.filterForm.routeType ?? ALL_ROUTE_TYPES,
  set: (value: string) => {
    props.filterForm.routeType = value === ALL_ROUTE_TYPES ? undefined : (value as RouteType);
  },
});
</script>
