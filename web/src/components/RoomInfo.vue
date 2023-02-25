<template>
  <n-space vertical>
    <n-card :title="roomInfo.fullName" :header-style="cardStyle" hoverable>
      <template #header-extra>
        <n-tooltip :show-arrow="false" trigger="hover">
          <template #trigger>
            <n-button text style="font-size: 24px" @click="emit('remove')">
              <n-icon>
                <eye-off-outline />
              </n-icon>
            </n-button>
          </template>
          取消对 {{ roomInfo.room }} 的对比
        </n-tooltip>
      </template>
      <template #footer>
        <n-popover placement="right" trigger="hover">
          <template #trigger>
            <n-tag round :bordered="false">
              <n-time :time="roomData.ts" type="relative" />
              <template #icon>
                <n-icon>
                  <cloud-download-outline />
                </n-icon>
              </template>
            </n-tag>
          </template>
          数据同步于：<n-time :time="roomData.ts" type="datetime" />
        </n-popover>
      </template>
      <n-grid :cols="3">
        <n-grid-item>
          <n-popover placement="top" :delay="500" trigger="hover">
            <template #trigger>
              <n-statistic label="今日用电" tabular-nums>
                <n-number-animation ref="spendingDay" :from="0" :to="roomData.spendingDay.spending" :duration="500" :active="true" :precision="2" />
                <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
              </n-statistic>
            </template>
            从
            <b><n-time :time="roomData.spendingDay.from" type="datetime" /></b>
            <br />
            到
            <b><n-time :time="roomData.spendingDay.to" type="datetime" /></b>
            <br />
            共
            <b>{{ timeInterval(roomData.spendingDay.from, roomData.spendingDay.to) }}</b>
          </n-popover>
        </n-grid-item>
        <n-grid-item>
          <n-popover placement="top" :delay="500" trigger="hover">
            <template #trigger>
              <n-statistic label="本周用电" tabular-nums>
                <n-number-animation ref="remainingPower" :from="0" :to="roomData.spendingWeek.spending" :duration="500" :active="true" :precision="2" />
                <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
              </n-statistic>
            </template>
            从
            <b><n-time :time="roomData.spendingWeek.from" type="datetime" /></b>
            <br />
            到
            <b><n-time :time="roomData.spendingWeek.to" type="datetime" /></b>
            <br />
            共
            <b>{{ timeInterval(roomData.spendingWeek.from, roomData.spendingWeek.to) }}</b>
          </n-popover>
        </n-grid-item>
        <n-grid-item>
          <n-popover placement="top" :delay="500" trigger="hover">
            <template #trigger>
              <n-statistic label="本月用电" tabular-nums>
                <n-number-animation ref="spendingDay" :from="0" :to="roomData.spendingMonth.spending" :duration="500" :active="true" :precision="2" />
                <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
              </n-statistic>
            </template>
            从
            <b><n-time :time="roomData.spendingMonth.from" type="datetime" /></b>
            <br />
            到
            <b><n-time :time="roomData.spendingMonth.to" type="datetime" /></b>
            <br />
            共
            <b>{{ timeInterval(roomData.spendingMonth.from, roomData.spendingMonth.to) }}</b>
          </n-popover>
        </n-grid-item>
        <n-grid-item>
          <n-popover placement="top" :delay="500" trigger="hover">
            <template #trigger>
              <n-statistic label="剩余电量" tabular-nums>
                <n-number-animation ref="remainingPower" :from="0" :to="roomData.power" :duration="500" :active="true" :precision="2" />
                <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
              </n-statistic>
            </template>
            过去30天日均用电量为 <b>{{ roomData.avgLast30d.spending.toFixed(2) }}</b> kWh/d
            <br />
            预计可用 <b>{{ Math.floor(roomData.power / roomData.avgLast30d.spending) }}</b> 天
          </n-popover>
        </n-grid-item>
        <n-grid-item>
          <n-popover placement="top" :delay="500" trigger="hover">
            <template #trigger>
              <n-statistic label="本周日均用电" tabular-nums>
                <n-number-animation ref="avgWeek" :from="0" :to="roomData.avgWeek.spending" :duration="500" :active="true" :precision="2" />
                <template #suffix><span style="font-size: var(--n-label-font-size)">kWh/d</span></template>
              </n-statistic>
            </template>
            从
            <b><n-time :time="roomData.avgWeek.from" type="datetime" /></b>
            <br />
            到
            <b><n-time :time="roomData.avgWeek.to" type="datetime" /></b>
            <br />
            共
            <b>{{ timeInterval(roomData.avgWeek.from, roomData.avgWeek.to) }}</b>
          </n-popover>
        </n-grid-item>
        <n-grid-item>
          <n-popover placement="top" :delay="500" trigger="hover">
            <template #trigger>
              <n-statistic label="本月日均用电" tabular-nums>
                <n-number-animation ref="avgMonth" :from="0" :to="roomData.avgMonth.spending" :duration="500" :active="true" :precision="2" />
                <template #suffix><span style="font-size: var(--n-label-font-size)">kWh/d</span></template>
              </n-statistic>
            </template>
            从
            <b><n-time :time="roomData.avgMonth.from" type="datetime" /></b>
            <br />
            到
            <b><n-time :time="roomData.avgMonth.to" type="datetime" /></b>
            <br />
            共
            <b>{{ timeInterval(roomData.avgMonth.from, roomData.avgMonth.to) }}</b>
          </n-popover>
        </n-grid-item>
      </n-grid>
    </n-card>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "RoomInfo",
};
</script>

<script lang="ts" setup>
import { NSpace, NStatistic, NNumberAnimation, NCard, NTime, NPopover, NGrid, NGridItem, NButton, NIcon, NTag, NTooltip } from "naive-ui";
import { EyeOffOutline, CloudDownloadOutline } from "@vicons/ionicons5";

const props = defineProps<{
  cardStyle: string;
  roomInfo: {
    area: string;
    building: string;
    room: string;
    path: string;
    fullName: string;
  };
  roomData: {
    ts: Date;
    power: number;
    spendingDay: { from: number; to: number; spending: number };
    spendingWeek: { from: number; to: number; spending: number };
    spendingMonth: { from: number; to: number; spending: number };
    avgWeek: { from: number; to: number; spending: number };
    avgMonth: { from: number; to: number; spending: number };
    avgLast30d: { from: number; to: number; spending: number };
  };
}>();
const emit = defineEmits<{
  (e: "remove"): void;
}>();

function timeInterval(from: number, to: number): string {
  let result = "";
  let interval = to - from;
  if (interval < 0) {
    result += "-";
    interval = -interval;
  }
  result += [
    { s: "毫秒", v: 1000 },
    { s: "秒", v: 60 },
    { s: "分", v: 60 },
    { s: "时", v: 24 },
  ]
    .map(({ s, v }, u) => {
      const vv = interval % v;
      interval = Math.floor(interval / v);
      if (vv > 0) return `${vv}${s}`;
      else return "";
    })
    .concat(interval > 0 ? [`${interval}天`] : [])
    .reverse()
    .join("");
  return result;
}
</script>

<style scoped></style>
