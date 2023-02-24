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
                <router-view />
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
import { ref, watch, provide } from "vue";
import { createLocale, useOsTheme } from "naive-ui";
import { zhCN, lightTheme, darkTheme } from "naive-ui";
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
const theme = ref(lightTheme);
const themeName = ref<"light" | "dark">("light");
const themeOverrides = {};

watch(themeName, (newThemeName) => {
  if (newThemeName === "light") {
    theme.value = lightTheme;
  } else if (newThemeName === "dark") {
    theme.value = darkTheme;
  }
});
provide("v_themeName", themeName);

// 自动使用系统主题
const osTheme = useOsTheme();
if (osTheme.value) themeName.value = osTheme.value;
watch(osTheme, (newOsName) => {
  if (newOsName) themeName.value = newOsName;
});
</script>

<style scoped></style>

<style>
@import "vue3-resize/dist/vue3-resize.css";
</style>
