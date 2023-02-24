<template>
  <n-grid :x-gap="8" :y-gap="8" cols="6" item-responsive>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <rooms-rank :data="dailyTopUsed" :range="dailyTopUsedType" unit="kWh" />
        <template #header>
          <n-space align="center" justify="space-between">
            <span>今日用电量Top</span>
            <n-space align="center" justify="end" :size="[0, 0]">
              <n-input-number
                style="width: 72px"
                v-model:value="dailyTopUsedLimit"
                :update-value-on-input="false"
                :show-button="false"
                placeholder="3"
                :min="1"
                :max="20"
                @update:value="dailyTopUsedTypeUpdate"
              >
                <template #prefix>前</template>
                <template #suffix>的</template>
              </n-input-number>
              <n-radio-group v-model:value="dailyTopUsedType" @update:value="dailyTopUsedTypeUpdate">
                <n-radio-button value="area">校区</n-radio-button>
                <n-radio-button value="building">宿舍楼</n-radio-button>
                <n-radio-button value="room">寝室</n-radio-button>
              </n-radio-group>
            </n-space>
          </n-space>
        </template>
      </n-card>
    </n-grid-item>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <rooms-rank :data="weeklyTopUsed" :range="weeklyTopUsedType" unit="kWh" />
        <template #header>
          <n-space align="center" justify="space-between">
            <span>本周用电量Top</span>
            <n-space align="center" justify="end" :size="[0, 0]">
              <n-input-number
                style="width: 72px"
                v-model:value="weeklyTopUsedLimit"
                :update-value-on-input="false"
                :show-button="false"
                placeholder="3"
                :min="1"
                :max="20"
                @update:value="weeklyTopUsedTypeUpdate"
              >
                <template #prefix>前</template>
                <template #suffix>的</template>
              </n-input-number>
              <n-radio-group v-model:value="weeklyTopUsedType" @update:value="weeklyTopUsedTypeUpdate">
                <n-radio-button value="area">校区</n-radio-button>
                <n-radio-button value="building">宿舍楼</n-radio-button>
                <n-radio-button value="room">寝室</n-radio-button>
              </n-radio-group>
            </n-space>
          </n-space>
        </template>
      </n-card>
    </n-grid-item>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <rooms-rank :data="weeklyTopAvg" :range="weeklyTopAvgType" unit="kWh/d" />
        <template #header>
          <n-space align="center" justify="space-between">
            <span>本周日均用电量Top</span>
            <n-space align="center" justify="end" :size="[0, 0]">
              <n-input-number
                style="width: 72px"
                v-model:value="weeklyTopAvgLimit"
                :update-value-on-input="false"
                :show-button="false"
                placeholder="3"
                :min="1"
                :max="20"
                @update:value="weeklyTopAvgTypeUpdate"
              >
                <template #prefix>前</template>
                <template #suffix>的</template>
              </n-input-number>
              <n-radio-group v-model:value="weeklyTopAvgType" @update:value="weeklyTopAvgTypeUpdate">
                <n-radio-button value="area">校区</n-radio-button>
                <n-radio-button value="building">宿舍楼</n-radio-button>
                <n-radio-button value="room">寝室</n-radio-button>
              </n-radio-group>
            </n-space>
          </n-space>
        </template>
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts">
export default {
  name: "SpendingRank",
};
import { onMounted, ref } from "vue";

import { getRankSumRangeDuring, getRankDailyAvgRangeDuring } from "@/api";

type Range = "area" | "building" | "room";
type RankData = { area: string; building?: string; room?: string; spending: number };
</script>

<script lang="ts" setup>
import { NGrid, NGridItem, NCard, NInputNumber, NRadioGroup, NRadioButton, NSpace } from "naive-ui";

import RoomsRank from "@/components/RoomsRank.vue";

const dailyTopUsed = ref<RankData[]>([]);
const dailyTopUsedType = ref<Range>("room");
const dailyTopUsedLimit = ref(3);
const weeklyTopUsed = ref<RankData[]>([]);
const weeklyTopUsedType = ref<Range>("room");
const weeklyTopUsedLimit = ref(3);
const weeklyTopAvg = ref<RankData[]>([]);
const weeklyTopAvgType = ref<Range>("room");
const weeklyTopAvgLimit = ref(3);

async function dailyTopUsedTypeUpdate() {
  dailyTopUsed.value = await getRankSumRangeDuring(dailyTopUsedType.value, "day", dailyTopUsedLimit.value);
}
async function weeklyTopUsedTypeUpdate() {
  weeklyTopUsed.value = await getRankSumRangeDuring(weeklyTopUsedType.value, "week", weeklyTopUsedLimit.value);
}
async function weeklyTopAvgTypeUpdate() {
  weeklyTopAvg.value = await getRankDailyAvgRangeDuring(weeklyTopAvgType.value, "week", weeklyTopAvgLimit.value);
}

onMounted(async () => {
  await Promise.all([dailyTopUsedTypeUpdate(), weeklyTopUsedTypeUpdate(), weeklyTopAvgTypeUpdate()]);
});
</script>

<style scoped></style>
