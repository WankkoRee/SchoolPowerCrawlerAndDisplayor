import { ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import type { MessageApi } from "naive-ui";
import { Base64 } from "js-base64";

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

export function roomNameRegex(roomName: string): [string, string, string] | [string, string] {
  const result = roomName.match(/^([A-Z\d]+)-(\d+?)(\d{2}(?:-.+?)?)$/);
  if (result) {
    const [b, l, r] = result.slice(1, 4);
    return [`${b}栋`, `${b}-${l}层`, `${b}-${l}${r}`];
  } else {
    console.warn(`${roomName} 无法匹配正则表达式`);
    return ["未分类", roomName];
  }
}

export function compareRoom(router: Router, area: string, building: string, room: string) {
  router.push({
    name: "ComparisonChart",
    query: {
      rooms: Base64.encodeURI(JSON.stringify([[area, building, ...roomNameRegex(room)]])),
    },
  });
}
