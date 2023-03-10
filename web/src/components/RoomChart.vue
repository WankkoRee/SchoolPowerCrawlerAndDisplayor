<template>
  <div ref="chartCard" style="height: 320px">
    <n-card style="height: 100%">
      <div ref="chartDiv" style="height: 100%"></div>
      <resize-observer @notify="handleResize" :showTrigger="true" />
    </n-card>
  </div>
</template>

<script lang="ts">
export default {
  name: "RoomChart",
};

import { ref, shallowRef, onMounted, watch, inject } from "vue";
import type { Ref, ShallowRef } from "vue";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import type { LineSeriesOption } from "echarts/charts";
import { TitleComponent, GridComponent, TooltipComponent, ToolboxComponent, LegendComponent } from "echarts/components";
import type { TitleComponentOption, GridComponentOption, TooltipComponentOption, ToolboxComponentOption, LegendComponentOption } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { UniversalTransition } from "echarts/features";
import screenfull from "screenfull";
import moment from "moment";
import "moment/dist/locale/zh-cn";

import { colors, messageApi } from "@/utils";
import { getRoomLogs, getRoomDailys } from "@/api";

type Option = echarts.ComposeOption<
  LineSeriesOption | TitleComponentOption | GridComponentOption | TooltipComponentOption | ToolboxComponentOption | LegendComponentOption
>;

echarts.use([CanvasRenderer, LineChart, TitleComponent, GridComponent, TooltipComponent, ToolboxComponent, LegendComponent, UniversalTransition]);
moment.locale("zh-cn");

function generateSeries(seriesName: string[], seriesLogs: RoomPowerData[][], multiXAxis: boolean = false): LineSeriesOption[] {
  return seriesName
    .map((seryName, i) => ({ seryName, seryLogs: seriesLogs[i] }))
    .map((room, i) => ({
      name: room.seryName,
      data: room.seryLogs.map((log) => [log.ts, log.power]),
      type: "line",
      smooth: true, // 平滑
      animationDuration: 500,
      sampling: "lttb", // 降采样
      xAxisIndex: multiXAxis ? i : 0,
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
import { getRoomSpendings } from "@/api";

const props = defineProps<{
  type: string;
  room: RoomPosition;
}>();

const themeName = inject<Ref<ThemeName>>("v_themeName")!;

const options: Option = {
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985",
      },
    },
  },
  legend: {
    data: [],
    type: "scroll",
    left: "center",
    top: "bottom",
  },
  toolbox: {
    feature: {
      saveAsImage: {},
      myScreenFull: {
        title: "全屏",
        icon: "image://src/assets/images/fluent/FullScreenMaximize24Regular.svg",
        onclick: async () => {
          if (screenfull.isEnabled) {
            await screenfull.toggle(chartCard.value);
          } else {
            messageApi.value?.warning("似乎无法进入全屏，请检查相关权限");
          }
        },
      },
    },
  },
  xAxis: {
    type: "time",
  },
  yAxis: {
    type: "value",
  },
  series: [],
  color: colors,
  backgroundColor: "rgba(255,255,255,0)", // 透明
};

const chartCard = ref<HTMLElement>();
const chartDiv = ref<HTMLElement>();
const chartInstance = shallowRef<ECharts>();

watch(themeName, (newThemeName) => {
  initChart(chartInstance, chartDiv.value!, { light: "vintage", dark: "dark" }[newThemeName], options);
});

function handleResize() {
  chartInstance.value?.resize();
}

async function refresh() {
  if (props.type === "电量") {
    const roomLogs = await getRoomLogs(props.room.area, props.room.building, props.room.room);
    (options.legend as LegendComponentOption).data = [props.room.room];
    options.series = generateSeries([props.room.room], [roomLogs]);
  } else if (props.type === "用电量") {
    const roomSpendings = await getRoomSpendings(props.room.area, props.room.building, props.room.room);
    (options.legend as LegendComponentOption).data = [props.room.room];
    options.series = generateSeries([props.room.room], [roomSpendings.map(({ ts, spending }) => ({ ts: ts, power: spending }))]);
  } else if (props.type === "日用电量") {
    const roomSpendings = await getRoomDailys(props.room.area, props.room.building, props.room.room);
    (options.legend as LegendComponentOption).data = [props.room.room];
    options.series = generateSeries([props.room.room], [roomSpendings.map(({ ts, spending }) => ({ ts: ts, power: spending }))]);
  } else if (props.type === "每日用电量") {
    const roomSpendings = await getRoomSpendings(props.room.area, props.room.building, props.room.room);
    const DaysSpendings = new Map<number, RoomSpendingData[]>();
    roomSpendings.forEach((roomSpending) => {
      const day = Math.floor((roomSpending.ts + 28800000) / 86400000) * 86400000 - 28800000;
      if (!DaysSpendings.has(day)) DaysSpendings.set(day, []);
      DaysSpendings.get(day)!.push(roomSpending);
    });
    const seriesName = [...DaysSpendings.keys()].map((day) => moment(day).format("YYYY年MM月DD日 ddd"));
    (options.legend as LegendComponentOption).data = seriesName;
    options.xAxis = [...DaysSpendings.keys()].map((day) => ({
      show: false,
      type: "time",
      position: "bottom",
      min: day,
      max: day + 86400000,
      axisPointer: {
        label: {
          formatter: function (params) {
            return moment(params.value).format("ahh时");
          },
        },
      },
    }));
    options.xAxis.push({
      show: true,
      type: "time",
      position: "bottom",
      min: new Date().setHours(0, 0, 0, 0),
      max: new Date().setHours(24, 0, 0, 0),
      axisPointer: {
        label: {
          formatter: function (params) {
            return moment(params.value).format("ahh时");
          },
        },
      },
    });
    options.series = generateSeries(
      seriesName,
      [...DaysSpendings.values()].map((daySpendings) => daySpendings.map(({ ts, spending }) => ({ ts: ts, power: spending }))),
      true
    );
  }

  chartInstance.value!.setOption(options, true, false);
}

onMounted(async () => {
  initChart(chartInstance, chartDiv.value!, { light: "vintage", dark: "dark" }[themeName.value], options);
  options.title = { text: props.type };
  await refresh();
});
</script>

<style scoped></style>
