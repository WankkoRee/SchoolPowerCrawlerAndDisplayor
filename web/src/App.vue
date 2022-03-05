<template>
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
                placeholder="请选择要查询的寝室"
                :options="rooms"
                multiple
                check-strategy="child"
                clearable
                remote
                separator=" の "
                max-tag-count="responsive"
                v-model:value="roomsSelect"
                @load="handleRoomsLoad"
                @update:value="handleRoomsSelect"
            />
          </n-space>
        </n-grid-item>
        <n-grid-item span="3">
          <n-space align="center" justify="end" style="height: 100%; margin-top: 0; margin-bottom: 0;">
            <n-switch
                checked-value="dark"
                unchecked-value="light"
                v-model:value="themeSwitch"
                @update:value="handleThemeSwitch"
                size="medium"
            >
              <template #icon>
                {{ {light: "☀️", dark: "🌙"}[themeSwitch] }}
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
      <n-space vertical>
        <n-grid :x-gap="8" :y-gap="8" cols="1 800:2 1200:3 1600:4 2000:5">
          <n-grid-item v-for="roomId in roomsSelected" :key="roomId">
            <RoomStatic :roomInfo="roomsData[roomId].roomInfo" :roomName="roomsData[roomId].roomName" />
          </n-grid-item>
        </n-grid>
        <div>
          <n-grid :x-gap="8" :y-gap="8" cols="1">
            <n-grid-item>
              <RoomsChart chartName="历史电量" :theme="themeSwitch" :roomsName="roomsSelected.map(roomId => roomsData[roomId].roomName)" :roomsLog="roomsSelected.map(roomId => roomsData[roomId].roomLog)" />
            </n-grid-item>
            <n-grid-item>
              <RoomsChart chartName="每日用电量" :theme="themeSwitch" :roomsName="roomsSelected.map(roomId => roomsData[roomId].roomName)" :roomsLog="roomsSelected.map(roomId => roomsData[roomId].roomDailyUsed)" />
            </n-grid-item>
            <n-grid-item>
              <RoomsChart chartName="每小时用电量" :theme="themeSwitch" :roomsName="roomsSelected.map(roomId => roomsData[roomId].roomName)" :roomsLog="roomsSelected.map(roomId => roomsData[roomId].roomHourlyUsed)" />
            </n-grid-item>
          </n-grid>
        </div>
      </n-space>
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
</template>

<script>
import { ref, onBeforeMount } from "vue"
import {
  NLayout, NLayoutHeader, NLayoutFooter, NSwitch, NGrid, NGridItem, NSpace, NButton, NCascader,
  useMessage,
} from 'naive-ui'
import axios from "axios"

import RoomStatic from "@/components/RoomStatic"
import RoomsChart from "@/components/RoomsChart"

export default {
  name: 'App',
  props: {
    switchTheme: Function,
  },
  components: {
    NLayout, NLayoutHeader, NLayoutFooter, NSwitch, NGrid, NGridItem, NSpace, NButton, NCascader,
    RoomStatic, RoomsChart,
  },
  setup(props) {
    const message = useMessage()

    function checkRequest(req) {
      if (req.status !== 200) {
        // 网络异常
        message.error(`网络异常，HTTP ${req.status}`, {keepAliveOnHover: true})
        console.error(req)
        return false
      }
      if (req.data.code !== 1) {
        // 数据异常
        message.error(`数据异常，${req.data.error}`, {keepAliveOnHover: true})
        console.error(req.data)
        return false
      }
      return true
    }

    // 主题
    const themeSwitch = ref(props.switchTheme()) // 主题文本

    // 寝室
    const rooms = ref([])
    const roomsSelect = ref([])
    const roomsSelected = ref([])
    const roomsData = {}
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
      rooms.value.splice(0, rooms.value.length) // rooms.value.clear()
      rooms.value.push(...areas)
    })

    /*
    计算rangeMs内的每everyMs用电量
    @param {Array} [roomLog] - 电量日志;
    @param {Integer} [rangeMs] - 计算周期，单位为毫秒;
    @param {Integer} [everyMs] - 计算基数，单位为毫秒;
     */
    function calcAvgUsed(roomLog, rangeMs, everyMs) {
      if (rangeMs == null)
        rangeMs = 1000 * 3600 * 24 * 7 // 取7天内用电情况
      if (everyMs == null)
        everyMs = 1000 * 3600 * 24 // 计算每1天的平均用电情况

      let oldest = {log_time: new Date()}
      let latest = {log_time: new Date(0)}

      const now = new Date()
      roomLog.forEach(log => {
        if (log.log_time - latest.log_time >= 0)
          latest = log
        const diff = now - log.log_time
        if (diff - rangeMs <= 0 && diff > now - oldest.log_time)
          oldest = log
      })
      return -(latest.power - oldest.power) / ((latest.log_time - oldest.log_time) / everyMs)
    }

    function calcTotalUsed(roomLog, everyMs) {
      if (everyMs == null)
        everyMs = 1000 * 3600 * 24 // 计算每1天的用电情况

      const timezone = new Date().getTimezoneOffset() * 60 * 1000

      const eachLog = {}

      roomLog.forEach(log => {
        const range = log.log_time - (log.log_time - timezone) % everyMs
        if (!Object.keys(eachLog).includes(range.toString()))
          eachLog[range] = {log_time: new Date()}
        eachLog[range+everyMs] = log

        if (eachLog[range].log_time - range < 0 || log.log_time - range < eachLog[range].log_time - range)
          eachLog[range] = log
      })

      const everyLog = []
      for (let i = 0; i < Object.keys(eachLog).length - 1; i++) {
        const range = parseInt(Object.keys(eachLog)[i])
        const nextRange = parseInt(Object.keys(eachLog)[i+1])
        everyLog.push({
          power: -Math.round((eachLog[nextRange].power - eachLog[range].power) / (eachLog[nextRange].log_time - eachLog[range].log_time) * (range + everyMs - eachLog[range].log_time) * 100) / 100,
          log_time: new Date(range),
        })
      }
      return everyLog
    }

    async function showRooms(roomsId) {
      const deleted = roomsSelected.value.filter(roomId => !roomsId.includes(roomId))
      const added = roomsId.filter(roomId => !roomsSelected.value.includes(roomId))

      roomsSelected.value = roomsSelected.value.filter(roomId => !deleted.includes(roomId)) // delete取消选中的寝室
      for (const roomId of added) {
        if (Object.keys(roomsData).indexOf(roomId) === -1) {
          const roomReq = await axios.get(`./api/room/${roomId}`)
          if (checkRequest(roomReq)) {
            roomsData[roomId] = {
              roomInfo: roomReq.data.data.roomInfo,
              roomName: `${roomReq.data.data.roomInfo.area} の ${roomReq.data.data.roomInfo.building} の ${roomReq.data.data.roomInfo.room}`,
              roomLog: roomReq.data.data.roomLog.map(log => { return {power: log.power, log_time: new Date(log.log_time)} }).sort((a, b) => a.log_time.getTime() - b.log_time.getTime())
            }
            roomsData[roomId].roomInfo.avgUsed = calcAvgUsed(roomsData[roomId].roomLog, 1000 * 3600 * 24 * 7, 1000 * 3600 * 24)
            roomsData[roomId].roomInfo.update_time = new Date(roomsData[roomId].roomInfo.update_time)
            roomsData[roomId].roomDailyUsed = calcTotalUsed(roomsData[roomId].roomLog, 1000 * 3600 * 24)
            roomsData[roomId].roomHourlyUsed = calcTotalUsed(roomsData[roomId].roomLog, 1000 * 3600)
          }
        }
      }
      roomsSelected.value.push(...added) // add新选中的寝室
    }

    return {
      title: process.env.VUE_APP_TITLE,

      themeSwitch,
      handleThemeSwitch(themeName) {
        props.switchTheme(themeName)
      },

      rooms,
      async handleRoomsLoad(option) {
        if (option.depth === 1) {
          option.children = await getBuildings(option.value)
        } else if (option.depth === 2) {
          option.children = await getRooms(option.value)
        }
      },
      async handleRoomsSelect(value) {
        const maxLimit = 8
        if (value.length > maxLimit) {
          roomsSelect.value.splice(0, roomsSelect.value.length) // roomsSelect.value.clear()
          roomsSelect.value.push(...roomsSelected.value)
          message.warning(`最多选择${maxLimit}个，你尝试选择的寝室有${value.length}个，已超出范围`, {keepAliveOnHover: true})
          return
        }
        await showRooms(value)
      },

      roomsSelect,
      roomsSelected,
      roomsData,
    }
  },
}
</script>

<style scoped>

</style>
