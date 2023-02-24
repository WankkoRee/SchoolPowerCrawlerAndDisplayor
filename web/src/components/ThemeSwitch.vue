<template>
  <n-switch checked-value="dark" unchecked-value="light" v-model:value="themeName" size="medium">
    <template #icon>
      {{ { light: "☀️", dark: "🌙" }[themeName] }}
    </template>
    <template #checked>夜间</template>
    <template #unchecked>日间</template>
  </n-switch>
</template>

<script lang="ts">
export default {
  name: "ThemeSwitch",
};
import { inject } from "vue";
import type { Ref } from "vue";
</script>

<script lang="ts" setup>
import { NSwitch } from "naive-ui";

const themeName = inject<Ref<"light" | "dark">>("v_themeName")!;
</script>

<style scoped></style>
