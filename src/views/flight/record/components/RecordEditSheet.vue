<template>
  <Sheet v-model:open="openModel">
    <SheetContent side="right" class="w-full sm:max-w-2xl">
      <SheetHeader class="space-y-2">
        <SheetTitle>编辑飞行记录</SheetTitle>
        <SheetDescription>维护飞行记录的基础展示字段，保证复盘信息准确可追踪。</SheetDescription>
      </SheetHeader>

      <div class="grid gap-5 px-4 py-6">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">任务名称</label>
            <Input v-model="formData.missionName" placeholder="请输入任务名称" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">航线名称</label>
            <Input v-model="formData.routeName" placeholder="请输入航线名称" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">执行机场</label>
            <Input v-model="formData.airportName" placeholder="请输入执行机场" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">无人机名称</label>
            <Input v-model="formData.droneName" placeholder="请输入无人机名称" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">飞手姓名</label>
            <Input v-model="formData.pilotName" placeholder="请输入飞手姓名" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">飞行时长（秒）</label>
            <Input v-model="formData.flightDuration" type="number" min="0" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">照片数量</label>
            <Input v-model="formData.photoCount" type="number" min="0" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">视频数量</label>
            <Input v-model="formData.videoCount" type="number" min="0" />
          </div>
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
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  formData: {
    id: number;
    missionName: string;
    routeName: string;
    airportName: string;
    droneName: string;
    pilotName: string;
    flightDuration: number;
    photoCount: number;
    videoCount: number;
  };
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

function handleClose() {
  emit("close");
}

function handleSubmit() {
  emit("submit");
}
</script>
