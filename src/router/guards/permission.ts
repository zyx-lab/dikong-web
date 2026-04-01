import NProgress from "@/plugins/nprogress";
import router from "@/router";
import { usePermissionStore, useUserStore } from "@/store";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { isTenantEnabled } from "@/utils/tenant";
import { addRecentMenu } from "@/composables/useRecentMenus";

export function setupPermissionGuard() {
  const whiteList = ["/login"];

  router.beforeEach(async (to, _from, next) => {
    NProgress.start();

    try {
      const userStore = useUserStore();
      const isLoggedIn = userStore.isLoggedIn();

      if (!isLoggedIn) {
        if (whiteList.includes(to.path)) {
          next();
        } else {
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
          NProgress.done();
        }
        return;
      }

      if (to.path === "/login") {
        next({ path: "/" });
        return;
      }

      const permissionStore = usePermissionStore();

      if (!permissionStore.isRouteGenerated) {
        if (!userStore.userInfoLoaded) {
          await userStore.getUserInfo();
        }

        await initTenantContext();
        await permissionStore.generateRoutes();

        next({ ...to, replace: true });
        return;
      }

      if (to.matched.length === 0) {
        next("/404");
        return;
      }

      const title = (to.params.title as string) || (to.query.title as string);
      if (title) {
        to.meta.title = title;
      }

      next();
    } catch (error) {
      console.error("Route guard error:", error);
      useUserStore().resetAllState();
      next("/login");
      NProgress.done();
    }
  });

  router.afterEach((to) => {
    NProgress.done();

    if (to.meta?.title && to.path) {
      const icon = typeof to.meta.icon === "string" ? to.meta.icon : undefined;
      addRecentMenu(to.path, to.meta.title as string, icon);
    }
  });
}

async function initTenantContext(): Promise<void> {
  const userStore = useUserStore();

  if (!isTenantEnabled()) {
    userStore.setCanSwitchTenant(false);
    userStore.applyTenantContext(null, false);
    return;
  }

  try {
    const tenantStore = useTenantStoreHook();
    const context = await tenantStore.loadTenant();
    const canSwitchTenant = tenantStore.tenantList.length > 1;

    userStore.setCanSwitchTenant(canSwitchTenant);
    userStore.applyTenantContext(context?.member, canSwitchTenant);
  } catch (error) {
    console.debug("[Tenant] Tenant context initialization failed.", error);
    userStore.setCanSwitchTenant(false);
    userStore.applyTenantContext(null, false);
  }
}
