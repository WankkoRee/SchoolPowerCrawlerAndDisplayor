<template>
  <n-switch checked-value="dark" unchecked-value="light" v-model:value="themeName" @update:value="switchTheme('switch')" size="medium">
    <template #icon>
      {{ { light: "☀️", dark: "🌙" }[themeName] }}
    </template>
    <template #checked>夜间</template>
    <template #unchecked>日间</template>
  </n-switch>
</template>

<script lang="ts">
export default {
  name: "themeSwitch",
};
import { ref, inject } from "vue";
</script>

<script lang="ts" setup>
import { NSwitch } from "naive-ui";

const switchTheme = inject<(newThemeName?: string | null) => string>("function_switchTheme")!;

const themeName = ref(switchTheme());
</script>

<style scoped></style>
