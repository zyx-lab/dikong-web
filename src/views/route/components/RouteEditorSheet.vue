<template>
  <Sheet v-model:open="openModel">
    <SheetContent side="right" class="w-full sm:max-w-xl">
      <SheetHeader class="space-y-2">
        <SheetTitle>新增航线</SheetTitle>
        <SheetDescription>先填写基础信息，保存后再进入更完整的航线规划流程。</SheetDescription>
      </SheetHeader>

      <div class="grid gap-5 py-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">航线名称</label>
          <Input v-model="formData.routeName" placeholder="请输入航线名称" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">航线类型</label>
          <Select v-model="routeTypeModel">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择航线类型" />
            </SelectTrigger>
            <SelectContent>
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
      </div>

      <SheetFooter class="sm:justify-end">
        <Button variant="outline" @click="handleClose">取消</Button>
        <Button @click="handleSave">保存</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RouteType } from "@/api/flight/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CreateRouteForm } from "../types";

interface RouteTypeOption {
  value: RouteType;
  label: string;
  description?: string;
}

const props = defineProps<{
  open: boolean;
  formData: CreateRouteForm;
  routeTypeOptions: readonly RouteTypeOption[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
  save: [];
}>();

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const routeTypeModel = computed({
  get: () => props.formData.routeType,
  set: (value: string) => {
    props.formData.routeType = value as RouteType;
  },
});

function handleClose() {
  emit("close");
}

function handleSave() {
  emit("save");
}
</script>
