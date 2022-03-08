<template>
  <n-layout position="absolute">
    <n-layout-header position="absolute" style="height: 64px; padding: 8px" bordered>
      <n-grid cols="12" style="height: 100%;" item-responsive>
        <n-grid-item span="10 900:3">
          <n-space align="center" justify="start" style="height: 100%; margin-top: 0; margin-bottom: 0;">
            <div style="font-size: 18px;">{{ title }}</div>
          </n-space>
        </n-grid-item>
        <n-grid-item span="0 900:6">
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
                :disabled="roomsSelectLoading"
            />
          </n-space>
        </n-grid-item>
        <n-grid-item span="0 900:3">
          <n-space align="center" justify="end" style="height: 100%; margin-top: 0; margin-bottom: 0;">
            <n-button @click="showRank=!showRank">
              🏆
            </n-button>
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
        <n-grid-item span="2 900:0">
          <n-space align="center" justify="end" style="height: 100%; margin-top: 0; margin-bottom: 0;">
            <n-button @click="showMenu && showRank ? showRank=!showRank : showMenu=!showMenu">
              {{ showMenu && showRank ? '🏆' : '=' }}
            </n-button>
          </n-space>
        </n-grid-item>
      </n-grid>
    </n-layout-header>
    <n-layout position="absolute" style="top: 64px; bottom: 64px;" content-style="padding: 8px;">
      <div id="container" style="min-height: 100%">
        <div v-if="!roomsSelected.length" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);">
          <n-empty description="要不咱先选几个寝室看看数据？" />
        </div>
        <n-space v-if="roomsSelected.length" vertical>
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
                <RoomsChart chartName="每日用电量" :theme="themeSwitch" :roomsName="roomsSelected.map(roomId => roomsData[roomId].roomName)" :roomsLog="roomsSelected.map(roomId => roomsData[roomId].roomDaily)" />
              </n-grid-item>
              <n-grid-item>
                <RoomsChart chartName="每小时用电量" :theme="themeSwitch" :roomsName="roomsSelected.map(roomId => roomsData[roomId].roomName)" :roomsLog="roomsSelected.map(roomId => roomsData[roomId].roomHourlyUsed)" />
              </n-grid-item>
            </n-grid>
          </div>
        </n-space>
      </div>
      <n-drawer
          v-model:show="showMenu"
          height="auto"
          placement="top"
          to="#container"
          :auto-focus="false"
      >
        <div style="padding: 8px">
          <n-grid :x-gap="8" :y-gap="8" cols="1">
            <n-grid-item span="1">
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
                    :disabled="roomsSelectLoading"
                />
              </n-space>
            </n-grid-item>
            <n-grid-item span="1">
              <n-space align="center" justify="space-around" style="height: 100%; margin-top: 0; margin-bottom: 0;">
                <n-button @click="showRank=!showRank">
                  🏆
                </n-button>
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
        </div>
      </n-drawer>
      <n-drawer
          v-model:show="showRank"
          height="100%"
          placement="top"
          to="#container"
          :auto-focus="false"
      >
        <div style="padding: 8px">
          <n-grid :x-gap="8" :y-gap="8" cols="3" item-responsive>
            <n-grid-item span="3 900:1">
              <n-card title="今日用电量Top3" hoverable>
                <rooms-rank :data="dailyTopUsed" :type="dailyTopUsedType" unit="kWh" />
                <template #header-extra>
                  <n-input-number style="width: 80px" v-model:value="dailyTopUsedLimit" :update-value-on-input="false" :show-button="false" placeholder="" :min="1" :max="20" @update:value="dailyTopUsedTypeUpdate">
                    <template #prefix>
                      前
                    </template>
                    <template #suffix>
                      的
                    </template>
                  </n-input-number>
                  <n-radio-group v-model:value="dailyTopUsedType" @update:value="dailyTopUsedTypeUpdate">
                    <n-radio-button value="area">校区</n-radio-button>
                    <n-radio-button value="building">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </template>
              </n-card>
            </n-grid-item>
            <n-grid-item span="3 900:1">
              <n-card title="本周用电量Top3" hoverable>
                <rooms-rank :data="weeklyTopUsed" :type="weeklyTopUsedType" unit="kWh" />
                <template #header-extra>
                  <n-input-number style="width: 80px" v-model:value="weeklyTopUsedLimit" :update-value-on-input="false" :show-button="false" placeholder="" :min="1" :max="20" @update:value="weeklyTopUsedTypeUpdate">
                    <template #prefix>
                      前
                    </template>
                    <template #suffix>
                      的
                    </template>
                  </n-input-number>
                  <n-radio-group v-model:value="weeklyTopUsedType" @update:value="weeklyTopUsedTypeUpdate">
                    <n-radio-button value="area">校区</n-radio-button>
                    <n-radio-button value="building">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </template>
              </n-card>
            </n-grid-item>
            <n-grid-item span="3 900:1">
              <n-card title="本周日均用电量Top3" hoverable>
                <rooms-rank :data="weeklyTopAvg" :type="weeklyTopAvgType" unit="kWh/d" />
                <template #header-extra>
                  <n-input-number style="width: 80px" v-model:value="weeklyTopAvgLimit" :update-value-on-input="false" :show-button="false" placeholder="" :min="1" :max="20" @update:value="weeklyTopAvgTypeUpdate">
                    <template #prefix>
                      前
                    </template>
                    <template #suffix>
                      的
                    </template>
                  </n-input-number>
                  <n-radio-group v-model:value="weeklyTopAvgType" @update:value="weeklyTopAvgTypeUpdate">
                    <n-radio-button value="area">校区</n-radio-button>
                    <n-radio-button value="building">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </template>
              </n-card>
            </n-grid-item>
          </n-grid>
        </div>
      </n-drawer>
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
  NLayout, NLayoutHeader, NLayoutFooter, NSwitch, NGrid, NGridItem, NSpace, NButton, NCascader, NDrawer, NEmpty, NCard, NRadioGroup, NRadioButton, NInputNumber,
  useMessage,
} from 'naive-ui'
import axios from "axios"

import RoomStatic from "@/components/RoomStatic"
import RoomsChart from "@/components/RoomsChart"
import RoomsRank from "@/components/RoomsRank"

export default {
  name: 'App',
  props: {
    switchTheme: Function,
  },
  components: {
    NLayout, NLayoutHeader, NLayoutFooter, NSwitch, NGrid, NGridItem, NSpace, NButton, NCascader, NDrawer, NEmpty, NCard, NRadioGroup, NRadioButton, NInputNumber,
    RoomStatic, RoomsChart, RoomsRank,
  },
  setup(props) {
    const message = useMessage()

    async function checkRequest(req) {
      const rt = {
        result: undefined,
        err: false,
      }
      try {
        const response = await req
        if (response.status !== 200) {
          // 网络异常
          message.error(`服务器异常，HTTP ${response.status}`, {keepAliveOnHover: true})
          console.error(response)
          rt.err = true
        } else if (response.data.code !== 1) {
          // 数据异常
          message.error(`数据异常，${response.data.error}`, {keepAliveOnHover: true})
          console.error(response.data)
          rt.err = true
        } else {
          rt.result = response.data.data
        }
      } catch (error) {
        message.error(`网络异常，${error.message}`, {keepAliveOnHover: true})
        console.error(error)
        rt.err = true
      }
      return rt
    }

    // 主题
    const themeSwitch = ref(props.switchTheme()) // 主题文本
    const showMenu = ref(false)


    const getDate = (time) => {
      return time.setHours(0,0,0,0) // ret integer
    }
    // 排行
    const showRank = ref(false)
    const dailyTopUsed = ref([])
    const dailyTopUsedType = ref("room")
    const dailyTopUsedLimit = ref(3)
    const weeklyTopUsed = ref([])
    const weeklyTopUsedType = ref("room")
    const weeklyTopUsedLimit = ref(3)
    const weeklyTopAvg = ref([])
    const weeklyTopAvgType = ref("room")
    const weeklyTopAvgLimit = ref(3)
    async function getDailyTopUsed() {
      const dailyTopUsedRequest = axios.get(`./api/rank/daily/${getDate(new Date())}/topUsed/${dailyTopUsedType.value}/${dailyTopUsedLimit.value}`)
      const {result, err} = await checkRequest(dailyTopUsedRequest)
      if (!err) {
        return result
      }
      return []
    }
    async function getWeeklyTopUsed() {
      const weeklyTopUsedRequest = axios.get(`./api/rank/weekly/${getDate(new Date())}/topUsed/${weeklyTopUsedType.value}/${weeklyTopUsedLimit.value}`)
      const {result, err} = await checkRequest(weeklyTopUsedRequest)
      if (!err) {
        return result
      }
      return []
    }
    async function getWeeklyTopAvg() {
      const weeklyTopAvgRequest = axios.get(`./api/rank/weekly/topAvg/${weeklyTopAvgType.value}/${weeklyTopAvgLimit.value}`)
      const {result, err} = await checkRequest(weeklyTopAvgRequest)
      if (!err) {
        return result
      }
      return []
    }

    // 寝室
    const rooms = ref([])
    const roomsSelect = ref([])
    const roomsSelected = ref([])
    const roomsSelectLoading = ref(false)
    const roomsData = {}
    async function getAreas() {
      const areasRequest = axios.get("./api/area")
      const areas = []
      const {result, err} = await checkRequest(areasRequest)
      if (!err) {
        result.forEach(area => {
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
      const buildingsRequest = axios.get(`./api/area/${area}`)
      const buildings = []
      const {result, err} = await checkRequest(buildingsRequest)
      if (!err) {
        result.forEach(building => {
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
      const roomsRequest = axios.get(`./api/building/${building}`)
      const rooms = []
      const {result, err} = await checkRequest(roomsRequest)
      if (!err) {
        result.forEach(room => {
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

      dailyTopUsed.value = await getDailyTopUsed()
      weeklyTopUsed.value = await getWeeklyTopUsed()
      weeklyTopAvg.value = await getWeeklyTopAvg()
    })

    function calcTotalUsed(roomLog, everyMs) {
      if (everyMs == null)
        everyMs = 1000 * 3600 * 24 // 计算每1天的用电情况

      const timezone = new Date().getTimezoneOffset() * 60 * 1000

      const eachLog = {}

      roomLog.forEach(log => {
        const range = log.log_time - (log.log_time - timezone) % everyMs
        if (!Object.keys(eachLog).includes(range.toString()))
          eachLog[range] = {oldest: log, latest: log}

        if (eachLog[range].latest.log_time < log.log_time)
          eachLog[range].latest = log
      })

      const everyLog = []
      for (const [range, {oldest, latest}] of Object.entries(eachLog)) {
        const prevRange = (parseInt(range) - everyMs).toString()
        const nextRange = (parseInt(range) + everyMs).toString()

        const prev = Object.keys(eachLog).includes(prevRange) ?
            (oldest.power - eachLog[prevRange].latest.power) / (oldest.log_time - eachLog[prevRange].latest.log_time) * (oldest.log_time - parseInt(range))
            : 0
        const now = latest.power - oldest.power
        const next = Object.keys(eachLog).includes(nextRange) ?
            (eachLog[nextRange].oldest.power - latest.power) / (eachLog[nextRange].oldest.log_time - latest.log_time) * (parseInt(range) + everyMs - latest.log_time)
            : 0
        everyLog.push({
          power: -Math.round((prev + now + next) * 100) / 100,
          log_time: new Date(parseInt(range)),
        })
      }

      return everyLog
    }

    async function showRooms(roomsId) {
      const deleted = roomsSelected.value.filter(roomId => !roomsId.includes(roomId))
      const added = roomsId.filter(roomId => !roomsSelected.value.includes(roomId))

      roomsSelected.value = roomsSelected.value.filter(roomId => !deleted.includes(roomId)) // delete取消选中的寝室
      roomsSelect.value = roomsSelect.value.filter(roomId => !deleted.includes(roomId))

      for (const roomId of added) {
        if (Object.keys(roomsData).indexOf(roomId.toString()) === -1) {
          const roomRequest = axios.get(`./api/room/${roomId}`)
          const {result, err} = await checkRequest(roomRequest)
          if (!err) {
            roomsData[roomId] = {
              roomInfo: result.roomInfo,
              roomName: `${result.roomInfo.area} の ${result.roomInfo.building} の ${result.roomInfo.room}`,
              roomLog: result.roomLog.map(log => { return {power: log.power, log_time: new Date(log.log_time)} }).sort((a, b) => a.log_time.getTime() - b.log_time.getTime()),
              roomDaily: result.roomDaily.map(log => { return {power: -log.power, log_time: new Date(log.date)} }),
            }
            roomsData[roomId].roomInfo.update_time = new Date(roomsData[roomId].roomInfo.update_time)
            roomsData[roomId].roomHourlyUsed = calcTotalUsed(roomsData[roomId].roomLog, 1000 * 3600)

            roomsSelected.value.push(roomId) // add新选中的寝室
            roomsSelect.value.push(roomId)
          }
        } else {
          roomsSelected.value.push(roomId) // add新选中的寝室
          roomsSelect.value.push(roomId)
        }
      }
    }

    return {
      title: process.env.VUE_APP_TITLE,

      themeSwitch,
      handleThemeSwitch(themeName) {
        props.switchTheme(themeName)
      },
      showMenu,

      showRank,
      dailyTopUsed,
      dailyTopUsedType,
      dailyTopUsedLimit,
      async dailyTopUsedTypeUpdate() {
        dailyTopUsed.value = await getDailyTopUsed()
      },
      weeklyTopUsed,
      weeklyTopUsedType,
      weeklyTopUsedLimit,
      async weeklyTopUsedTypeUpdate() {
        weeklyTopUsed.value = await getWeeklyTopUsed()
      },
      weeklyTopAvg,
      weeklyTopAvgType,
      weeklyTopAvgLimit,
      async weeklyTopAvgTypeUpdate() {
        weeklyTopAvg.value = await getWeeklyTopAvg()
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
        roomsSelectLoading.value = true
        rooms.value.forEach(buildings => {
          buildings.disabled = true
          if (buildings.children)
            buildings.children.forEach(rooms => {
              rooms.disabled = true
              if (rooms.children)
                rooms.children.forEach(room => {
                  room.disabled = true
                })
            })
        })

        const tmpSelected = [...value]

        roomsSelect.value.splice(0, roomsSelect.value.length) // roomsSelect.value.clear()
        roomsSelect.value.push(...roomsSelected.value)

        const maxLimit = 8
        if (tmpSelected.length > maxLimit) {
          message.warning(`最多选择${maxLimit}个，你尝试选择的寝室有${tmpSelected.length}个，已超出范围`, {keepAliveOnHover: true})
        } else {
          await showRooms(tmpSelected)
        }

        rooms.value.forEach(buildings => {
          buildings.disabled = false
          if (buildings.children)
            buildings.children.forEach(rooms => {
              rooms.disabled = false
              if (rooms.children)
                rooms.children.forEach(room => {
                  room.disabled = false
                })
            })
        })
        roomsSelectLoading.value = false
      },

      roomsSelect,
      roomsSelected,
      roomsSelectLoading,
      roomsData,
    }
  },
}
</script>

<style scoped>

</style>
