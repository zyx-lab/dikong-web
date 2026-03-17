export enum AlarmVerifyStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
}

export interface FlightTelemetryPoint {
  time: number;
  altitude: number;
  speed: number;
}

export interface FlightLogItem {
  id: number;
  time: string;
  level: "danger" | "warning" | "info";
  content: string;
}

export interface FlightRecordItem {
  id: number;
  recordNo: string;
  taskName: string;
  routeName: string;
  airportName: string;
  droneName: string;
  pilotName: string;
  flightDurationText: string;
  durationSeconds: number;
  alarmCount: number;
  imageCount: number;
  videoCount: number;
  executeTime: string;
  executeDate: string;
  verifiedAlarmCount: number;
  totalAlarmCount: number;
  alarmVerifyStatus: AlarmVerifyStatus;
  batteryPercent: number;
  locationLabel: string;
  mapTheme: string;
  telemetry: FlightTelemetryPoint[];
  flightLogs: FlightLogItem[];
}

export function buildFlightRecordData(): FlightRecordItem[] {
  return [
    {
      id: 1,
      recordNo: "YJ202511163281",
      taskName: "前山河汛前岸线勘察",
      routeName: "珠海岸线巡查航线",
      airportName: "市应急基地主舱",
      droneName: "应急测绘-01 (CW-15)",
      pilotName: "诸葛亮",
      flightDurationText: "3分21秒",
      durationSeconds: 201,
      alarmCount: 2,
      imageCount: 23,
      videoCount: 1,
      executeTime: "2025-11-14 08:43:35",
      executeDate: "2025-11-14",
      verifiedAlarmCount: 2,
      totalAlarmCount: 2,
      alarmVerifyStatus: AlarmVerifyStatus.COMPLETED,
      batteryPercent: 90,
      locationLabel: "前山河西岸巡线段",
      mapTheme:
        "linear-gradient(135deg, rgba(28, 51, 88, 0.95), rgba(18, 36, 63, 0.92)), radial-gradient(circle at 30% 30%, rgba(44, 182, 255, 0.2), transparent 35%)",
      telemetry: [
        { time: 0, altitude: 0, speed: 0 },
        { time: 20, altitude: 120, speed: 4 },
        { time: 40, altitude: 265, speed: 12 },
        { time: 60, altitude: 265, speed: 19 },
        { time: 80, altitude: 265, speed: 25 },
        { time: 100, altitude: 265, speed: 28 },
        { time: 120, altitude: 265, speed: 24 },
        { time: 140, altitude: 145, speed: 7 },
        { time: 160, altitude: 265, speed: 21 },
        { time: 180, altitude: 265, speed: 23 },
        { time: 201, altitude: 0, speed: 0 },
      ],
      flightLogs: [
        {
          id: 1,
          time: "10:20:31",
          level: "danger",
          content: "电机异常，任务已中止，正在执行紧急返航",
        },
        {
          id: 2,
          time: "10:18:05",
          level: "warning",
          content: "注意：通信信号波动，已自动切换至备用链路",
        },
        {
          id: 3,
          time: "10:15:23",
          level: "info",
          content: "任务执行中，已飞行 12 公里，电量剩余 65%",
        },
        {
          id: 4,
          time: "10:12:06",
          level: "info",
          content: "飞行姿态稳定，航线偏差控制在 0.6 米范围内",
        },
        {
          id: 5,
          time: "10:09:44",
          level: "info",
          content: "进入岸线巡查航段，开始采集可见光与倾斜影像",
        },
      ],
    },
    {
      id: 2,
      recordNo: "SW202511163221",
      taskName: "秦淮河河道日常巡检",
      routeName: "秦淮河东段航线",
      airportName: "城西河道机巢-A1",
      droneName: "河道巡检-03 (M3E)",
      pilotName: "诸葛亮",
      flightDurationText: "5分18秒",
      durationSeconds: 318,
      alarmCount: 23,
      imageCount: 0,
      videoCount: 1,
      executeTime: "2025-11-14 09:30:55",
      executeDate: "2025-11-14",
      verifiedAlarmCount: 2,
      totalAlarmCount: 23,
      alarmVerifyStatus: AlarmVerifyStatus.PENDING,
      batteryPercent: 76,
      locationLabel: "秦淮河东段河道走廊",
      mapTheme:
        "linear-gradient(140deg, rgba(24, 41, 75, 0.96), rgba(10, 25, 49, 0.92)), radial-gradient(circle at 70% 35%, rgba(18, 148, 217, 0.22), transparent 40%)",
      telemetry: [
        { time: 0, altitude: 0, speed: 0 },
        { time: 30, altitude: 110, speed: 5 },
        { time: 60, altitude: 180, speed: 11 },
        { time: 90, altitude: 220, speed: 15 },
        { time: 120, altitude: 190, speed: 21 },
        { time: 160, altitude: 210, speed: 23 },
        { time: 200, altitude: 160, speed: 18 },
        { time: 240, altitude: 235, speed: 24 },
        { time: 280, altitude: 150, speed: 10 },
        { time: 318, altitude: 0, speed: 0 },
      ],
      flightLogs: [
        {
          id: 1,
          time: "09:42:11",
          level: "warning",
          content: "检测到 23 条待核实告警，已同步至巡检中心",
        },
        { id: 2, time: "09:38:16", level: "info", content: "完成东段桥梁下方低空补拍" },
        {
          id: 3,
          time: "09:34:28",
          level: "info",
          content: "河道巡检模型推理正常，视频流持续回传中",
        },
      ],
    },
    {
      id: 3,
      recordNo: "XF202511163233",
      taskName: "紫金山林火预警巡飞",
      routeName: "紫金山核心区航线",
      airportName: "南山森林公园巢",
      droneName: "林业巡查-01 (M3M)",
      pilotName: "司马懿",
      flightDurationText: "56秒",
      durationSeconds: 56,
      alarmCount: 21,
      imageCount: 0,
      videoCount: 1,
      executeTime: "2025-11-14 09:30:55",
      executeDate: "2025-11-14",
      verifiedAlarmCount: 6,
      totalAlarmCount: 21,
      alarmVerifyStatus: AlarmVerifyStatus.PENDING,
      batteryPercent: 82,
      locationLabel: "紫金山核心林区",
      mapTheme:
        "linear-gradient(135deg, rgba(20, 47, 54, 0.96), rgba(13, 32, 48, 0.9)), radial-gradient(circle at 25% 20%, rgba(49, 222, 170, 0.18), transparent 34%)",
      telemetry: [
        { time: 0, altitude: 0, speed: 0 },
        { time: 10, altitude: 90, speed: 6 },
        { time: 20, altitude: 180, speed: 13 },
        { time: 30, altitude: 210, speed: 16 },
        { time: 40, altitude: 150, speed: 11 },
        { time: 56, altitude: 0, speed: 0 },
      ],
      flightLogs: [
        { id: 1, time: "09:31:32", level: "warning", content: "热成像疑似高温点 3 处，待人工核实" },
        { id: 2, time: "09:31:05", level: "info", content: "起飞完成，进入林区预警扫描模式" },
      ],
    },
    {
      id: 4,
      recordNo: "JT202511163281",
      taskName: "绕城高速交通巡查",
      routeName: "-",
      airportName: "未指定（单兵）",
      droneName: "珠海交警-01 (M30)",
      pilotName: "诸葛亮",
      flightDurationText: "5分18秒",
      durationSeconds: 318,
      alarmCount: 2,
      imageCount: 33,
      videoCount: 1,
      executeTime: "2025-11-14 08:43:40",
      executeDate: "2025-11-14",
      verifiedAlarmCount: 2,
      totalAlarmCount: 2,
      alarmVerifyStatus: AlarmVerifyStatus.COMPLETED,
      batteryPercent: 88,
      locationLabel: "绕城高速南段",
      mapTheme:
        "linear-gradient(140deg, rgba(31, 44, 73, 0.95), rgba(14, 27, 53, 0.92)), radial-gradient(circle at 60% 25%, rgba(77, 155, 255, 0.18), transparent 34%)",
      telemetry: [
        { time: 0, altitude: 0, speed: 0 },
        { time: 50, altitude: 220, speed: 10 },
        { time: 100, altitude: 260, speed: 18 },
        { time: 160, altitude: 260, speed: 22 },
        { time: 220, altitude: 210, speed: 17 },
        { time: 280, altitude: 260, speed: 24 },
        { time: 318, altitude: 0, speed: 0 },
      ],
      flightLogs: [
        {
          id: 1,
          time: "08:51:26",
          level: "info",
          content: "发现拥堵缓行路段，已自动标注并生成快照",
        },
        { id: 2, time: "08:48:13", level: "info", content: "高速路面巡查持续进行中，视频链路稳定" },
      ],
    },
    {
      id: 5,
      recordNo: "JT202511163280",
      taskName: "奥体中心活动保障",
      routeName: "-",
      airportName: "未指定（单兵）",
      droneName: "演示测试机 (Air 2S)",
      pilotName: "司马懿",
      flightDurationText: "5分18秒",
      durationSeconds: 318,
      alarmCount: 2,
      imageCount: 15,
      videoCount: 1,
      executeTime: "2025-11-14 08:43:40",
      executeDate: "2025-11-14",
      verifiedAlarmCount: 2,
      totalAlarmCount: 2,
      alarmVerifyStatus: AlarmVerifyStatus.COMPLETED,
      batteryPercent: 68,
      locationLabel: "奥体中心主场馆上空",
      mapTheme:
        "linear-gradient(135deg, rgba(46, 42, 74, 0.95), rgba(18, 27, 58, 0.92)), radial-gradient(circle at 55% 25%, rgba(128, 179, 255, 0.18), transparent 32%)",
      telemetry: [
        { time: 0, altitude: 0, speed: 0 },
        { time: 60, altitude: 140, speed: 8 },
        { time: 120, altitude: 180, speed: 14 },
        { time: 180, altitude: 175, speed: 12 },
        { time: 240, altitude: 165, speed: 10 },
        { time: 318, altitude: 0, speed: 0 },
      ],
      flightLogs: [
        { id: 1, time: "08:49:56", level: "info", content: "活动区域人流监控已覆盖主看台与北入口" },
        { id: 2, time: "08:46:15", level: "warning", content: "风速短时升高，已降低侧向机动速度" },
      ],
    },
    {
      id: 6,
      recordNo: "HB202511163289",
      taskName: "香洲区环保巡查",
      routeName: "香洲区重点企业航线",
      airportName: "香洲区环保方舱",
      droneName: "环保监测-01 (XB2025)",
      pilotName: "司马懿",
      flightDurationText: "3分21秒",
      durationSeconds: 201,
      alarmCount: 2,
      imageCount: 34,
      videoCount: 2,
      executeTime: "2025-11-14 09:30:55",
      executeDate: "2025-11-14",
      verifiedAlarmCount: 2,
      totalAlarmCount: 2,
      alarmVerifyStatus: AlarmVerifyStatus.COMPLETED,
      batteryPercent: 93,
      locationLabel: "香洲工业园环保巡检点",
      mapTheme:
        "linear-gradient(135deg, rgba(24, 51, 71, 0.96), rgba(10, 27, 45, 0.92)), radial-gradient(circle at 25% 70%, rgba(45, 220, 255, 0.16), transparent 32%)",
      telemetry: [
        { time: 0, altitude: 0, speed: 0 },
        { time: 20, altitude: 100, speed: 6 },
        { time: 40, altitude: 180, speed: 12 },
        { time: 80, altitude: 220, speed: 19 },
        { time: 120, altitude: 220, speed: 18 },
        { time: 160, altitude: 160, speed: 9 },
        { time: 201, altitude: 0, speed: 0 },
      ],
      flightLogs: [
        {
          id: 1,
          time: "09:33:20",
          level: "info",
          content: "完成厂区废气排放口巡检，已抓拍 12 张图像",
        },
        { id: 2, time: "09:31:47", level: "info", content: "视频回传稳定，环境指标面板同步刷新" },
      ],
    },
  ];
}

export function getFlightRecordById(id: number): FlightRecordItem | undefined {
  return buildFlightRecordData().find((item) => item.id === id);
}
