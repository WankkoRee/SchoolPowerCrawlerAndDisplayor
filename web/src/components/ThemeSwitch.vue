<template>
  <n-tooltip :show-arrow="false" trigger="hover">
    <template #trigger>
      <n-switch :style="style" checked-value="dark" unchecked-value="light" v-model:value="themeName" size="medium">
        <template #icon>
          {{ { light: "☀️", dark: "🌙" }[themeName] }}
        </template>
        <template #checked>夜间</template>
        <template #unchecked>日间</template>
      </n-switch>
    </template>
    切换到 {{ { light: "夜间", dark: "日间" }[themeName] }} 模式
  </n-tooltip>
</template>

<script lang="ts">
export default {
  name: "ThemeSwitch",
};
import { inject } from "vue";
import type { CSSProperties } from "vue";
import type { Ref } from "vue";
</script>

<script lang="ts" setup>
import { NSwitch, NTooltip } from "naive-ui";

const props = defineProps<{
  style?: CSSProperties;
}>();

const themeName = inject<Ref<ThemeName>>("v_themeName")!;
</script>

<style scoped></style>
