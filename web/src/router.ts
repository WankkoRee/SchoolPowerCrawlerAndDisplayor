import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import { loadingBarApi, userInfo } from "@/utils";
import { getUserInfo } from "@/api";

export enum LoginDemand {
  LoggedIn,
  NotLoggedIn,
  NoMatter,
}

declare module "vue-router" {
  interface RouteMeta {
    loginDemand: LoginDemand;
  }
}

export default function createAppRouter(routes: RouteRecordRaw[]) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(async function (to, from) {
    loadingBarApi.value?.start();
    userInfo.value = await getUserInfo();
    console.debug(userInfo.value);
    if (to.meta.loginDemand === LoginDemand.LoggedIn && userInfo.value === undefined) {
      loadingBarApi.value?.finish();
      return {
        name: "Login",
        query: { redirect: to.fullPath },
      };
    } else if (to.meta.loginDemand === LoginDemand.NotLoggedIn && userInfo.value !== undefined) {
      loadingBarApi.value?.finish();
      return from;
    }
  });
  router.afterEach(function (to, from) {
    loadingBarApi.value?.finish();
  });
  return router;
}
