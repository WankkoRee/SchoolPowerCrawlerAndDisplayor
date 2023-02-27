<template>
  <n-grid :x-gap="8" :y-gap="8" cols="6" item-responsive>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <rooms-rank :data="dailyTopUsed" :range="dailyTopUsedType" unit="kWh" />
        <template #header>
          <n-space align="center" justify="space-between">
            <span>今日用电量Top</span>
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="dailyTopUsedRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleDailyTopUsedRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
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
                    <n-radio-button value="area" :disabled="dailyTopUsedTypeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="dailyTopUsedTypeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
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
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="weeklyTopUsedRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleWeeklyTopUsedRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
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
                    <n-radio-button value="area" :disabled="weeklyTopUsedTypeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="weeklyTopUsedTypeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
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
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="weeklyTopAvgRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleWeeklyTopAvgRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
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
                    <n-radio-button value="area" :disabled="weeklyTopAvgTypeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="weeklyTopAvgTypeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
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
import { useStorage } from "@vueuse/core";
import type { TreeSelectOption } from "naive-ui";

import { getAreas, getBuildings, getRankSumRangeDuring, getRankSumRangeDuringInArea, getRankSumRangeDuringInBuilding, getRankDailyAvgRangeDuring } from "@/api";

type Range = "area" | "building" | "room";
type RankData = { area: string; building?: string; room?: string; spending: number };
</script>

<script lang="ts" setup>
import { NGrid, NGridItem, NCard, NInputNumber, NRadioGroup, NRadioButton, NSpace, NTreeSelect } from "naive-ui";

import RoomsRank from "@/components/RoomsRank.vue";

const rangeOption = ref<TreeSelectOption[]>([
  {
    label: "学校",
    value: "学校",
    key: "学校",
    depth: 1,
    isLeaf: false,
  },
]);

const dailyTopUsed = ref<RankData[]>([]);
const dailyTopUsedType = useStorage<Range>("SpendingRank_dailyTopUsedType", "room");
const dailyTopUsedLimit = useStorage("SpendingRank_dailyTopUsedLimit", 3);
const dailyTopUsedRangeSelect = ref("学校");
const dailyTopUsedRangeSelectDepth = ref(1);
const dailyTopUsedTypeAreaDisabled = ref(false);
const dailyTopUsedTypeBuildingDisabled = ref(false);

const weeklyTopUsed = ref<RankData[]>([]);
const weeklyTopUsedType = useStorage<Range>("SpendingRank_weeklyTopUsedType", "room");
const weeklyTopUsedLimit = useStorage("SpendingRank_weeklyTopUsedLimit", 3);
const weeklyTopUsedRangeSelect = ref("学校");
const weeklyTopUsedRangeSelectDepth = ref(1);
const weeklyTopUsedTypeAreaDisabled = ref(false);
const weeklyTopUsedTypeBuildingDisabled = ref(false);

const weeklyTopAvg = ref<RankData[]>([]);
const weeklyTopAvgType = useStorage<Range>("SpendingRank_weeklyTopAvgType", "room");
const weeklyTopAvgLimit = useStorage("SpendingRank_weeklyTopAvgLimit", 3);
const weeklyTopAvgRangeSelect = ref("学校");
const weeklyTopAvgRangeSelectDepth = ref(1);
const weeklyTopAvgTypeAreaDisabled = ref(false);
const weeklyTopAvgTypeBuildingDisabled = ref(false);

async function rangeLoad(option: TreeSelectOption) {
  if (option.depth === 1) {
    const areas = await getAreas();
    option.children = areas.map<TreeSelectOption>((area) => ({
      label: area,
      value: `${area}`,
      key: `${area}`,
      depth: 2,
      isLeaf: false,
    }));
  } else if (option.depth === 2) {
    const areaPath = (option.value || option.key)!.toString();
    const buildings = await getBuildings(areaPath);
    option.children = buildings.map<TreeSelectOption>((building) => ({
      label: building,
      value: `${areaPath}/${building}`,
      key: `${areaPath}/${building}`,
      depth: 3,
      isLeaf: true,
    }));
  }
}

async function handleDailyTopUsedRangeSelect(value: string, option: TreeSelectOption) {
  if (option.depth === 1) {
    dailyTopUsedRangeSelectDepth.value = 1;
    dailyTopUsedTypeAreaDisabled.value = false;
    dailyTopUsedTypeBuildingDisabled.value = false;
    await dailyTopUsedTypeUpdate();
  } else if (option.depth === 2) {
    dailyTopUsedRangeSelectDepth.value = 2;
    dailyTopUsedTypeAreaDisabled.value = true;
    dailyTopUsedTypeBuildingDisabled.value = false;
    if (dailyTopUsedType.value === "area") dailyTopUsedType.value = "building";
    await dailyTopUsedTypeUpdate();
  } else if (option.depth === 3) {
    dailyTopUsedRangeSelectDepth.value = 3;
    dailyTopUsedTypeAreaDisabled.value = true;
    dailyTopUsedTypeBuildingDisabled.value = true;
    if (dailyTopUsedType.value === "area" || dailyTopUsedType.value === "building") dailyTopUsedType.value = "room";
    await dailyTopUsedTypeUpdate();
  }
}

async function handleWeeklyTopUsedRangeSelect(value: string, option: TreeSelectOption) {
  if (option.depth === 1) {
    weeklyTopUsedRangeSelectDepth.value = 1;
    weeklyTopUsedTypeAreaDisabled.value = false;
    weeklyTopUsedTypeBuildingDisabled.value = false;
    await weeklyTopUsedTypeUpdate();
  } else if (option.depth === 2) {
    weeklyTopUsedRangeSelectDepth.value = 2;
    weeklyTopUsedTypeAreaDisabled.value = true;
    weeklyTopUsedTypeBuildingDisabled.value = false;
    if (weeklyTopUsedType.value === "area") weeklyTopUsedType.value = "building";
    await weeklyTopUsedTypeUpdate();
  } else if (option.depth === 3) {
    weeklyTopUsedRangeSelectDepth.value = 3;
    weeklyTopUsedTypeAreaDisabled.value = true;
    weeklyTopUsedTypeBuildingDisabled.value = true;
    if (weeklyTopUsedType.value === "area" || weeklyTopUsedType.value === "building") weeklyTopUsedType.value = "room";
    await weeklyTopUsedTypeUpdate();
  }
}

async function handleWeeklyTopAvgRangeSelect(value: string, option: TreeSelectOption) {
  if (option.depth === 1) {
    weeklyTopAvgRangeSelectDepth.value = 1;
    weeklyTopAvgTypeAreaDisabled.value = false;
    weeklyTopAvgTypeBuildingDisabled.value = false;
    await weeklyTopAvgTypeUpdate();
  } else if (option.depth === 2) {
    weeklyTopAvgRangeSelectDepth.value = 2;
    weeklyTopAvgTypeAreaDisabled.value = true;
    weeklyTopAvgTypeBuildingDisabled.value = false;
    if (weeklyTopAvgType.value === "area") weeklyTopAvgType.value = "building";
    await weeklyTopAvgTypeUpdate();
  } else if (option.depth === 3) {
    weeklyTopAvgRangeSelectDepth.value = 3;
    weeklyTopAvgTypeAreaDisabled.value = true;
    weeklyTopAvgTypeBuildingDisabled.value = true;
    if (weeklyTopAvgType.value === "area" || weeklyTopAvgType.value === "building") weeklyTopAvgType.value = "room";
    await weeklyTopAvgTypeUpdate();
  }
}

async function dailyTopUsedTypeUpdate() {
  if (dailyTopUsedRangeSelectDepth.value === 1) {
    dailyTopUsed.value = await getRankSumRangeDuring(dailyTopUsedType.value, "day", dailyTopUsedLimit.value);
  } else if (dailyTopUsedRangeSelectDepth.value === 2) {
    dailyTopUsed.value = await getRankSumRangeDuringInArea(dailyTopUsedType.value, "day", dailyTopUsedLimit.value, dailyTopUsedRangeSelect.value);
  } else if (dailyTopUsedRangeSelectDepth.value === 3) {
    const [area, building] = dailyTopUsedRangeSelect.value.split("/");
    dailyTopUsed.value = await getRankSumRangeDuringInBuilding(dailyTopUsedType.value, "day", dailyTopUsedLimit.value, area, building);
  }
}
async function weeklyTopUsedTypeUpdate() {
  if (weeklyTopUsedRangeSelectDepth.value === 1) {
    weeklyTopUsed.value = await getRankSumRangeDuring(weeklyTopUsedType.value, "week", weeklyTopUsedLimit.value);
  } else if (weeklyTopUsedRangeSelectDepth.value === 2) {
    weeklyTopUsed.value = await getRankSumRangeDuringInArea(weeklyTopUsedType.value, "week", weeklyTopUsedLimit.value, weeklyTopUsedRangeSelect.value);
  } else if (weeklyTopUsedRangeSelectDepth.value === 3) {
    const [area, building] = weeklyTopUsedRangeSelect.value.split("/");
    weeklyTopUsed.value = await getRankSumRangeDuringInBuilding(weeklyTopUsedType.value, "week", weeklyTopUsedLimit.value, area, building);
  }
}
async function weeklyTopAvgTypeUpdate() {
  if (weeklyTopAvgRangeSelectDepth.value === 1) {
    weeklyTopAvg.value = await getRankDailyAvgRangeDuring(weeklyTopAvgType.value, "week", weeklyTopAvgLimit.value);
  } else if (weeklyTopAvgRangeSelectDepth.value === 2) {
    weeklyTopAvg.value = await getRankSumRangeDuringInArea(weeklyTopAvgType.value, "week", weeklyTopAvgLimit.value, weeklyTopAvgRangeSelect.value);
  } else if (weeklyTopAvgRangeSelectDepth.value === 3) {
    const [area, building] = weeklyTopAvgRangeSelect.value.split("/");
    weeklyTopAvg.value = await getRankSumRangeDuringInBuilding(weeklyTopAvgType.value, "week", weeklyTopAvgLimit.value, area, building);
  }
}

onMounted(async () => {
  await Promise.all([dailyTopUsedTypeUpdate(), weeklyTopUsedTypeUpdate(), weeklyTopAvgTypeUpdate()]);
});
</script>

<style scoped></style>
