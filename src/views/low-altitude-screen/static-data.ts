import type {
  AlertBroadcastPanelModel,
  DroneOnlinePanelModel,
  SceneMarker,
  SceneRouteLine,
  TaskSituationPanelModel,
} from "./types";

export const LOW_ALTITUDE_TASK_PANEL: TaskSituationPanelModel = {
  summary: {
    todayCount: 128,
    executingCount: 82,
  },
  rows: [
    {
      id: "task-1",
      taskName: "港区东侧岸线巡查",
      statusLabel: "执行中",
      routeName: "东侧岸线主航线 A-03",
      startTime: "09:15",
    },
    {
      id: "task-2",
      taskName: "危化区外场巡检",
      statusLabel: "重点关注",
      routeName: "危化区巡检环线 B-02",
      startTime: "09:42",
    },
    {
      id: "task-3",
      taskName: "园区围界协同飞巡",
      statusLabel: "按计划",
      routeName: "园区外围巡检线 C-05",
      startTime: "10:03",
    },
    {
      id: "task-4",
      taskName: "西岸水域协同巡查",
      statusLabel: "执行中",
      routeName: "西岸水域巡查 D-01",
      startTime: "10:16",
    },
  ],
};

export const LOW_ALTITUDE_DRONE_PANEL: DroneOnlinePanelModel = {
  summary: {
    onlineCount: 46,
    dispatchableCount: 39,
    standbyCount: 7,
  },
  rows: [
    {
      id: "drone-1",
      droneName: "M30T-03",
      currentLabel: "港区东侧岸线巡查",
      statusLabel: "执行中",
    },
    {
      id: "drone-2",
      droneName: "M300-01",
      currentLabel: "危化区外场巡检",
      statusLabel: "重点关注",
    },
    {
      id: "drone-3",
      droneName: "M350-02",
      currentLabel: "综合待命机位",
      statusLabel: "待命",
    },
  ],
};

export const LOW_ALTITUDE_ALERT_PANEL: AlertBroadcastPanelModel = {
  summary: {
    totalCount: 7,
    highLevelCount: 2,
    trackingCount: 5,
  },
  rows: [
    {
      id: "alert-1",
      title: "危化区热异常告警",
      levelLabel: "高",
      happenedAt: "10:26",
    },
    {
      id: "alert-2",
      title: "航线偏移预警",
      levelLabel: "中",
      happenedAt: "09:52",
    },
    {
      id: "alert-3",
      title: "重点区域围界触发",
      levelLabel: "低",
      happenedAt: "08:41",
    },
  ],
};

export const LOW_ALTITUDE_SCENE_ROUTES: SceneRouteLine[] = [
  {
    id: "route-a-03",
    label: "东侧岸线主航线 A-03",
    points: [
      { x: 0.08, y: 0.72 },
      { x: 0.28, y: 0.42 },
      { x: 0.62, y: 0.28 },
      { x: 0.92, y: 0.64 },
    ],
  },
];

export const LOW_ALTITUDE_SCENE_MARKERS: SceneMarker[] = [
  { id: "drone-1", kind: "drone", x: 0.24, y: 0.36, tone: "success", label: "M30T-03" },
  { id: "drone-2", kind: "drone", x: 0.4, y: 0.48, tone: "success", label: "M300-01" },
  { id: "pilot-1", kind: "pilot", x: 0.56, y: 0.62, tone: "primary", label: "张工" },
  { id: "alert-1", kind: "alert", x: 0.76, y: 0.58, tone: "danger", label: "危化区热异常告警" },
];
