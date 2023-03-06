<template>
  <n-config-provider :locale="locale" :date-locale="dateZhCN" :theme="theme" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <n-layout position="absolute">
            <n-layout-header style="height: 64px; padding: 8px" bordered>
              <site-header />
            </n-layout-header>
            <n-layout id="container" position="absolute" style="top: 64px" :native-scrollbar="false">
              <n-layout-content content-style="min-height: calc(100vh - 64px * 2); padding: 16px">
                <router-view v-if="reloadFlag" />
              </n-layout-content>
              <n-layout-footer style="height: 64px; padding: 8px" bordered>
                <site-footer />
              </n-layout-footer>
            </n-layout>
          </n-layout>
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script lang="ts">
export default {
  name: "SiteRoot",
};
import { ref, watch, provide, nextTick } from "vue";
import type { Ref } from "vue";
import { useStorage } from "@vueuse/core";
import { createLocale, useOsTheme } from "naive-ui";
import { zhCN, lightTheme, darkTheme } from "naive-ui";
import type { GlobalTheme } from "naive-ui";

import { getUserInfo } from "@/api";
import { userInfo } from "@/utils";

function changeTheme(themeRef: Ref<GlobalTheme>, themeName: ThemeName) {
  if (themeName === "light") {
    themeRef.value = lightTheme;
  } else if (themeName === "dark") {
    themeRef.value = darkTheme;
  }
}
</script>

<script setup lang="ts">
import { dateZhCN } from "naive-ui";
import { NConfigProvider, NLoadingBarProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import { NLayout, NLayoutHeader, NLayoutContent, NLayoutFooter } from "naive-ui";

import SiteHeader from "@/SiteHeader.vue";
import SiteFooter from "@/SiteFooter.vue";

const locale = createLocale(
  {
    Cascader: {
      loadingRequiredMessage: (label) => `要不你先把我给展开一下？我还不知道 ${label} 里面有啥呢！`,
    },
  },
  zhCN
);
const osTheme = useOsTheme();
const theme = ref(lightTheme);
const themeName = useStorage<ThemeName>("SiteRoot_themeName", osTheme.value ?? "light");
const themeOverrides = {};
const reloadFlag = ref(true);

changeTheme(theme, themeName.value);
watch(themeName, (newThemeName) => changeTheme(theme, newThemeName));
provide("v_themeName", themeName);

// 自动使用系统主题
watch(osTheme, (newOsName) => {
  if (newOsName) themeName.value = newOsName;
});
const reload: ReloadFunc = async () => {
  reloadFlag.value = false;
  userInfo.value = await getUserInfo();
  console.debug(userInfo.value);
  await nextTick();
  reloadFlag.value = true;
};
provide("f_reload", reload);
</script>

<style scoped></style>

<style>
@import "vue3-resize/dist/vue3-resize.css";
</style>
