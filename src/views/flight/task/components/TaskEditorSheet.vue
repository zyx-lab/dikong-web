<template>
  <Sheet v-model:open="openModel">
    <SheetContent side="right" class="w-full sm:max-w-2xl">
      <SheetHeader class="space-y-2">
        <SheetTitle>{{ title }}</SheetTitle>
        <SheetDescription>统一维护任务与航线、人员、执行时间的基础关联信息。</SheetDescription>
      </SheetHeader>

      <div class="grid gap-5 px-4 py-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">任务名称</label>
          <Input v-model="formData.name" placeholder="请输入任务名称" />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">任务航线</label>
            <Select v-model="routeModel">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择航线" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">暂不指定</SelectItem>
                <SelectItem v-for="item in routeOptions" :key="item.id" :value="String(item.id)">
                  {{ item.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">执行无人机</label>
            <Select v-model="droneModel">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择无人机" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">暂不指定</SelectItem>
                <SelectItem v-for="item in droneOptions" :key="item.id" :value="String(item.id)">
                  {{ item.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">执行飞手</label>
            <Select v-model="pilotModel">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择执行飞手" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">暂不指定</SelectItem>
                <SelectItem
                  v-for="item in pilotOptions"
                  :key="item.memberId"
                  :value="String(item.memberId)"
                >
                  {{ item.displayName }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">计划时间</label>
            <el-date-picker
              v-model="formData.scheduledAt"
              type="datetime"
              placeholder="选择计划执行时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="w-full"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">任务备注</label>
          <Textarea v-model="formData.remark" placeholder="请输入备注信息" class="min-h-24" />
        </div>
      </div>

      <SheetFooter class="sm:justify-end">
        <Button variant="outline" @click="handleClose">取消</Button>
        <Button :disabled="submitLoading" @click="handleSubmit">
          {{ submitLoading ? "保存中..." : "保存" }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import type { AcceptableValue } from "reka-ui";
import { computed } from "vue";
import type { MemberOption, RouteOption, TaskForm } from "@/api/flight/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const props = defineProps<{
  open: boolean;
  title: string;
  formData: TaskForm;
  routeOptions: RouteOption[];
  droneOptions: { id: number; name: string }[];
  pilotOptions: MemberOption[];
  submitLoading: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
  submit: [];
}>();

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

function createNumberModel<Key extends "routeId" | "droneId" | "pilotId">(key: Key) {
  return computed({
    get: () => (props.formData[key] === undefined ? "__none__" : String(props.formData[key])),
    set: (value: AcceptableValue) => {
      if (!value || value === "__none__") {
        props.formData[key] = undefined;
        return;
      }

      props.formData[key] = Number(value);
    },
  });
}

const routeModel = createNumberModel("routeId");
const droneModel = createNumberModel("droneId");
const pilotModel = createNumberModel("pilotId");

function handleClose() {
  emit("close");
}

function handleSubmit() {
  emit("submit");
}
</script>
