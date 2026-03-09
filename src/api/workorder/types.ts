/** 工单状态 */
export enum WorkorderStatus {
  CREATED = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  CLOSED = 3,
}

/** 工单优先级 */
export enum WorkorderPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

export interface WorkorderQuery extends PageQuery {
  orderNo?: string;
  type?: string;
  priority?: WorkorderPriority;
  status?: WorkorderStatus;
}

export interface WorkorderInfo {
  id: number;
  orderNo: string;
  orderType: string;
  priority: WorkorderPriority;
  sourceAlertId?: number;
  sourceAlertCode?: string;
  handler: string;
  currentNode: string;
  createTime: string;
  status: WorkorderStatus;
}
