export interface TaskSituationRow {
  id: string;
  taskName: string;
  statusLabel: string;
  routeName: string;
  startTime: string;
}

export interface TaskSituationPanelModel {
  summary: {
    todayCount: number;
    executingCount: number;
  };
  rows: TaskSituationRow[];
}

export interface DroneOnlineRow {
  id: string;
  droneName: string;
  currentLabel: string;
  statusLabel: string;
}

export interface DroneOnlinePanelModel {
  summary: {
    onlineCount: number;
    dispatchableCount: number;
    standbyCount: number;
  };
  rows: DroneOnlineRow[];
}

export interface AlertBroadcastRow {
  id: string;
  title: string;
  levelLabel: string;
  happenedAt: string;
}

export interface AlertBroadcastPanelModel {
  summary: {
    totalCount: number;
    highLevelCount: number;
    trackingCount: number;
  };
  rows: AlertBroadcastRow[];
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
