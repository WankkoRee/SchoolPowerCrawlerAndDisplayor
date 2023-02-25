<template>
  <n-space align="center" justify="center" :size="0" style="height: 100%" item-style="overflow: hidden">
    <n-space align="center" justify="center" :size="0" id="title">
      <img src="@/assets/images/logo.png" style="width: 100px; display: inline" alt="logo" />
      <n-gradient-text size="80" type="success"> {{ title }} </n-gradient-text>
    </n-space>
    <n-divider vertical style="height: 100px" />
    <n-gradient-text size="32" type="success" id="slogan"> ——更懂电费，更懂你 </n-gradient-text>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "Index",
};
</script>

<script lang="ts" setup>
import { NSpace, NDivider, NGradientText } from "naive-ui";

const title = import.meta.env.VITE_APP_TITLE;
</script>

<style scoped>
#title {
  position: relative;
  animation-name: title;
  animation-iteration-count: 1;
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
}
#slogan {
  position: relative;
  animation-name: slogan;
  animation-iteration-count: 1;
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
}
@keyframes title {
  from {
    left: 100%;
  }
  to {
    left: 0;
  }
}
@keyframes slogan {
  from {
    right: 100%;
  }
  to {
    right: 0;
  }
}
</style>
