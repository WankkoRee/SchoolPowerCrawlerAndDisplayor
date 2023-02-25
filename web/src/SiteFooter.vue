<template>
  <n-space align="center" justify="space-around" style="height: 100%">
    <span> Copyright &copy; <n-button text tag="a" href="https://wkr.moe" target="_blank" type="primary">Wankko Ree</n-button> All Rights Reserved. </span>
    <span>
      Made With ❤️, <n-button text tag="a" href="https://cn.vuejs.org" target="_blank" type="primary">Vue</n-button> and
      <n-button text tag="a" href="https://www.naiveui.com" target="_blank" type="primary">Naive UI</n-button>.
    </span>
    <span>
      Open Source on
      <n-button text tag="a" href="https://github.com/WankkoRee/SchoolPowerCrawlerAndDisplayor" target="_blank" type="primary">Github</n-button>.
    </span>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "SiteFooter",
};
</script>

<script lang="ts" setup>
import { NSpace, NButton } from "naive-ui";
</script>

<style scoped></style>
