<template>
  <n-space vertical>
    <n-card :title="roomInfo.fullName" :header-style="cardStyle" hoverable>
      <template #header-extra>
        <n-popover trigger="hover">
          <template #trigger>
            <n-time :time="roomData.ts" type="relative" />
          </template>
          <n-time :time="roomData.ts" type="datetime" />
        </n-popover>
      </template>
      <n-grid :cols="3">
        <n-grid-item>
          <n-statistic label="今日用电" tabular-nums>
            <n-number-animation ref="spendingDay" :from="0" :to="roomData.spendingDay" :duration="500" :active="true" :precision="2" />
            <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="本周用电" tabular-nums>
            <n-number-animation ref="remainingPower" :from="0" :to="roomData.spendingWeek" :duration="500" :active="true" :precision="2" />
            <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="本月用电" tabular-nums>
            <n-number-animation ref="spendingDay" :from="0" :to="roomData.spendingMonth" :duration="500" :active="true" :precision="2" />
            <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="剩余电量" tabular-nums>
            <n-number-animation ref="remainingPower" :from="0" :to="roomData.power" :duration="500" :active="true" :precision="2" />
            <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="本周日均用电" tabular-nums>
            <n-number-animation ref="avgWeek" :from="0" :to="roomData.avgWeek" :duration="500" :active="true" :precision="2" />
            <template #suffix><span style="font-size: var(--n-label-font-size)">kWh/d</span></template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="本月日均用电" tabular-nums>
            <n-number-animation ref="avgMonth" :from="0" :to="roomData.avgMonth" :duration="500" :active="true" :precision="2" />
            <template #suffix><span style="font-size: var(--n-label-font-size)">kWh/d</span></template>
          </n-statistic>
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
import { NSpace, NStatistic, NNumberAnimation, NCard, NTime, NPopover, NGrid, NGridItem } from "naive-ui";

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
    spendingDay: number;
    spendingWeek: number;
    spendingMonth: number;
    avgWeek: number;
    avgMonth: number;
  };
}>();
</script>

<style scoped></style>
