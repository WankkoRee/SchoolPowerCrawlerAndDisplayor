<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-layout position="absolute">
      <n-layout-header position="absolute" style="height: 64px; padding: 8px" bordered>
        <n-grid cols="12" style="height: 100%;">
          <n-grid-item span="3">
            <n-space align="center" justify="start" style="height: 100%; margin-top: 0; margin-bottom: 0;">
              <div style="font-size: 18px;">{{ title }}</div>
            </n-space>
          </n-grid-item>
          <n-grid-item span="6">
            <n-space align="center" justify="center" style="width: 100%; height: 100%; margin-top: 0; margin-bottom: 0;" item-style="width: 100%">
              <n-cascader
                  v-model:value="roomSelect"
                  placeholder="请选择要查询的寝室"
                  :options="rooms"
                  check-strategy="child"
                  clearable
                  remote
                  separator=" の "
                  @load="handleRoomsLoad"
                  @update:value="handleRoomsSelect"
              />
            </n-space>
          </n-grid-item>
          <n-grid-item span="3">
            <n-space align="center" justify="end" style="height: 100%; margin-top: 0; margin-bottom: 0;">
              <n-switch
                  checked-value="🌙"
                  unchecked-value="☀️"
                  v-model:value="themeSwitch"
                  @update:value="handleThemeSwitch"
                  size="medium"
              >
                <template #icon>
                  {{ themeSwitch }}
                </template>
                <template #checked>
                  夜间
                </template>
                <template #unchecked>
                  日间
                </template>
              </n-switch>
            </n-space>
          </n-grid-item>
        </n-grid>
      </n-layout-header>
      <n-layout position="absolute" style="top: 64px; bottom: 64px;" content-style="padding: 8px;">
        <RoomStatic v-if="roomStaticShow" :roomInfo="roomInfo" :roomLog="roomLog"/>
      </n-layout>
      <n-layout-footer position="absolute" style="height: 64px; padding: 8px" bordered>
        <n-space align="center" justify="space-around" style="height: 100%; margin-top: 0; margin-bottom: 0;">
          <span>
            Copyright &copy; <n-button text tag="a" href="https://wkr.moe" target="_blank" type="primary">Wankko Ree</n-button> All Rights Reserved.
          </span>
          <span>
            Made With ❤️, <n-button text tag="a" href="https://staging-cn.vuejs.org" target="_blank" type="primary">Vue</n-button> and <n-button text tag="a" href="https://www.naiveui.com" target="_blank" type="primary">Naive UI</n-button>.
          </span>
          <span>
            Open Source on <n-button text tag="a" href="https://github.com/WankkoRee/SchoolPowerCrawlerAndDisplayor" target="_blank" type="primary">Github</n-button>.
          </span>
        </n-space>
      </n-layout-footer>
    </n-layout>
  </n-config-provider>
</template>

<script>
import { ref, onBeforeMount } from "vue"
import {
  NConfigProvider, NLayout, NLayoutHeader, NLayoutFooter, NSwitch, NGrid, NGridItem, NSpace, NButton, NCascader,
  useOsTheme,
  darkTheme, zhCN, dateZhCN,
} from 'naive-ui'
import axios from "axios"

import RoomStatic from "./components/RoomStatic"

export default {
  name: 'App',
  props: {
  },
  components: {
    NConfigProvider, NLayout, NLayoutHeader, NLayoutFooter, NSwitch, NGrid, NGridItem, NSpace, NButton, NCascader,
    RoomStatic,
  },
  setup(props) {
    console.log(props)
    function checkRequest(req) {
      if (req.status !== 200) {
        // 网络异常
        // TODO: log
        console.error(req)
        return false
      }
      if (req.data.code !== 1) {
        // 数据异常
        // TODO: log
        console.error(req.data)
        return false
      }
      return true
    }

    // 主题
    const theme = ref(null) // 主题包
    const themeSwitch = ref("☀️") // 主题文本
    if (useOsTheme().value === "dark") {
      theme.value = darkTheme
      themeSwitch.value = "🌙"
    }
    // 寝室
    const roomSelect = ref(null)
    const rooms = ref([])
    async function getAreas() {
      const areasReq = await axios.get("./api/area")
      const areas = []
      if (checkRequest(areasReq)) {
        areasReq.data.data.forEach(area => {
          areas.push({
            label: area,
            value: area,
            depth: 1,
            isLeaf: false
          })
        })
      }
      return areas.sort((a, b) => a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'}))
    }
    async function getBuildings(area) {
      const buildingsReq = await axios.get(`./api/area/${area}`)
      const buildings = []
      if (checkRequest(buildingsReq)) {
        buildingsReq.data.data.forEach(building => {
          buildings.push({
            label: building,
            value: building,
            depth: 2,
            isLeaf: false
          })
        })
      }
      return buildings.sort((a, b) => a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'}))
    }
    async function getRooms(building) {
      const roomsReq = await axios.get(`./api/building/${building}`)
      const rooms = []
      if (checkRequest(roomsReq)) {
        roomsReq.data.data.forEach(room => {
          rooms.push({
            label: room.room,
            value: room.id,
            depth: 3,
            isLeaf: true
          })
        })
      }
      return rooms.sort((a, b) => a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'}))
    }
    onBeforeMount(async () => {
      const areas = await getAreas()
      rooms.value.push(...areas)
    })
    async function showRoom(roomId) {
      roomStaticShow.value = false
      const roomReq = await axios.get(`./api/room/${roomId}`)
      if (checkRequest(roomReq)) {
        roomInfo.value = roomReq.data.data.roomInfo
        roomLog.value = roomReq.data.data.roomLog
        roomStaticShow.value = true
      }
    }
    // 组件传参
    const roomStaticShow = ref(false)
    const roomInfo = ref({})
    const roomLog = ref([])

    return {
      title: process.env.VUE_APP_TITLE,

      theme,
      themeSwitch,
      handleThemeSwitch(value) {
        if (value === "🌙")
          theme.value = darkTheme
        else
          theme.value = null
      },
      zhCN, dateZhCN,

      roomSelect,
      rooms,
      async handleRoomsLoad(option) {
        if (option.depth === 1) {
          option.children = await getBuildings(option.value)
        } else if (option.depth === 2) {
          option.children = await getRooms(option.value)
        }
      },
      async handleRoomsSelect(value) {
        await showRoom(value)
      },

      roomStaticShow,
      roomInfo,
      roomLog,
    }
  },
}
</script>

<style scoped>
#app {

}
</style>
