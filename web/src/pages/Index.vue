<template>
  <n-grid item-responsive :cols="1">
    <n-grid-item span="0 700:1">
      <n-layout position="absolute" style="top: 0; bottom: 0">
        <n-space align="center" justify="center" :size="0" style="height: 100%" item-style="overflow: hidden">
          <n-space align="center" justify="center" :size="0" class="title pc">
            <img src="@/assets/images/logo.png" style="width: 100px; display: inline" alt="logo" />
            <n-gradient-text size="80" type="success"> {{ title }} </n-gradient-text>
          </n-space>
          <n-divider vertical style="height: 100px" />
          <n-gradient-text size="32" type="success" class="slogan pc"> ——更懂电费，更懂你 </n-gradient-text>
        </n-space>
      </n-layout>
    </n-grid-item>
    <n-grid-item span="1 700:0">
      <n-layout position="absolute" style="top: 0; bottom: 0">
        <n-space vertical align="center" justify="center" :size="0" style="height: 100%" item-style="overflow: hidden">
          <n-space align="center" justify="center" :size="0" class="title mobile">
            <img src="@/assets/images/logo.png" style="width: 100px; display: inline" alt="logo" />
            <n-gradient-text size="80" type="success"> {{ title }} </n-gradient-text>
          </n-space>
          <n-divider style="width: 300px" />
          <n-gradient-text size="32" type="success" class="slogan mobile"> ——更懂电费，更懂你 </n-gradient-text>
        </n-space>
      </n-layout>
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts">
export default {
  name: "Index",
};
</script>

<script lang="ts" setup>
import { NGrid, NGridItem, NLayout, NSpace, NDivider, NGradientText } from "naive-ui";

const title = import.meta.env.VITE_APP_TITLE;
</script>

<style scoped>
.title {
  position: relative;
  animation-iteration-count: 1;
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
}
.title.pc {
  animation-name: title_pc;
}
.title.mobile {
  animation-name: title_mobile;
}
.slogan {
  position: relative;
  animation-iteration-count: 1;
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
}
.slogan.pc {
  animation-name: slogan_pc;
}
.slogan.mobile {
  animation-name: slogan_mobile;
}
@keyframes title_pc {
  from {
    left: 100%;
  }
  to {
    left: 0;
  }
}
@keyframes title_mobile {
  from {
    top: 100%;
  }
  to {
    top: 0;
  }
}
@keyframes slogan_pc {
  from {
    right: 100%;
  }
  to {
    right: 0;
  }
}
@keyframes slogan_mobile {
  from {
    bottom: 100%;
  }
  to {
    bottom: 0;
  }
}
</style>
