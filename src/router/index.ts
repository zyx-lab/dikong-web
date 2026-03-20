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
    path: "/screen/low-altitude",
    name: "LowAltitudeScreen",
    component: () => import("@/views/screen/low-altitude/index.vue"),
    meta: {
      hidden: true,
      title: "低空平台数据大屏",
    },
  },

  {
    path: "/",
    name: "/",
    component: Layout,
    redirect: "/dashboard",
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
        path: "/detail/:id(\\d+)",
        name: "DemoDetail",
        component: () => import("@/views/demo/detail.vue"),
        meta: { title: "详情页缓存", icon: "user", hidden: true, keepAlive: true },
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
