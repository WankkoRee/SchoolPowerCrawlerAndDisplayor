import { createRouter, createWebHistory } from "vue-router";

import { loadingBarApi } from "@/utils";

export default function createAppRouter(routes: { path: string; name: string; component: { name: string } }[]) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(function (to, from, next) {
    if (!from || to.path !== from.path) {
      loadingBarApi.value?.start();
    }
    next();
  });
  router.afterEach(function (to, from) {
    if (!from || to.path !== from.path) {
      loadingBarApi.value?.finish();
    }
  });
  return router;
}
