<template>
  <n-space vertical>
    <n-card :title="`${roomInfo.area} の ${roomInfo.building} の ${roomInfo.room}`" hoverable>
      <template #header-extra>
        <n-time :time="new Date(roomInfo.update_time)" type="relative" />
      </template>
      <n-statistic label="剩余电量" tabular-nums>
        <n-number-animation
            ref="remainingPower"
            :from="0"
            :to="roomInfo.power"
            :duration="500"
            :active="true"
            :precision="2"
        />
      </n-statistic>
    </n-card>
    <n-card title="历史电量" hoverable>
      <div id="roomLogChart" style="height: 320px;">
        <ResizeObserver @notify="handleResize" :showTrigger="true"/>
      </div>
    </n-card>
  </n-space>
</template>

<script>
import {shallowRef, onMounted} from "vue"
import {
  NSpace, NStatistic, NNumberAnimation, NCard, NTime,
} from 'naive-ui'
import { ResizeObserver } from 'vue3-resize'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features';

export default {
  name: "RoomStatic",
  props: {
    roomInfo: Object,
    roomLog: Array,
  },
  components: {
    NSpace, NStatistic, NNumberAnimation, NCard, NTime,
    ResizeObserver,
  },
  setup(props) {
    const roomLog = props.roomLog.map(log => {
      return {
        power: log.power,
        log_time: new Date(log.log_time)
      }
    }).sort((a, b) =>
        a.log_time.getTime() - b.log_time.getTime()
    )
    const roomLogChart = shallowRef(null)
    onMounted(() => {
      echarts.use([SVGRenderer, LineChart, GridComponent, UniversalTransition])
      roomLogChart.value = echarts.init(document.getElementById("roomLogChart"))
      roomLogChart.value.setOption({
        xAxis: {
          type: 'time',
          boundaryGap: false,
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: roomLog.map(log => [log.log_time, log.power]),
            type: 'line',
            smooth: true,
            areaStyle: {},
            animationDuration: 500,
          }
        ]
      })
    })
    return {
      handleResize ({ width, height }) {
        console.log(width, height)
        if (roomLogChart.value)
          roomLogChart.value.resize()
      }
    }
  },
}
</script>

<style scoped>
@import 'vue3-resize/dist/vue3-resize.css';
</style>
