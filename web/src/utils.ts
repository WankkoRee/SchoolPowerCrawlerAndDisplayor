import { ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import type { MessageApi } from "naive-ui";

import { getUserInfo } from "@/api";
import { LoginDemand } from "@/router";

export const loadingBarApi = ref<LoadingBarApi>();
export const messageApi = ref<MessageApi>();
export const userInfo = ref<UserInfo>();

export const colors = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"];

export class LoadingBarApi {
  private readonly loadingBarApi;
  private indicator = 0;

  constructor(loadingBarApi: import("naive-ui").LoadingBarApi) {
    this.loadingBarApi = loadingBarApi;
  }

  start() {
    if (this.indicator++ === 0) this.loadingBarApi.start();
  }

  finish() {
    if (--this.indicator === 0) this.loadingBarApi.finish();
  }
}

export async function refreshUserInfo(route: RouteLocationNormalizedLoaded, router: Router) {
  userInfo.value = await getUserInfo();
  console.debug(userInfo.value);
  if (route.meta.loginDemand === LoginDemand.LoggedIn && userInfo.value === undefined) {
    router.push({
      name: "Login",
      query: { redirect: route.fullPath },
    });
  } else if (route.meta.loginDemand === LoginDemand.NotLoggedIn && userInfo.value !== undefined) {
    await router.back();
    router.push({ name: "Index" }); // 如果没有上一页则会执行这条
  }
}
