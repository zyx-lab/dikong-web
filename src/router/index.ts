import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

export const Layout = () => import("@/layouts/index.vue");

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue"),
      },
    ],
  },

  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: { hidden: true },
  },

  {
    path: "/low-altitude-screen",
    component: () => import("@/views/low-altitude-screen/index.vue"),
    name: "LowAltitudeScreen",
    meta: {
      title: "低空管理大屏",
      hidden: true,
    },
  },

  {
    path: "/",
    name: "/",
    component: Layout,
    redirect: "/dashboard",
    meta: { hidden: true },
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "dashboard",
          icon: "homepage",
          affix: true,
          keepAlive: true,
        },
      },
      {
        path: "401",
        component: () => import("@/views/error/401.vue"),
        meta: { hidden: true },
      },
      {
        path: "404",
        component: () => import("@/views/error/404.vue"),
        meta: { hidden: true },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/profile/index.vue"),
        meta: { title: "个人中心", icon: "user", hidden: true },
      },
      {
        path: "my-notice",
        name: "MyNotice",
        component: () => import("@/views/profile/notice/index.vue"),
        meta: { title: "我的通知", icon: "user", hidden: true },
      },
      {
        path: "/flight/record/detail/:id(\\d+)",
        name: "FlightRecordDetail",
        component: () => import("@/views/flight/record/detail.vue"),
        meta: { title: "飞行记录详情", icon: "user", hidden: true },
      },
      {
        path: "/flight/route/detail/:id",
        name: "FlightRouteDetail",
        component: () => import("@/views/flight/route/detail.vue"),
        meta: { title: "航线详情", icon: "user", hidden: true },
      },
    ],
  },
  {
    path: "/flight",
    component: Layout,
    redirect: "/flight/task",
    name: "/flight",
    meta: {
      title: "巡检任务",
      icon: "el-icon-Position",
    },
    children: [
      {
        path: "task",
        component: () => import("@/views/flight/task/index.vue"),
        name: "FlightTask",
        meta: {
          title: "任务管理",
          icon: "el-icon-List",
          keepAlive: true,
        },
      },
      {
        path: "route",
        component: () => import("@/views/flight/route/index.vue"),
        name: "FlightRoute",
        meta: {
          title: "航线管理",
          icon: "el-icon-MapLocation",
          keepAlive: true,
        },
      },
      {
        path: "dispatch",
        component: () => import("@/views/flight/dispatch/index.vue"),
        name: "FlightDispatch",
        meta: {
          title: "一键调度",
          icon: "el-icon-Promotion",
        },
      },
      {
        path: "console",
        component: () => import("@/views/flight/console/index.vue"),
        name: "FlightConsole",
        meta: {
          title: "飞行控制台",
          icon: "el-icon-Monitor",
        },
      },
      {
        path: "task/hls-player",
        name: "HlsPlayer",
        component: () => import("@/views/flight/task/hls-player.vue"),
        meta: { title: "直播播放", hidden: true },
      },
      {
        path: "record/video-player/:mediaId",
        name: "VideoPlayer",
        component: () => import("@/views/flight/record/video-player.vue"),
        meta: { title: "视频回放", hidden: true },
      },
      {
        path: "record",
        component: () => import("@/views/flight/record/index.vue"),
        name: "FlightRecord",
        meta: {
          title: "飞行记录",
          icon: "el-icon-Document",
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/resource",
    component: Layout,
    redirect: "/resource/overview",
    name: "/resource",
    meta: {
      title: "资源中心",
      icon: "el-icon-Box",
    },
    children: [
      {
        path: "overview",
        component: () => import("@/views/resource/overview/index.vue"),
        name: "ResourceOverview",
        meta: {
          title: "资源总览",
          icon: "el-icon-DataBoard",
          keepAlive: true,
        },
      },
      {
        path: "drone",
        component: () => import("@/views/resource/drone/index.vue"),
        name: "ResourceDrone",
        meta: {
          title: "无人机管理",
          icon: "el-icon-Position",
          keepAlive: true,
        },
      },
      {
        path: "airport",
        component: () => import("@/views/resource/airport/index.vue"),
        name: "ResourceAirport",
        meta: {
          title: "机场管理",
          icon: "el-icon-OfficeBuilding",
          keepAlive: true,
        },
      },
      {
        path: "payload",
        component: () => import("@/views/resource/payload/index.vue"),
        name: "ResourcePayload",
        meta: {
          title: "负载管理",
          icon: "el-icon-Camera",
          keepAlive: true,
        },
      },
      {
        path: "pilot",
        component: () => import("@/views/resource/pilot/index.vue"),
        name: "ResourcePilot",
        meta: {
          title: "飞手管理",
          icon: "el-icon-Avatar",
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/alert",
    component: Layout,
    redirect: "/alert/center",
    name: "/alert",
    meta: {
      title: "告警处置",
      icon: "el-icon-Bell",
    },
    children: [
      {
        path: "center",
        component: () => import("@/views/alert/center/index.vue"),
        name: "AlertCenter",
        meta: {
          title: "预警中心",
          icon: "el-icon-AlarmClock",
          keepAlive: true,
        },
      },
      {
        path: "verify",
        component: () => import("@/views/alert/verify/index.vue"),
        name: "AlertVerify",
        meta: {
          title: "预警核实",
          icon: "el-icon-CircleCheck",
          hidden: true,
        },
      },
    ],
  },
  {
    path: "/workorder",
    component: Layout,
    redirect: "/workorder/center",
    name: "/workorder",
    meta: {
      title: "工单中心",
      icon: "el-icon-Tickets",
    },
    children: [
      {
        path: "center",
        component: () => import("@/views/workorder/center/index.vue"),
        name: "WorkorderCenter",
        meta: {
          title: "全部工单",
          icon: "el-icon-Memo",
          keepAlive: true,
        },
      },
      {
        path: "pending",
        component: () => import("@/views/workorder/pending/index.vue"),
        name: "WorkorderPending",
        meta: {
          title: "待我办理",
          icon: "el-icon-Clock",
          keepAlive: true,
        },
      },
      {
        path: "completed",
        component: () => import("@/views/workorder/completed/index.vue"),
        name: "WorkorderCompleted",
        meta: {
          title: "我已办理",
          icon: "el-icon-Select",
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/algorithm",
    component: Layout,
    redirect: "/algorithm/repository",
    name: "/algorithm",
    meta: {
      title: "算法中心",
      icon: "el-icon-Cpu",
    },
    children: [
      {
        path: "repository",
        component: () => import("@/views/algorithm/repository/index.vue"),
        name: "AlgorithmRepository",
        meta: {
          title: "算法仓库",
          icon: "el-icon-FolderOpened",
          keepAlive: true,
        },
      },
      {
        path: "application",
        component: () => import("@/views/algorithm/application/index.vue"),
        name: "AlgorithmApplication",
        meta: {
          title: "算法应用",
          icon: "el-icon-Connection",
          keepAlive: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

export function setupRouter(app: App<Element>) {
  app.use(router);
}

export default router;
