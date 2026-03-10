import request from "@/utils/request";
import type { BaseQueryParams, PageResult } from "@/types/api";

/**
 * 任务查询分页参数
 */
export interface TaskPageQuery extends BaseQueryParams {
  /** 任务名称 */
  name?: string;
  /** 任务状态 */
  status?: number;
}

/**
 * 任务视图对象
 */
export interface TaskVO {
  id: number;
  /** 任务名称 */
  name: string;
  /** 任务航线ID */
  routeId: number;
  /** 航线名称 */
  routeName: string;
  /** 所属部门 (原型展示用) */
  department?: string;
  /** 执行机场 (原型展示用) */
  airportName?: string;
  /** 执行无人机ID */
  droneId: number;
  /** 无人机名称 */
  droneName: string;
  /** 执行飞手ID */
  pilotId: number;
  /** 飞手姓名 */
  pilotName: string;
  /** 应用算法 (原型展示用) */
  algorithm?: string;
  /** 任务策略 (原型展示用) */
  strategy?: string;
  /** 状态(0:待执行 1:执行中 2:已暂停 3:已完成 4:已取消 5:执行失败) */
  status: number;
  /** 计划执行时间 */
  scheduledAt?: string;
  /** 备注 */
  remark?: string;
  /** 创建人 */
  creatorName?: string;
  /** 创建时间 */
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 任务表单对象
 */
export interface TaskForm {
  id?: number;
  name: string;
  routeId?: number;
  droneId?: number;
  pilotId?: number;
  scheduledAt?: string;
  remark?: string;
  algorithm?: string;
  strategy?: string;
  department?: string;
  airportName?: string;
}

const TASK_BASE_URL = "/api/v1/missions";

const TaskAPI = {
  /**
   * 获取任务分页列表
   *
   * @param queryParams 查询参数
   */
  getPage(queryParams: TaskPageQuery) {
    return request<any, PageResult<TaskVO>>({
      url: `${TASK_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取任务明细
   *
   * @param id 任务ID
   */
  getDetail(id: number) {
    return request<any, TaskForm>({
      url: `${TASK_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /**
   * 新增任务
   *
   * @param data 表单数据
   */
  add(data: TaskForm) {
    return request({
      url: `${TASK_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /**
   * 修改任务
   *
   * @param id 任务ID
   * @param data 表单数据
   */
  update(id: number, data: TaskForm) {
    return request({
      url: `${TASK_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 删除任务
   *
   * @param ids 任务ID，多个以逗号分隔
   */
  delete(ids: string) {
    return request({
      url: `${TASK_BASE_URL}/${ids}`,
      method: "delete",
    });
  },
};

export default TaskAPI;
