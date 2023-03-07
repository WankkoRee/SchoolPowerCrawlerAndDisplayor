<template>
  <n-grid item-responsive :cols="12" style="height: 100%">
    <n-grid-item span="10 1080:4 1440:3">
      <n-space align="center" justify="start" style="width: 100%; height: 100%">
        <router-link :to="{ name: 'Index' }" #="{ navigate, href }" custom>
          <n-button style="display: flex; height: 100%" text tag="a" :href="href" @click="navigate">
            <img src="@/assets/images/logo.png" style="width: 36px; height: 36px; display: block" alt="logo" />
            <n-h2 style="margin: 0">{{ title }}</n-h2>
          </n-button>
        </router-link>
      </n-space>
    </n-grid-item>
    <n-grid-item span="0 1080:7 1440:6">
      <n-space align="center" justify="center" style="width: 100%; height: 100%">
        <n-menu mode="horizontal" :options="menuOptions" v-model:value="menuKey" />
      </n-space>
    </n-grid-item>
    <n-grid-item span="0 1080:1 1440:3">
      <n-space align="center" justify="end" style="width: 100%; height: 100%">
        <theme-switch />
      </n-space>
    </n-grid-item>
    <n-grid-item span="2 1080:0 1440:0">
      <n-space align="center" justify="end" style="width: 100%; height: 100%">
        <n-button @click="showMobileMenu = !showMobileMenu">=</n-button>
      </n-space>
      <n-drawer v-model:show="showMobileMenu" width="auto" placement="right" to="#container" :trap-focus="false" :block-scroll="false">
        <n-space vertical align="center" justify="space-between" style="width: 100%; height: 100%">
          <n-menu mode="vertical" :options="menuOptions" v-model:value="menuKey" />
          <theme-switch style="padding: 8px" />
        </n-space>
      </n-drawer>
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts">
export default {
  name: "SiteHeader",
};
import { h, ref, watch } from "vue";
import type { Component } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { useLoadingBar, useMessage } from "naive-ui";
import { NIcon } from "naive-ui";
import { EaselOutline, LayersOutline, BarChartOutline, HomeOutline } from "@vicons/ionicons5";

import { LoadingBarApi } from "@/utils";

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};
</script>

<script lang="ts" setup>
import { NGrid, NGridItem, NSpace, NH2, NMenu, NButton, NDrawer } from "naive-ui";

import { loadingBarApi, messageApi } from "@/utils";
import ThemeSwitch from "@/components/ThemeSwitch.vue";

loadingBarApi.value = new LoadingBarApi(useLoadingBar());
messageApi.value = useMessage();

const route = useRoute();

const title = import.meta.env.VITE_APP_TITLE;
const menuKey = ref<string>(<string>route.name!);
watch(
  () => route.name,
  (newRouteName) => {
    menuKey.value = <string>newRouteName!;
  }
);
const menuOptions = [
  {
    key: "DashBoard",
    icon: renderIcon(EaselOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: { name: "DashBoard" },
        },
        { default: () => "数据总览" }
      ),
  },
  {
    key: "ComparisonChart",
    icon: renderIcon(LayersOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: { name: "ComparisonChart" },
        },
        { default: () => "寝室对比" }
      ),
  },
  {
    key: "SpendingRank",
    icon: renderIcon(BarChartOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: { name: "SpendingRank" },
        },
        { default: () => "用电排行" }
      ),
  },
  {
    key: "MyRoom",
    icon: renderIcon(HomeOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: { name: "MyRoom" },
        },
        { default: () => "我的寝室" }
      ),
  },
];

const showMobileMenu = ref(false);
</script>

<style scoped></style>
