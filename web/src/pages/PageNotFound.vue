<template>
  <n-layout position="absolute" style="top: 0; bottom: 0">
    <n-space vertical align="center" justify="center" style="height: 100%" item-style="width: min(80vw, 600px)">
      <img src="@/assets/images/404.svg" alt="404" />
      <n-space align="center" justify="space-around">
        <n-button size="large" type="primary" @click="goBackClick" style="width: 120px"> 点我回到过去 </n-button>
      </n-space>
    </n-space>
  </n-layout>
</template>

<script lang="ts">
export default {
  name: "PageNotFound",
};

import { useRouter } from "vue-router";
</script>

<script lang="ts" setup>
import { NLayout, NSpace, NButton } from "naive-ui";

const router = useRouter();

async function goBackClick(e: MouseEvent) {
  e.preventDefault();
  await router.back();
  router.push({ name: "Index" }); // 如果没有上一页则会执行这条
}
</script>

<style scoped></style>
