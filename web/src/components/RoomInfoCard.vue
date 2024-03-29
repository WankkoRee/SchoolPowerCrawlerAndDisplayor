<template>
  <n-card :header-style="cardHeaderStyle" hoverable>
    <template #header>
      <n-h2 style="margin-bottom: 0">{{ room.room }}</n-h2>
    </template>
    <template #header-extra>
      <n-space align="center" justify="end">
        <n-tooltip v-if="compare" :show-arrow="false" trigger="hover">
          <template #trigger>
            <n-button text style="font-size: 24px" @click="() => compareRoom(router, room.area, room.building, room.room)">
              <n-icon>
                <layers-outline />
              </n-icon>
            </n-button>
          </template>
          添加 {{ room.room }} 到寝室对比
        </n-tooltip>
        <n-tooltip v-if="refresh" :show-arrow="false" trigger="hover">
          <template #trigger>
            <n-button text style="font-size: 24px" @click="refreshData">
              <n-icon>
                <arrow-clockwise-24-regular />
              </n-icon>
            </n-button>
          </template>
          刷新 {{ room.room }} 的数据
        </n-tooltip>
        <n-tooltip v-if="onRemove" :show-arrow="false" trigger="hover">
          <template #trigger>
            <n-button text style="font-size: 24px" @click="onRemove ? onRemove() : () => {}">
              <n-icon>
                <eye-off-outline />
              </n-icon>
            </n-button>
          </template>
          取消对 {{ room.room }} 的对比
        </n-tooltip>
        <n-popover placement="left" trigger="hover">
          <template #trigger>
            <n-tag round :bordered="false">
              <template #icon>
                <n-icon>
                  <cloud-download-outline />
                </n-icon>
              </template>
              <n-skeleton v-if="loading" text :width="62" round />
              <n-time v-else :time="roomLastData.ts" type="relative" />
            </n-tag>
          </template>
          <span>数据同步于：</span>
          <n-skeleton v-if="loading" text :width="138" round />
          <n-time v-else :time="roomLastData.ts" type="datetime" />
        </n-popover>
      </n-space>
    </template>
    <n-grid :cols="3">
      <n-grid-item>
        <n-popover placement="top" :delay="500" trigger="hover">
          <template #trigger>
            <n-statistic label="今日用电" tabular-nums>
              <n-skeleton v-if="loading" text :width="60" :sharp="false" />
              <n-number-animation v-else ref="spendingDay" :from="0" :to="roomSumDay.spending" :duration="500" :active="true" :precision="2" />
              <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
            </n-statistic>
          </template>
          <span>从 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomSumDay.from" type="datetime" />
          </b>
          <br />
          <span>到 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomSumDay.to" type="datetime" />
          </b>
          <br />
          <span>共 </span>
          <b>
            <n-skeleton v-if="loading" text :width="30" round />
            <span v-else>{{ timeInterval(roomSumDay.from, roomSumDay.to) }}</span>
          </b>
        </n-popover>
      </n-grid-item>
      <n-grid-item>
        <n-popover placement="top" :delay="500" trigger="hover">
          <template #trigger>
            <n-statistic label="本周用电" tabular-nums>
              <n-skeleton v-if="loading" text :width="60" :sharp="false" />
              <n-number-animation v-else ref="remainingPower" :from="0" :to="roomSumWeek.spending" :duration="500" :active="true" :precision="2" />
              <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
            </n-statistic>
          </template>
          <span>从 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomSumWeek.from" type="datetime" />
          </b>
          <br />
          <span>到 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomSumWeek.to" type="datetime" />
          </b>
          <br />
          <span>共 </span>
          <b>
            <n-skeleton v-if="loading" text :width="30" round />
            <span v-else>{{ timeInterval(roomSumWeek.from, roomSumWeek.to) }}</span>
          </b>
        </n-popover>
      </n-grid-item>
      <n-grid-item>
        <n-popover placement="top" :delay="500" trigger="hover">
          <template #trigger>
            <n-statistic label="本月用电" tabular-nums>
              <n-skeleton v-if="loading" text :width="60" :sharp="false" />
              <n-number-animation v-else ref="spendingDay" :from="0" :to="roomSumMonth.spending" :duration="500" :active="true" :precision="2" />
              <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
            </n-statistic>
          </template>
          <span>从 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomSumMonth.from" type="datetime" />
          </b>
          <br />
          <span>到 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomSumMonth.to" type="datetime" />
          </b>
          <br />
          <span>共 </span>
          <b>
            <n-skeleton v-if="loading" text :width="30" round />
            <span v-else>{{ timeInterval(roomSumMonth.from, roomSumMonth.to) }}</span>
          </b>
        </n-popover>
      </n-grid-item>
      <n-grid-item>
        <n-popover placement="top" :delay="500" trigger="hover">
          <template #trigger>
            <n-statistic label="剩余电量" tabular-nums>
              <n-skeleton v-if="loading" text :width="60" :sharp="false" />
              <n-number-animation v-else ref="remainingPower" :from="0" :to="roomLastData.power" :duration="500" :active="true" :precision="2" />
              <template #suffix><span style="font-size: var(--n-label-font-size)">kWh</span></template>
            </n-statistic>
          </template>
          <span>过去30天日均用电量为 </span>
          <b>
            <n-skeleton v-if="loading" text :width="40" round />
            <span v-else>{{ roomAvgLast30d.spending.toFixed(2) }}</span>
          </b>
          <span> kWh/d</span>
          <br />
          <span>预计可用 </span>
          <b>
            <n-skeleton v-if="loading" text :width="30" round />
            <span v-else>{{ Math.floor(roomLastData.power / roomAvgLast30d.spending) }}</span>
          </b>
          <span> 天</span>
        </n-popover>
      </n-grid-item>
      <n-grid-item>
        <n-popover placement="top" :delay="500" trigger="hover">
          <template #trigger>
            <n-statistic label="本周日均用电" tabular-nums>
              <n-skeleton v-if="loading" text :width="60" :sharp="false" />
              <n-number-animation v-else ref="avgWeek" :from="0" :to="roomAvgWeek.spending" :duration="500" :active="true" :precision="2" />
              <template #suffix><span style="font-size: var(--n-label-font-size)">kWh/d</span></template>
            </n-statistic>
          </template>
          <span>从 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomAvgWeek.from" type="datetime" />
          </b>
          <br />
          <span>到 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomAvgWeek.to" type="datetime" />
          </b>
          <br />
          <span>共 </span>
          <b>
            <n-skeleton v-if="loading" text :width="30" round />
            <span v-else>{{ timeInterval(roomAvgWeek.from, roomAvgWeek.to) }}</span>
          </b>
        </n-popover>
      </n-grid-item>
      <n-grid-item>
        <n-popover placement="top" :delay="500" trigger="hover">
          <template #trigger>
            <n-statistic label="本月日均用电" tabular-nums>
              <n-skeleton v-if="loading" text :width="60" :sharp="false" />
              <n-number-animation v-else ref="avgMonth" :from="0" :to="roomAvgMonth.spending" :duration="500" :active="true" :precision="2" />
              <template #suffix><span style="font-size: var(--n-label-font-size)">kWh/d</span></template>
            </n-statistic>
          </template>
          <span>从 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomAvgMonth.from" type="datetime" />
          </b>
          <br />
          <span>到 </span>
          <b>
            <n-skeleton v-if="loading" text :width="145" round />
            <n-time v-else :time="roomAvgMonth.to" type="datetime" />
          </b>
          <br />
          <span>共 </span>
          <b>
            <n-skeleton v-if="loading" text :width="30" round />
            <span v-else>{{ timeInterval(roomAvgMonth.from, roomAvgMonth.to) }}</span>
          </b>
        </n-popover>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>

<script lang="ts">
export default {
  name: "RoomInfoCard",
};

import { ref, onMounted } from "vue";
import type { CSSProperties } from "vue";
import { useRouter } from "vue-router";

import { getRoomLastData, getRoomSumDuring, getRoomAvgDuring } from "@/api";
import { roomNameRegex } from "@/utils";
</script>

<script lang="ts" setup>
import { NStatistic, NNumberAnimation, NCard, NTime, NPopover, NGrid, NGridItem, NButton, NIcon, NTag, NTooltip, NSkeleton, NH2, NSpace } from "naive-ui";
import { EyeOffOutline, CloudDownloadOutline, LayersOutline } from "@vicons/ionicons5";
import { ArrowClockwise24Regular } from "@vicons/fluent";

import { compareRoom } from "@/utils";

const props = defineProps<{
  room: RoomPosition;
  cardHeaderStyle?: string | CSSProperties;
  onRemove?: () => Promise<any> | any;
  refresh?: boolean;
  compare?: boolean;
}>();

const router = useRouter();

const loading = ref(true);
const roomLastData = ref(<RoomPowerData>{});
const roomSumDay = ref(<RoomStatisticalData>{});
const roomSumWeek = ref(<RoomStatisticalData>{});
const roomSumMonth = ref(<RoomStatisticalData>{});
const roomAvgWeek = ref(<RoomStatisticalData>{});
const roomAvgMonth = ref(<RoomStatisticalData>{});
const roomAvgLast30d = ref(<RoomStatisticalData>{});

function timeInterval(from: Timestamp, to: Timestamp): string {
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

async function refreshData() {
  loading.value = true;
  [roomLastData.value, roomSumDay.value, roomSumWeek.value, roomSumMonth.value, roomAvgWeek.value, roomAvgMonth.value, roomAvgLast30d.value] =
    await Promise.all([
      getRoomLastData(props.room.area, props.room.building, props.room.room),
      getRoomSumDuring(props.room.area, props.room.building, props.room.room, "day"),
      getRoomSumDuring(props.room.area, props.room.building, props.room.room, "week"),
      getRoomSumDuring(props.room.area, props.room.building, props.room.room, "month"),
      getRoomAvgDuring(props.room.area, props.room.building, props.room.room, "week"),
      getRoomAvgDuring(props.room.area, props.room.building, props.room.room, "month"),
      getRoomAvgDuring(props.room.area, props.room.building, props.room.room, "last30d"),
    ]);
  loading.value = false;
}

onMounted(async () => {
  await refreshData();
});
</script>

<style scoped></style>
