<template>
  <div class="app-container flex flex-col gap-6 py-6">
    <FlightPageHeader
      eyebrow="飞行控制"
      title="飞行控制台"
      description="查看实时画面、飞行状态和任务操作。"
    />

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <FlightMetricCard label="当前任务" :value="selectedMission.name" note="正在控制的任务对象" />
      <FlightMetricCard
        label="电池剩余"
        :value="`${selectedMission.battery}%`"
        note="低于 30% 需要重点关注"
      />
      <FlightMetricCard
        label="链路强度"
        :value="selectedMission.link"
        note="链路质量影响实时控制稳定性"
      />
      <FlightMetricCard
        label="累计飞行"
        :value="selectedMission.elapsed"
        note="当前任务已执行时长"
      />
    </section>

    <div class="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
      <Card class="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>无人机视频</CardTitle>
          <CardDescription>查看当前实时画面。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex aspect-video items-center justify-center rounded-xl border bg-muted/30">
            <div class="text-center">
              <div class="text-sm font-medium text-foreground">Live Feed</div>
              <div class="mt-2 text-sm text-muted-foreground">
                当前模拟视频流：{{ selectedMission.videoSource }}
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">任务 {{ selectedMission.status }}</Badge>
            <Badge variant="outline">无人机 {{ selectedMission.drone }}</Badge>
            <Badge variant="outline">飞手 {{ selectedMission.pilot }}</Badge>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-6">
        <Card class="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>无人机信息</CardTitle>
            <CardDescription>查看当前无人机状态。</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-3 text-sm">
            <div class="rounded-lg border p-3">型号：{{ selectedMission.drone }}</div>
            <div class="rounded-lg border p-3">飞手：{{ selectedMission.pilot }}</div>
            <div class="rounded-lg border p-3">海拔：{{ selectedMission.altitude }}</div>
            <div class="rounded-lg border p-3">速度：{{ selectedMission.speed }}</div>
          </CardContent>
        </Card>

        <Card class="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>任务操作</CardTitle>
            <CardDescription>执行当前任务操作。</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-3">
            <Button
              v-for="action in missionActions"
              :key="action"
              variant="outline"
              @click="lastAction = action"
            >
              {{ action }}
            </Button>
            <div class="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              最近操作：{{ lastAction || "暂无操作" }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card class="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>飞行轨迹</CardTitle>
          <CardDescription>查看当前飞行轨迹。</CardDescription>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 600 240" class="h-64 w-full rounded-xl border bg-muted/20 p-4">
            <polyline
              points="40,180 120,96 210,118 320,72 420,124 560,46"
              fill="none"
              stroke="currentColor"
              stroke-width="6"
              class="text-primary"
            />
            <circle cx="40" cy="180" r="7" class="fill-primary" />
            <circle cx="120" cy="96" r="7" class="fill-primary" />
            <circle cx="210" cy="118" r="7" class="fill-primary" />
            <circle cx="320" cy="72" r="7" class="fill-primary" />
            <circle cx="420" cy="124" r="7" class="fill-primary" />
            <circle cx="560" cy="46" r="9" class="fill-primary" />
          </svg>
        </CardContent>
      </Card>

      <Card class="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>事件时间线</CardTitle>
          <CardDescription>查看本次飞行事件。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="event in selectedMission.events"
            :key="event.time"
            class="rounded-lg border p-3"
          >
            <div class="text-sm font-medium text-foreground">{{ event.label }}</div>
            <div class="mt-1 text-xs text-muted-foreground">{{ event.time }}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import FlightPageHeader from "@/components/flight/FlightPageHeader.vue";
import FlightMetricCard from "@/components/flight/FlightMetricCard.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

defineOptions({ name: "FlightConsole" });

const missionActions = ["选择任务", "指点飞行", "继续任务", "暂停任务", "返航"];
const lastAction = ref("");

const selectedMission = {
  name: "北段河道巡检",
  drone: "Matrice 350 RTK",
  pilot: "张三",
  battery: 72,
  link: "稳定",
  elapsed: "18 分钟",
  altitude: "126 m",
  speed: "12 m/s",
  status: "执行中",
  videoSource: "主摄像头 / 1080P",
  events: [
    { time: "10:12:03", label: "任务开始，自动起飞完成" },
    { time: "10:18:20", label: "进入重点河段，启用高清录像" },
    { time: "10:24:44", label: "完成异常点复查，继续巡检" },
  ],
};
</script>
