import type { BadgeVariants } from "@/components/ui/badge";

export type AlertDisposition = "verify" | "close" | "workorder" | "refly";

export interface AlertWorkflowItem {
  id: number;
  level: "紧急" | "重要" | "一般";
  variant: NonNullable<BadgeVariants["variant"]>;
  title: string;
  description: string;
  source: string;
  zone: string;
  time: string;
  evidence: "完整" | "待补视频" | "部分完整";
  nextStep: "派工单" | "补看回放" | "判断是否复飞" | "继续观察";
  recommendedOwner: string;
  workorderTitle: string;
  workorderDescription: string;
}

export const alertWorkflowItems: AlertWorkflowItem[] = [
  {
    id: 1,
    level: "紧急",
    variant: "destructive",
    title: "储罐区温度异常持续升高",
    description: "红外温度连续升高，请尽快核实。",
    source: "红外热成像",
    zone: "化工园区",
    time: "11:18",
    evidence: "完整",
    nextStep: "派工单",
    recommendedOwner: "运维一组",
    workorderTitle: "储罐区热异常工单需要午前到场",
    workorderDescription: "请尽快安排人员到场处理。",
  },
  {
    id: 2,
    level: "重要",
    variant: "secondary",
    title: "围栏入侵疑似再次触发",
    description: "园区东侧围栏连续触发，请补充视频。",
    source: "可见光巡检",
    zone: "港区东侧",
    time: "10:46",
    evidence: "待补视频",
    nextStep: "补看回放",
    recommendedOwner: "复盘组",
    workorderTitle: "围栏异常需要和值守飞手协同补飞",
    workorderDescription: "请安排补飞并补充记录。",
  },
  {
    id: 3,
    level: "一般",
    variant: "outline",
    title: "无人机电池余量接近预警阈值",
    description: "请关注返航时间和后续任务安排。",
    source: "飞控回传",
    zone: "前山河",
    time: "10:12",
    evidence: "部分完整",
    nextStep: "继续观察",
    recommendedOwner: "调度台",
    workorderTitle: "电池余量预警需确认返航安排",
    workorderDescription: "请确认返航窗口和后续任务安排。",
  },
  {
    id: 4,
    level: "重要",
    variant: "secondary",
    title: "管道疑似渗漏点待人工复核",
    description: "请结合照片和历史点位复核。",
    source: "激光雷达+可见光",
    zone: "园区西区",
    time: "09:58",
    evidence: "部分完整",
    nextStep: "判断是否复飞",
    recommendedOwner: "调度台",
    workorderTitle: "园区西区疑似渗漏点需安排复飞复核",
    workorderDescription: "请补充近景资料后再确认是否派单。",
  },
];

export function getAlertWorkflowItem(alertId?: number | null) {
  if (!alertId) return null;
  return alertWorkflowItems.find((item) => item.id === alertId) ?? null;
}

export function getAlertDispositionLabel(disposition: AlertDisposition) {
  switch (disposition) {
    case "close":
      return "直接关闭";
    case "workorder":
      return "转工单";
    case "refly":
      return "安排补飞";
    default:
      return "进入核实";
  }
}

export function getAlertDispositionDescription(
  disposition: AlertDisposition,
  item: AlertWorkflowItem
) {
  switch (disposition) {
    case "close":
      return `已记录“${item.title}”的核实结果，可直接关闭。`;
    case "workorder":
      return `已从预警中心带入“${item.title}”，可继续分派责任人。`;
    case "refly":
      return `已为“${item.title}”保留补飞处理路径，请继续安排任务。`;
    default:
      return `当前正在核实“${item.title}”。`;
  }
}
