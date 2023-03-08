import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import { loadingBarApi, userInfo } from "@/utils";
import { getUserInfo, requestsCanceler } from "@/api";

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
    requestsCanceler.value.forEach((canceler) => canceler());
    loadingBarApi.value?.start();
  });
  router.afterEach(function (to, from) {
    loadingBarApi.value?.finish();
  });
  return router;
}
