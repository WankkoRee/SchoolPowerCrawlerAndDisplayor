<template>
  <n-space align="center" justify="center" style="height: 100%" item-style="width: 100%">
    <n-grid item-responsive :cols="6" style="width: 100%">
      <n-grid-item span="6 640:3 960:2">
        <n-space align="center" justify="center">
          <n-ellipsis>
            Copyright &copy; <n-button text tag="a" href="https://wkr.moe" target="_blank" type="primary">Wankko Ree</n-button> All Rights Reserved.
          </n-ellipsis>
        </n-space>
      </n-grid-item>
      <n-grid-item span="0 640:0 960:2">
        <n-space align="center" justify="center">
          <n-ellipsis>
            Made With ❤️, <n-button text tag="a" href="https://cn.vuejs.org" target="_blank" type="primary">Vue</n-button> and
            <n-button text tag="a" href="https://www.naiveui.com" target="_blank" type="primary">Naive UI</n-button>.
          </n-ellipsis>
        </n-space>
      </n-grid-item>
      <n-grid-item span="6 640:3 960:2">
        <n-space align="center" justify="center">
          <n-ellipsis>
            Open Source on
            <n-button text tag="a" href="https://github.com/WankkoRee/SchoolPowerCrawlerAndDisplayor" target="_blank" type="primary">Github</n-button>.
          </n-ellipsis>
        </n-space>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "SiteFooter",
};
</script>

<script lang="ts" setup>
import { NSpace, NGrid, NGridItem, NEllipsis, NButton } from "naive-ui";
</script>

<style scoped></style>
