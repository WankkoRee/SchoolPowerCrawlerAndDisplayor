<template>
  <n-config-provider :locale="locale" :date-locale="dateZhCN" :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <app :switchTheme="switchTheme" />
    </n-message-provider>
  </n-config-provider>
</template>

<script>
import {ref, watch} from "vue"
import {
  NConfigProvider, NMessageProvider,
  createLocale, useOsTheme,
  zhCN, dateZhCN, darkTheme,
} from "naive-ui"

import App from "@/App"

export default {
  name: "GateWay",
  components: {
    NConfigProvider, NMessageProvider,
    App,
  },
  setup() {
    const locale = createLocale({
      Cascader: {
        loadingRequiredMessage: (label) => `别点框框嗷，我还不知道 ${label} 里面有啥呢！`
      },
    }, zhCN)

    const theme = ref(null)
    const themeOverrides = {
      Cascader: {
        columnWidth: '120px'
      },
    }
    const themeName = ref("light")
    const switchTheme = (arg_themeName) => {
      if (arg_themeName === "light") {
        theme.value = null
      } else if (arg_themeName === "dark") {
        theme.value = darkTheme
      } else {
        return themeName.value
      }
      themeName.value = arg_themeName
    }

    switchTheme(useOsTheme().value)
    watch(() => useOsTheme().value, (arg_themeName) => {
      switchTheme(arg_themeName)
    })

    return {
      locale, dateZhCN,
      theme, themeOverrides,
      switchTheme,
    }
  }
}
</script>

<style scoped>

</style>