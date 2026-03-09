/** 告警级别 */
export enum AlertLevel {
  URGENT = 1,
  IMPORTANT = 2,
  NORMAL = 3,
}

/** 告警状态 */
export enum AlertStatus {
  PENDING = 0,
  PROCESSING = 1,
  CONFIRMED = 2,
  FALSE_ALARM = 3,
  RESOLVED = 4,
}

export interface AlertQuery extends PageQuery {
  alertType?: string;
  level?: AlertLevel;
  status?: AlertStatus;
  startTime?: string;
  endTime?: string;
}

export interface AlertInfo {
  id: number;
  alertCode: string;
  alertType: string;
  level: AlertLevel;
  source: string;
  description: string;
  triggerTime: string;
  status: AlertStatus;
  mediaUrls?: string[];
}
