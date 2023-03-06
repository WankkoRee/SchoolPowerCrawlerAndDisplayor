import { createRouter, createWebHistory } from "vue-router";

import { loadingBarApi, userInfo } from "@/utils";
import { getUserInfo } from "@/api";

export default function createAppRouter(routes: { path: string; name: string; component: { name: string } }[]) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(async function (to, from) {
    loadingBarApi.value?.start();
    userInfo.value = await getUserInfo();
    console.debug(userInfo.value);
  });
  router.afterEach(function (to, from) {
    loadingBarApi.value?.finish();
  });
  return router;
}
