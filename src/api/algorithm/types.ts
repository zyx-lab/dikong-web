/** 算法类型 */
export enum AlgorithmType {
  OBJECT_DETECTION = "object_detection",
  BEHAVIOR_ANALYSIS = "behavior_analysis",
  ENVIRONMENT_MONITOR = "environment_monitor",
}

export interface AlgorithmQuery extends PageQuery {
  name?: string;
  type?: AlgorithmType;
  status?: number;
}

export interface AlgorithmInfo {
  id: number;
  name: string;
  description: string;
  type: AlgorithmType;
  version: string;
  accuracy: number;
  status: number;
}

export interface AlgorithmAppInfo {
  id: number;
  appName: string;
  algorithmId: number;
  algorithmName: string;
  deviceId: number;
  deviceName: string;
  runStatus: number;
  detectCount: number;
  accuracy: number;
}
