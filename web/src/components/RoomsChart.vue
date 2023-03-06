<template>
  <n-card>
    <div :id="chartName" style="height: 320px"></div>
    <resize-observer @notify="handleResize" :showTrigger="true" />
  </n-card>
</template>

<script lang="ts">
export default {
  name: "RoomsChart",
};

import { shallowRef, onMounted, watch, inject } from "vue";
import type { Ref, ShallowRef } from "vue";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import type { LineSeriesOption } from "echarts/charts";
import { TitleComponent, GridComponent, TooltipComponent, ToolboxComponent, LegendComponent } from "echarts/components";
import type { TitleComponentOption, GridComponentOption, TooltipComponentOption, ToolboxComponentOption, LegendComponentOption } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { UniversalTransition } from "echarts/features";

import { colors } from "@/utils";

type Option = echarts.ComposeOption<
  LineSeriesOption | TitleComponentOption | GridComponentOption | TooltipComponentOption | ToolboxComponentOption | LegendComponentOption
>;

echarts.use([CanvasRenderer, LineChart, TitleComponent, GridComponent, TooltipComponent, ToolboxComponent, LegendComponent, UniversalTransition]);

function generateSeries(roomsName: string[], roomsLogs: RoomPowerData[][]): LineSeriesOption[] {
  return roomsName
    .map((roomName, i) => ({ roomName, roomLogs: roomsLogs[i] }))
    .map((room) => ({
      name: room.roomName,
      data: room.roomLogs.map((log) => [log.ts, log.power]),
      type: "line",
      smooth: true,
      animationDuration: 500,
    }));
}

function initChart(chartInstance: ShallowRef<ECharts | undefined>, dom: HTMLElement, theme: string, options: Option) {
  if (chartInstance.value) echarts.dispose(chartInstance.value);
  chartInstance.value = echarts.init(dom, theme);
  chartInstance.value.setOption(options);
}
</script>

<script lang="ts" setup>
import { NCard } from "naive-ui";
import { ResizeObserver } from "vue3-resize";

const props = defineProps<{
  chartName: string;
  roomsName: string[];
  roomsLogs: RoomPowerData[][];
}>();
const themeName = inject<Ref<ThemeName>>("v_themeName")!;

const options: Option = {
  title: {
    text: props.chartName,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985",
      },
    },
  },
  legend: <LegendComponentOption>{
    data: props.roomsName,
    type: "scroll",
    left: "center",
    top: "bottom",
  },
  toolbox: {
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: {
    type: "time",
    boundaryGap: false,
  },
  yAxis: {
    type: "value",
  },
  series: generateSeries(props.roomsName, props.roomsLogs),
  grid: {
    left: "3%",
    right: "4%",
    bottom: "10%",
    containLabel: true,
  },
  color: colors,
  backgroundColor: "rgba(255,255,255,0)", // 透明
};

const chartInstance = shallowRef<ECharts>();

onMounted(() => {
  initChart(chartInstance, document.getElementById(props.chartName)!, { light: "vintage", dark: "dark" }[themeName.value], options);
});
watch(themeName, (newThemeName) => {
  initChart(chartInstance, document.getElementById(props.chartName)!, { light: "vintage", dark: "dark" }[newThemeName], options);
});
watch(
  () => JSON.stringify({ roomsName: props.roomsName, roomsLogs: props.roomsLogs }),
  () => {
    // chartInstance.value.clear()
    (options.legend! as LegendComponentOption).data = props.roomsName;
    options.series = generateSeries(props.roomsName, props.roomsLogs);
    chartInstance.value!.setOption(options, true, false);
  }
);

function handleResize() {
  chartInstance.value?.resize();
}
</script>

<style scoped></style>
