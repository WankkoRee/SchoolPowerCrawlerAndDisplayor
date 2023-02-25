<template>
  <n-space align="center" justify="center" style="height: 100%">
    <n-gradient-text size="80" type="success">
      {{ title }}
    </n-gradient-text>
    <n-gradient-text size="32" type="success"> ——更懂电费，更懂你 </n-gradient-text>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "Index",
};
</script>

<script lang="ts" setup>
import { NSpace, NGradientText } from "naive-ui";

const title = import.meta.env.VITE_APP_TITLE;
</script>

<style scoped></style>
