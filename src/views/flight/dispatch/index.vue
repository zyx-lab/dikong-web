<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="Quick Dispatch"
      title="一键调飞"
      description="将可用无人机、待执行航线和调飞指令集中到一页里，值守人员可以快速完成资源匹配和任务下发。"
    />

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <FlightMetricCard
        label="可用无人机"
        :value="filteredDrones.length"
        note="当前筛选条件下可调度资源"
      />
      <FlightMetricCard
        label="待执行航线"
        :value="filteredRoutes.length"
        note="已就绪但尚未派发的航线"
      />
      <FlightMetricCard
        label="已选资源"
        :value="selectedSummaryCount"
        note="当前调飞单已完成匹配"
      />
      <FlightMetricCard
        label="今日指令"
        :value="dispatchLogs.length"
        note="最近一次调度指令会记录在时间线中"
      />
    </section>

    <Card class="border-border/70 shadow-none">
      <CardContent class="pt-6">
        <div class="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">资源检索</label>
            <Input v-model="keyword" placeholder="请输入机场名称 / 无人机名称 / 组织部门" />
          </div>

          <div class="flex items-end gap-3 lg:justify-end">
            <Button variant="outline" @click="resetSelection">重置选择</Button>
            <Button :disabled="!canDispatch" @click="dispatchNow">立即调飞</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-6 xl:grid-cols-[1.15fr_1.15fr_0.9fr]">
      <Card class="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>可用无人机</CardTitle>
          <CardDescription>选择一架空闲无人机作为本次任务载体。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Button
            v-for="drone in filteredDrones"
            :key="drone.id"
            variant="outline"
            class="h-auto w-full justify-start px-4 py-4 text-left"
            @click="selectedDroneId = drone.id"
          >
            <div class="flex w-full items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="text-sm font-semibold text-foreground">{{ drone.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ drone.airport }} · {{ drone.department }}
                </div>
                <div class="text-xs text-muted-foreground">
                  电量 {{ drone.battery }}% · {{ drone.model }}
                </div>
              </div>
              <Badge :variant="selectedDroneId === drone.id ? 'default' : 'outline'">
                {{ selectedDroneId === drone.id ? "已选择" : drone.status }}
              </Badge>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card class="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>待执行航线</CardTitle>
          <CardDescription>挑选一个待执行航线，系统会自动生成调飞建议。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Button
            v-for="route in filteredRoutes"
            :key="route.id"
            variant="outline"
            class="h-auto w-full justify-start px-4 py-4 text-left"
            @click="selectedRouteId = route.id"
          >
            <div class="flex w-full items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="text-sm font-semibold text-foreground">{{ route.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ route.airport }} · {{ route.type }} · 预计 {{ route.duration }}
                </div>
                <div class="text-xs text-muted-foreground">窗口 {{ route.window }}</div>
              </div>
              <Badge :variant="selectedRouteId === route.id ? 'default' : 'outline'">
                {{ selectedRouteId === route.id ? "已选择" : route.priority }}
              </Badge>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card class="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>调飞指令</CardTitle>
          <CardDescription>确认资源匹配后，直接下发调飞命令。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="rounded-lg border bg-muted/20 p-4">
            <div class="text-xs uppercase tracking-wide text-muted-foreground">当前选择</div>
            <div class="mt-3 space-y-2 text-sm">
              <div>无人机：{{ selectedDrone?.name || "未选择" }}</div>
              <div>航线：{{ selectedRoute?.name || "未选择" }}</div>
              <div>机场：{{ selectedRoute?.airport || selectedDrone?.airport || "—" }}</div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">指令备注</label>
            <Textarea v-model="dispatchNote" class="min-h-28" />
          </div>

          <Separator />

          <div class="space-y-3">
            <div class="text-sm font-medium text-foreground">最近调度记录</div>
            <div v-if="dispatchLogs.length === 0" class="text-sm text-muted-foreground">
              还没有下发过调飞指令。
            </div>
            <div v-for="log in dispatchLogs" :key="log.id" class="rounded-lg border p-3">
              <div class="text-sm font-medium text-foreground">{{ log.title }}</div>
              <div class="mt-1 text-xs text-muted-foreground">{{ log.time }}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import FlightMetricCard from "@/components/flight/FlightMetricCard.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

defineOptions({ name: "FlightDispatch" });

const drones = [
  {
    id: 1,
    name: "Matrice 350 RTK",
    airport: "北区机场",
    department: "巡检一队",
    battery: 86,
    model: "双光吊舱",
    status: "可调度",
  },
  {
    id: 2,
    name: "Mavic 3T",
    airport: "东区机场",
    department: "应急二队",
    battery: 74,
    model: "热成像",
    status: "可调度",
  },
  {
    id: 3,
    name: "Matrice 30",
    airport: "南区机场",
    department: "巡检三队",
    battery: 68,
    model: "云台相机",
    status: "待命",
  },
];

const routes = [
  {
    id: 11,
    name: "北段河道巡检",
    airport: "北区机场",
    type: "点状航线",
    duration: "18 分钟",
    window: "09:30 - 11:00",
    priority: "高优先级",
  },
  {
    id: 12,
    name: "南区围界复核",
    airport: "南区机场",
    type: "面状航线",
    duration: "24 分钟",
    window: "10:00 - 12:00",
    priority: "普通",
  },
  {
    id: 13,
    name: "厂区环拍复查",
    airport: "东区机场",
    type: "环状航线",
    duration: "12 分钟",
    window: "13:00 - 14:00",
    priority: "重点",
  },
];

const keyword = ref("");
const selectedDroneId = ref<number>();
const selectedRouteId = ref<number>();
const dispatchLogs = ref<{ id: number; title: string; time: string }[]>([]);

const filteredDrones = computed(() =>
  drones.filter((item) =>
    [item.name, item.airport, item.department].some((field) =>
      field.toLowerCase().includes(keyword.value.trim().toLowerCase())
    )
  )
);

const filteredRoutes = computed(() =>
  routes.filter((item) =>
    [item.name, item.airport, item.type].some((field) =>
      field.toLowerCase().includes(keyword.value.trim().toLowerCase())
    )
  )
);

const selectedDrone = computed(() => drones.find((item) => item.id === selectedDroneId.value));
const selectedRoute = computed(() => routes.find((item) => item.id === selectedRouteId.value));
const selectedSummaryCount = computed(
  () => Number(Boolean(selectedDrone.value)) + Number(Boolean(selectedRoute.value))
);
const canDispatch = computed(() => Boolean(selectedDrone.value && selectedRoute.value));

const dispatchNote = computed({
  get: () => {
    if (!selectedDrone.value || !selectedRoute.value) {
      return "请选择一架无人机和一条待执行航线，系统将自动生成调飞建议。";
    }

    return `建议由 ${selectedDrone.value.name} 执行 ${selectedRoute.value.name}，起降机场为 ${selectedRoute.value.airport}，预计耗时 ${selectedRoute.value.duration}。`;
  },
  set: () => {},
});

function resetSelection() {
  selectedDroneId.value = undefined;
  selectedRouteId.value = undefined;
}

function dispatchNow() {
  if (!selectedDrone.value || !selectedRoute.value) return;

  dispatchLogs.value.unshift({
    id: Date.now(),
    title: `${selectedDrone.value.name} 已绑定 ${selectedRoute.value.name}`,
    time: new Date().toLocaleString("zh-CN"),
  });
}
</script>
