export type PanelTone = "cyan" | "green" | "amber" | "orange" | "red";

export interface ScreenMetricCard {
  id: string;
  label: string;
  value: string | number;
  note?: string;
  accent?: PanelTone;
}

export interface TaskStatusRow {
  id: string;
  label: string;
  value: number;
  ratio: number;
  accent?: Exclude<PanelTone, "red">;
}

export interface RunningTaskItem {
  id: string;
  taskName: string;
  statusText: string;
  statusTone?: PanelTone;
  droneName: string;
  scheduleText: string;
}

export interface DutyDroneItem {
  id: string;
  droneName: string;
  statusText: string;
  statusTone?: PanelTone;
}

export interface WarningEventItem {
  id: string;
  title: string;
  happenedAt: string;
  statusText: string;
  statusTone?: PanelTone;
}

export interface AbnormalFlightItem {
  id: string;
  taskName: string;
  statusText: string;
  statusTone?: PanelTone;
  droneName: string;
  alertCount: number;
  executeTime: string;
}

export interface TaskSituationPanelModel {
  metrics: ScreenMetricCard[];
  statusRows: TaskStatusRow[];
  runningTasks: RunningTaskItem[];
}

export interface DroneOnlinePanelModel {
  metrics: ScreenMetricCard[];
  dutyDrones: DutyDroneItem[];
}

export interface AlertBroadcastPanelModel {
  pendingCount: number;
  closureDone: number;
  closureTotal: number;
  closureRate: number;
  events: WarningEventItem[];
}

export interface FlightClosurePanelModel {
  metrics: ScreenMetricCard[];
  abnormalFlights: AbnormalFlightItem[];
}

export interface SceneRouteLine {
  id: string;
  label: string;
  points: Array<{ x: number; y: number }>;
}

export interface SceneMarker {
  id: string;
  kind: "drone" | "pilot" | "alert";
  x: number;
  y: number;
  tone: "primary" | "success" | "danger";
  label: string;
}

export type SceneBaseMapMode = "satellite" | "terrain" | "vector";

export interface SceneOriginConfig {
  longitude: number;
  latitude: number;
  altitudeMeters: number;
}

export interface SceneHomeViewConfig {
  longitude: number;
  latitude: number;
  height: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export interface SceneSplatPlacement {
  anchorLng: number;
  anchorLat: number;
  heightOffsetMeters: number;
  eastMeters: number;
  northMeters: number;
  upMeters: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
  scale: number;
}

export interface LowAltitudeSceneConfig {
  splatUrl: string;
  backgroundColor: string;
  baseMapMode: SceneBaseMapMode;
  sceneOrigin: SceneOriginConfig;
  homeView: SceneHomeViewConfig;
  splatPlacement: SceneSplatPlacement;
  showCalibrationPanel: boolean;
}
