<template>
  <n-card>
    <div ref="chartDiv" style="height: 320px"></div>
    <resize-observer @notify="handleResize" :showTrigger="true" />
  </n-card>
</template>

<script lang="ts">
export default {
  name: "RoomsChart",
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

import { colors } from "@/utils";
import { getRoomLogs, getRoomDailys } from "@/api";

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
import { getRoomSpendings } from "@/api";

const props = defineProps<{
  type: string;
  rooms: RoomPosition[];
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
    },
  },
  xAxis: {
    type: "time",
    boundaryGap: false,
  },
  yAxis: {
    type: "value",
  },
  series: [],
  grid: {
    left: "3%",
    right: "4%",
    bottom: "10%",
    containLabel: true,
  },
  color: colors,
  backgroundColor: "rgba(255,255,255,0)", // 透明
};

const chartDiv = ref<HTMLInputElement>();
const chartInstance = shallowRef<ECharts>();

watch(themeName, (newThemeName) => {
  initChart(chartInstance, chartDiv.value!, { light: "vintage", dark: "dark" }[newThemeName], options);
});

function handleResize() {
  chartInstance.value?.resize();
}

const lastRooms: RoomPosition[] = [];
async function refresh(clear: boolean = false) {
  if (clear) {
    ((options.legend as LegendComponentOption).data as string[]).splice(0);
    (options.series as LineSeriesOption[]).splice(0);
    lastRooms.splice(0);
  }

  const removedRooms = lastRooms.filter(
    (room) => !props.rooms.map((r) => `${r.area}/${r.building}/${r.room}`).includes(`${room.area}/${room.building}/${room.room}`)
  );
  const addedRooms = props.rooms.filter(
    (room) => !lastRooms.map((r) => `${r.area}/${r.building}/${r.room}`).includes(`${room.area}/${room.building}/${room.room}`)
  );

  // 处理 removedRooms
  removedRooms.forEach((room) => {
    const index = ((options.legend as LegendComponentOption).data as string[]).indexOf(room.room);
    ((options.legend as LegendComponentOption).data as string[]).splice(index, 1);
    (options.series as LineSeriesOption[]).splice(index, 1);
  });

  // 处理 addedRooms
  const roomsName = addedRooms.map((room) => room.room);
  ((options.legend as LegendComponentOption).data as string[]).push(...roomsName);
  if (props.type === "电量") {
    const roomsLogs = await Promise.all(addedRooms.map((room) => getRoomLogs(room.area, room.building, room.room)));
    (options.series as LineSeriesOption[]).push(...generateSeries(roomsName, roomsLogs));
  } else if (props.type === "用电量") {
    const roomsLogs = await Promise.all(addedRooms.map((room) => getRoomSpendings(room.area, room.building, room.room)));
    (options.series as LineSeriesOption[]).push(
      ...generateSeries(
        roomsName,
        roomsLogs.map((roomLogs) => roomLogs.map(({ ts, spending }) => ({ ts: ts, power: spending })))
      )
    );
  } else if (props.type === "日用电量") {
    const roomsLogs = await Promise.all(addedRooms.map((room) => getRoomDailys(room.area, room.building, room.room)));
    (options.series as LineSeriesOption[]).push(
      ...generateSeries(
        roomsName,
        roomsLogs.map((roomLogs) => roomLogs.map(({ ts, spending }) => ({ ts: ts, power: spending })))
      )
    );
  }

  chartInstance.value!.setOption(options, true, false);

  lastRooms.splice(0);
  lastRooms.push(...props.rooms);
}

onMounted(async () => {
  initChart(chartInstance, chartDiv.value!, { light: "vintage", dark: "dark" }[themeName.value], options);
  options.title = { text: props.type };
  await refresh();
});

watch(
  () => props.rooms,
  async () => {
    await refresh();
  }
);
</script>

<style scoped></style>
