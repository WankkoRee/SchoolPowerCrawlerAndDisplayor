<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="theme">
    <n-message-provider>
      <app :switchTheme="switchTheme" />
    </n-message-provider>
  </n-config-provider>
</template>

<script>
import {ref, watch} from "vue"
import {
  NConfigProvider, NMessageProvider,
  useOsTheme,
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
    const theme = ref(null)
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
      theme,
      zhCN, dateZhCN,
      switchTheme,
    }
  }
}
</script>

<style scoped>

</style>