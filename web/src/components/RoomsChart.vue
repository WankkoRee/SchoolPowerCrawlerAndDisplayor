<template>
  <n-card hoverable>
    <div :id="chartName" style="height: 320px;">
      <ResizeObserver @notify="handleResize" :showTrigger="true"/>
    </div>
  </n-card>
</template>

<script>
import {shallowRef, onMounted, watch} from "vue"
import {
  NCard,
} from 'naive-ui'
import { ResizeObserver } from 'vue3-resize'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, GridComponent, TooltipComponent, ToolboxComponent, LegendComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features';

export default {
  name: "RoomsChart",
  props: {
    theme: String,
    roomsName: Array,
    roomsLog: Array,
    chartName: String,
  },
  components: {
    NCard,
    ResizeObserver,
  },
  setup(props) {
    console.log("setup")
    const generateSeries = () => {
      return props.roomsName.map((roomName, i) => { return {roomName, roomLog: props.roomsLog[i]} }).map((room) => { return {
        name: room.roomName,
        data: room.roomLog.map(log => [log.log_time, log.power]),
        type: 'line',
        smooth: true,
        animationDuration: 500,
      } })
    }
    const options = {
      title: {
        text: props.chartName
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: null
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
      },
      yAxis: {
        type: 'value'
      },
      series: null,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      backgroundColor: 'rgba(255,255,255,0)' // 透明
    }

    const roomsLogChart = shallowRef(null)
    echarts.use([SVGRenderer, LineChart, TitleComponent, GridComponent, TooltipComponent, ToolboxComponent, LegendComponent, UniversalTransition])
    const initChart = (theme) => {
      if (roomsLogChart.value)
        echarts.dispose(roomsLogChart.value)
      roomsLogChart.value = echarts.init(document.getElementById(props.chartName), theme)
      options.legend.data = props.roomsName
      options.series = generateSeries()
      roomsLogChart.value.setOption(options)
    }

    watch(() => props.theme, (theme) => {
      console.log("watch props.theme")
      initChart(theme === "🌙" ? 'dark' : 'vintage')
    })

    watch(() => JSON.stringify([props.roomsName, props.roomsLog]), () => {
      console.log("watch props.rooms")
      // roomsLogChart.value.clear()
      options.legend.data = props.roomsName
      options.series = generateSeries()
      roomsLogChart.value.setOption(options, true, false)
    })

    onMounted(() => {
      console.log("onMounted")
      initChart(props.theme === "🌙" ? 'dark' : 'vintage')
    })

    return {
      handleResize ({ width, height }) {
        console.log(width, height)
        if (roomsLogChart.value)
          roomsLogChart.value.resize()
      }
    }
  },
}
</script>

<style scoped>
@import 'vue3-resize/dist/vue3-resize.css';
</style>