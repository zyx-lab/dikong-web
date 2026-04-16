import type {
  AlertBroadcastPanelModel,
  DroneOnlinePanelModel,
  FlightClosurePanelModel,
  LowAltitudeSceneConfig,
  SceneMarker,
  SceneRouteLine,
  TaskSituationPanelModel,
} from "./types";

export const LOW_ALTITUDE_TASK_PANEL: TaskSituationPanelModel = {
  metrics: [
    { id: "today", label: "今日任务", value: 24, accent: "cyan" },
    { id: "running", label: "执行中", value: 8, accent: "green" },
    { id: "pending", label: "待执行", value: 11, accent: "amber" },
    { id: "focus", label: "需关注", value: 5, note: "需重点盯防", accent: "red" },
  ],
  statusRows: [
    { id: "pending", label: "待执行", value: 11, ratio: 1, accent: "cyan" },
    { id: "running", label: "执行中", value: 8, ratio: 0.72, accent: "green" },
    { id: "done", label: "已完成", value: 4, ratio: 0.38, accent: "amber" },
    { id: "abnormal", label: "异常", value: 1, ratio: 0.18, accent: "orange" },
  ],
  runningTasks: [
    {
      id: "task-1",
      taskName: "沿江岸线日常巡检",
      statusText: "执行中",
      statusTone: "green",
      droneName: "M30T-03",
      scheduleText: "开始 14:20",
    },
    {
      id: "task-2",
      taskName: "园区周界热成像巡查",
      statusText: "待执行",
      statusTone: "amber",
      droneName: "M300-01",
      scheduleText: "计划 15:10",
    },
    {
      id: "task-3",
      taskName: "码头仓区安全复核",
      statusText: "执行中",
      statusTone: "green",
      droneName: "M3E-02",
      scheduleText: "开始 15:02",
    },
  ],
};

export const LOW_ALTITUDE_DRONE_PANEL: DroneOnlinePanelModel = {
  metrics: [
    { id: "online", label: "在线无人机", value: 18, note: "在线接入", accent: "cyan" },
    { id: "duty", label: "当前值守无人机", value: 6, note: "正在值守", accent: "green" },
  ],
  dutyDrones: [
    { id: "drone-1", droneName: "M30T-03", statusText: "值守中", statusTone: "green" },
    { id: "drone-2", droneName: "M300-01", statusText: "巡检中", statusTone: "cyan" },
    { id: "drone-3", droneName: "应急测绘-01", statusText: "待命", statusTone: "amber" },
  ],
};

export const LOW_ALTITUDE_ALERT_PANEL: AlertBroadcastPanelModel = {
  pendingCount: 12,
  closureDone: 18,
  closureTotal: 27,
  closureRate: 0.66,
  events: [
    {
      id: "event-1",
      title: "通信信号波动告警",
      happenedAt: "2026-04-07 15:26",
      statusText: "处理中",
      statusTone: "cyan",
    },
    {
      id: "event-2",
      title: "热成像疑似高温点",
      happenedAt: "2026-04-07 15:18",
      statusText: "待核实",
      statusTone: "amber",
    },
    {
      id: "event-3",
      title: "返航前低电量预警",
      happenedAt: "2026-04-07 14:52",
      statusText: "已闭环",
      statusTone: "green",
    },
  ],
};

export const LOW_ALTITUDE_FLIGHT_PANEL: FlightClosurePanelModel = {
  metrics: [
    { id: "today", label: "今日架次", value: 16, accent: "cyan" },
    { id: "verify", label: "待核实架次", value: 4, accent: "red" },
    { id: "image", label: "图片回传", value: 236, accent: "green" },
    { id: "video", label: "视频回传", value: 22, accent: "amber" },
  ],
  abnormalFlights: [
    {
      id: "flight-1",
      taskName: "河道日常巡检",
      statusText: "待核实",
      statusTone: "amber",
      droneName: "M3E-03",
      alertCount: 23,
      executeTime: "09:30",
    },
    {
      id: "flight-2",
      taskName: "林区预警巡飞",
      statusText: "处理中",
      statusTone: "cyan",
      droneName: "M3M-01",
      alertCount: 21,
      executeTime: "09:31",
    },
    {
      id: "flight-3",
      taskName: "岸线复核飞行",
      statusText: "已闭环",
      statusTone: "green",
      droneName: "M30T-05",
      alertCount: 8,
      executeTime: "10:08",
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

export const LOW_ALTITUDE_SCENE_CONFIG: LowAltitudeSceneConfig = {
  splatUrl: "/model/JNUAerial-with_Park-y_up-lod.rad",
  backgroundColor: "#09131d",
  baseMapMode: "satellite",
  sceneOrigin: {
    longitude: 113.52958706944445,
    latitude: 22.252818819444443,
    altitudeMeters: 86.885,
  },
  homeView: {
    longitude: 113.528259,
    latitude: 22.234911,
    height: 1350,
    headingDeg: 360,
    pitchDeg: -40,
    rollDeg: 0,
  },
  splatPlacement: {
    anchorLng: 113.52964,
    anchorLat: 22.25333,
    heightOffsetMeters: 0,
    eastMeters: 20,
    northMeters: 70,
    upMeters: 0,
    headingDeg: 290,
    pitchDeg: 90,
    rollDeg: 220,
    scale: 65,
  },
  showCalibrationPanel: false,
};
