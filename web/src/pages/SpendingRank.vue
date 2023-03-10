<template>
  <n-grid :x-gap="8" :y-gap="8" cols="6" item-responsive>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <template #header>
          <n-space align="center" justify="space-between">
            <span>今日用电</span>
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  label-field="value_show"
                  key-field="value_fact"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="dayRankSumRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleDayRankSumRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
                <n-space align="center" justify="end" :size="[0, 0]">
                  <n-input-number
                    style="width: 72px; text-align: center"
                    v-model:value="dayRankSumLimit"
                    :update-value-on-input="false"
                    :show-button="false"
                    placeholder="3"
                    :min="1"
                    :max="20"
                    @update:value="dayRankSumRangeUpdate"
                  >
                    <template #prefix>前</template>
                    <template #suffix>的</template>
                  </n-input-number>
                  <n-radio-group v-model:value="dayRankSumRange" @update:value="dayRankSumRangeUpdate">
                    <n-radio-button value="area" :disabled="dayRankSumRangeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="dayRankSumRangeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
          </n-space>
        </template>
        <n-skeleton v-if="loading" width="100%" :height="200" :sharp="false" />
        <rooms-rank v-else :data="dayRankSum" unit="kWh" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <template #header>
          <n-space align="center" justify="space-between">
            <span>本周用电</span>
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  label-field="value_show"
                  key-field="value_fact"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="weekRankSumRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleWeekRankSumRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
                <n-space align="center" justify="end" :size="[0, 0]">
                  <n-input-number
                    style="width: 72px; text-align: center"
                    v-model:value="weekRankSumLimit"
                    :update-value-on-input="false"
                    :show-button="false"
                    placeholder="3"
                    :min="1"
                    :max="20"
                    @update:value="weekRankSumRangeUpdate"
                  >
                    <template #prefix>前</template>
                    <template #suffix>的</template>
                  </n-input-number>
                  <n-radio-group v-model:value="weekRankSumRange" @update:value="weekRankSumRangeUpdate">
                    <n-radio-button value="area" :disabled="weekRankSumRangeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="weekRankSumRangeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
          </n-space>
        </template>
        <n-skeleton v-if="loading" width="100%" :height="200" :sharp="false" />
        <rooms-rank v-else :data="weekRankSum" unit="kWh" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <template #header>
          <n-space align="center" justify="space-between">
            <span>本月用电</span>
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  label-field="value_show"
                  key-field="value_fact"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="monthRankSumRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleMonthRankSumRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
                <n-space align="center" justify="end" :size="[0, 0]">
                  <n-input-number
                    style="width: 72px; text-align: center"
                    v-model:value="monthRankSumLimit"
                    :update-value-on-input="false"
                    :show-button="false"
                    placeholder="3"
                    :min="1"
                    :max="20"
                    @update:value="monthRankSumRangeUpdate"
                  >
                    <template #prefix>前</template>
                    <template #suffix>的</template>
                  </n-input-number>
                  <n-radio-group v-model:value="monthRankSumRange" @update:value="monthRankSumRangeUpdate">
                    <n-radio-button value="area" :disabled="monthRankSumRangeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="monthRankSumRangeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
          </n-space>
        </template>
        <n-skeleton v-if="loading" width="100%" :height="200" :sharp="false" />
        <rooms-rank v-else :data="monthRankSum" unit="kWh" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <template #header>
          <n-space align="center" justify="space-between">
            <span>本周日均用电</span>
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  label-field="value_show"
                  key-field="value_fact"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="weekRankDailyAvgRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleWeekRankDailyAvgRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
                <n-space align="center" justify="end" :size="[0, 0]">
                  <n-input-number
                    style="width: 72px; text-align: center"
                    v-model:value="weekRankDailyAvgLimit"
                    :update-value-on-input="false"
                    :show-button="false"
                    placeholder="3"
                    :min="1"
                    :max="20"
                    @update:value="weekRankDailyAvgRangeUpdate"
                  >
                    <template #prefix>前</template>
                    <template #suffix>的</template>
                  </n-input-number>
                  <n-radio-group v-model:value="weekRankDailyAvgRange" @update:value="weekRankDailyAvgRangeUpdate">
                    <n-radio-button value="area" :disabled="weekRankDailyAvgRangeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="weekRankDailyAvgRangeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
          </n-space>
        </template>
        <n-skeleton v-if="loading" width="100%" :height="200" :sharp="false" />
        <rooms-rank v-else :data="weekRankDailyAvg" unit="kWh/d" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="6 600:3 900:2">
      <n-card hoverable>
        <template #header>
          <n-space align="center" justify="space-between">
            <span>本月日均用电</span>
            <n-grid :cols="1">
              <n-grid-item :span="1">
                <n-tree-select
                  placeholder="在 ... 中"
                  :options="rangeOption"
                  label-field="value_show"
                  key-field="value_fact"
                  :cascade="false"
                  check-strategy="all"
                  remote
                  :show-path="false"
                  separator=" > "
                  v-model:value="monthRankDailyAvgRangeSelect"
                  @load="rangeLoad"
                  @update:value="handleMonthRankDailyAvgRangeSelect"
                />
              </n-grid-item>
              <n-grid-item :span="1">
                <n-space align="center" justify="end" :size="[0, 0]">
                  <n-input-number
                    style="width: 72px; text-align: center"
                    v-model:value="monthRankDailyAvgLimit"
                    :update-value-on-input="false"
                    :show-button="false"
                    placeholder="3"
                    :min="1"
                    :max="20"
                    @update:value="monthRankDailyAvgRangeUpdate"
                  >
                    <template #prefix>前</template>
                    <template #suffix>的</template>
                  </n-input-number>
                  <n-radio-group v-model:value="monthRankDailyAvgRange" @update:value="monthRankDailyAvgRangeUpdate">
                    <n-radio-button value="area" :disabled="monthRankDailyAvgRangeAreaDisabled">校区</n-radio-button>
                    <n-radio-button value="building" :disabled="monthRankDailyAvgRangeBuildingDisabled">宿舍楼</n-radio-button>
                    <n-radio-button value="room">寝室</n-radio-button>
                  </n-radio-group>
                </n-space>
              </n-grid-item>
            </n-grid>
          </n-space>
        </template>
        <n-skeleton v-if="loading" width="100%" :height="200" :sharp="false" />
        <rooms-rank v-else :data="monthRankDailyAvg" unit="kWh/d" />
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

import {
  getAreas,
  getBuildings,
  getRankSumRangeDuring,
  getRankSumRangeDuringInArea,
  getRankSumRangeDuringInBuilding,
  getRankDailyAvgRangeDuring,
  getRankDailyAvgRangeDuringInArea,
  getRankDailyAvgRangeDuringInBuilding,
} from "@/api";
</script>

<script lang="ts" setup>
import { NGrid, NGridItem, NCard, NInputNumber, NRadioGroup, NRadioButton, NSpace, NTreeSelect, NSkeleton } from "naive-ui";

import RoomsRank from "@/components/RoomsRank.vue";

const loading = ref(true);

const rangeOption = ref<SelectorOption[]>([
  {
    value_show: "学校",
    value_fact: "学校",
    depth: 1,
    isLeaf: false,
    path: ["学校"],
  },
]);

const dayRankSum = ref<RankData[]>([]);
const dayRankSumRange = useStorage<RoomRange>("SpendingRank_dayRankSumRange", "room");
const dayRankSumLimit = useStorage("SpendingRank_dayRankSumLimit", 3);
const dayRankSumRangeSelect = ref("学校");
const dayRankSumRangeSelectDepth = ref(1);
const dayRankSumRangeAreaDisabled = ref(false);
const dayRankSumRangeBuildingDisabled = ref(false);

const weekRankSum = ref<RankData[]>([]);
const weekRankSumRange = useStorage<RoomRange>("SpendingRank_weekRankSumRange", "room");
const weekRankSumLimit = useStorage("SpendingRank_weekRankSumLimit", 3);
const weekRankSumRangeSelect = ref("学校");
const weekRankSumRangeSelectDepth = ref(1);
const weekRankSumRangeAreaDisabled = ref(false);
const weekRankSumRangeBuildingDisabled = ref(false);

const monthRankSum = ref<RankData[]>([]);
const monthRankSumRange = useStorage<RoomRange>("SpendingRank_monthRankSumRange", "room");
const monthRankSumLimit = useStorage("SpendingRank_monthRankSumLimit", 3);
const monthRankSumRangeSelect = ref("学校");
const monthRankSumRangeSelectDepth = ref(1);
const monthRankSumRangeAreaDisabled = ref(false);
const monthRankSumRangeBuildingDisabled = ref(false);

const weekRankDailyAvg = ref<RankData[]>([]);
const weekRankDailyAvgRange = useStorage<RoomRange>("SpendingRank_weekRankDailyAvgRange", "room");
const weekRankDailyAvgLimit = useStorage("SpendingRank_weekRankDailyAvgLimit", 3);
const weekRankDailyAvgRangeSelect = ref("学校");
const weekRankDailyAvgRangeSelectDepth = ref(1);
const weekRankDailyAvgRangeAreaDisabled = ref(false);
const weekRankDailyAvgRangeBuildingDisabled = ref(false);

const monthRankDailyAvg = ref<RankData[]>([]);
const monthRankDailyAvgRange = useStorage<RoomRange>("SpendingRank_monthRankDailyAvgRange", "room");
const monthRankDailyAvgLimit = useStorage("SpendingRank_monthRankDailyAvgLimit", 3);
const monthRankDailyAvgRangeSelect = ref("学校");
const monthRankDailyAvgRangeSelectDepth = ref(1);
const monthRankDailyAvgRangeAreaDisabled = ref(false);
const monthRankDailyAvgRangeBuildingDisabled = ref(false);

async function rangeLoad(option_: SelectorOption | TreeSelectOption) {
  // todo: 删除 TreeSelectOption
  const option = <SelectorOption>option_;
  if (option.depth === 1) {
    const areas = await getAreas();
    option.children = areas.map<SelectorOption>((area) => ({
      value_show: area,
      value_fact: `${area}`,
      depth: 2,
      isLeaf: false,
      path: [...option.path, area],
    }));
  } else if (option.depth === 2) {
    const areaPath = option.value_fact.toString();
    const buildings = await getBuildings(areaPath);
    option.children = buildings.map<SelectorOption>((building) => ({
      value_show: building,
      value_fact: `${areaPath}/${building}`,
      depth: 3,
      isLeaf: true,
      path: [...option.path, building],
    }));
  }
}

async function handleDayRankSumRangeSelect(value: string, option: SelectorOption) {
  if (option.depth === 1) {
    dayRankSumRangeSelectDepth.value = 1;
    dayRankSumRangeAreaDisabled.value = false;
    dayRankSumRangeBuildingDisabled.value = false;
    await dayRankSumRangeUpdate();
  } else if (option.depth === 2) {
    dayRankSumRangeSelectDepth.value = 2;
    dayRankSumRangeAreaDisabled.value = true;
    dayRankSumRangeBuildingDisabled.value = false;
    if (dayRankSumRange.value === "area") dayRankSumRange.value = "building";
    await dayRankSumRangeUpdate();
  } else if (option.depth === 3) {
    dayRankSumRangeSelectDepth.value = 3;
    dayRankSumRangeAreaDisabled.value = true;
    dayRankSumRangeBuildingDisabled.value = true;
    if (dayRankSumRange.value === "area" || dayRankSumRange.value === "building") dayRankSumRange.value = "room";
    await dayRankSumRangeUpdate();
  }
}
async function handleWeekRankSumRangeSelect(value: string, option: SelectorOption) {
  if (option.depth === 1) {
    weekRankSumRangeSelectDepth.value = 1;
    weekRankSumRangeAreaDisabled.value = false;
    weekRankSumRangeBuildingDisabled.value = false;
    await weekRankSumRangeUpdate();
  } else if (option.depth === 2) {
    weekRankSumRangeSelectDepth.value = 2;
    weekRankSumRangeAreaDisabled.value = true;
    weekRankSumRangeBuildingDisabled.value = false;
    if (weekRankSumRange.value === "area") weekRankSumRange.value = "building";
    await weekRankSumRangeUpdate();
  } else if (option.depth === 3) {
    weekRankSumRangeSelectDepth.value = 3;
    weekRankSumRangeAreaDisabled.value = true;
    weekRankSumRangeBuildingDisabled.value = true;
    if (weekRankSumRange.value === "area" || weekRankSumRange.value === "building") weekRankSumRange.value = "room";
    await weekRankSumRangeUpdate();
  }
}
async function handleMonthRankSumRangeSelect(value: string, option: SelectorOption) {
  if (option.depth === 1) {
    monthRankSumRangeSelectDepth.value = 1;
    monthRankSumRangeAreaDisabled.value = false;
    monthRankSumRangeBuildingDisabled.value = false;
    await monthRankSumRangeUpdate();
  } else if (option.depth === 2) {
    monthRankSumRangeSelectDepth.value = 2;
    monthRankSumRangeAreaDisabled.value = true;
    monthRankSumRangeBuildingDisabled.value = false;
    if (monthRankSumRange.value === "area") monthRankSumRange.value = "building";
    await monthRankSumRangeUpdate();
  } else if (option.depth === 3) {
    monthRankSumRangeSelectDepth.value = 3;
    monthRankSumRangeAreaDisabled.value = true;
    monthRankSumRangeBuildingDisabled.value = true;
    if (monthRankSumRange.value === "area" || monthRankSumRange.value === "building") monthRankSumRange.value = "room";
    await monthRankSumRangeUpdate();
  }
}
async function handleWeekRankDailyAvgRangeSelect(value: string, option: SelectorOption) {
  if (option.depth === 1) {
    weekRankDailyAvgRangeSelectDepth.value = 1;
    weekRankDailyAvgRangeAreaDisabled.value = false;
    weekRankDailyAvgRangeBuildingDisabled.value = false;
    await weekRankDailyAvgRangeUpdate();
  } else if (option.depth === 2) {
    weekRankDailyAvgRangeSelectDepth.value = 2;
    weekRankDailyAvgRangeAreaDisabled.value = true;
    weekRankDailyAvgRangeBuildingDisabled.value = false;
    if (weekRankDailyAvgRange.value === "area") weekRankDailyAvgRange.value = "building";
    await weekRankDailyAvgRangeUpdate();
  } else if (option.depth === 3) {
    weekRankDailyAvgRangeSelectDepth.value = 3;
    weekRankDailyAvgRangeAreaDisabled.value = true;
    weekRankDailyAvgRangeBuildingDisabled.value = true;
    if (weekRankDailyAvgRange.value === "area" || weekRankDailyAvgRange.value === "building") weekRankDailyAvgRange.value = "room";
    await weekRankDailyAvgRangeUpdate();
  }
}
async function handleMonthRankDailyAvgRangeSelect(value: string, option: SelectorOption) {
  if (option.depth === 1) {
    monthRankDailyAvgRangeSelectDepth.value = 1;
    monthRankDailyAvgRangeAreaDisabled.value = false;
    monthRankDailyAvgRangeBuildingDisabled.value = false;
    await monthRankDailyAvgRangeUpdate();
  } else if (option.depth === 2) {
    monthRankDailyAvgRangeSelectDepth.value = 2;
    monthRankDailyAvgRangeAreaDisabled.value = true;
    monthRankDailyAvgRangeBuildingDisabled.value = false;
    if (monthRankDailyAvgRange.value === "area") monthRankDailyAvgRange.value = "building";
    await monthRankDailyAvgRangeUpdate();
  } else if (option.depth === 3) {
    monthRankDailyAvgRangeSelectDepth.value = 3;
    monthRankDailyAvgRangeAreaDisabled.value = true;
    monthRankDailyAvgRangeBuildingDisabled.value = true;
    if (monthRankDailyAvgRange.value === "area" || monthRankDailyAvgRange.value === "building") monthRankDailyAvgRange.value = "room";
    await monthRankDailyAvgRangeUpdate();
  }
}

async function dayRankSumRangeUpdate() {
  if (dayRankSumRangeSelectDepth.value === 1) {
    dayRankSum.value = await getRankSumRangeDuring(dayRankSumRange.value, "day", dayRankSumLimit.value);
  } else if (dayRankSumRangeSelectDepth.value === 2) {
    dayRankSum.value = await getRankSumRangeDuringInArea(dayRankSumRange.value, "day", dayRankSumLimit.value, dayRankSumRangeSelect.value);
  } else if (dayRankSumRangeSelectDepth.value === 3) {
    const [area, building] = dayRankSumRangeSelect.value.split("/");
    dayRankSum.value = await getRankSumRangeDuringInBuilding(dayRankSumRange.value, "day", dayRankSumLimit.value, area, building);
  }
}
async function weekRankSumRangeUpdate() {
  if (weekRankSumRangeSelectDepth.value === 1) {
    weekRankSum.value = await getRankSumRangeDuring(weekRankSumRange.value, "week", weekRankSumLimit.value);
  } else if (weekRankSumRangeSelectDepth.value === 2) {
    weekRankSum.value = await getRankSumRangeDuringInArea(weekRankSumRange.value, "week", weekRankSumLimit.value, weekRankSumRangeSelect.value);
  } else if (weekRankSumRangeSelectDepth.value === 3) {
    const [area, building] = weekRankSumRangeSelect.value.split("/");
    weekRankSum.value = await getRankSumRangeDuringInBuilding(weekRankSumRange.value, "week", weekRankSumLimit.value, area, building);
  }
}
async function monthRankSumRangeUpdate() {
  if (monthRankSumRangeSelectDepth.value === 1) {
    monthRankSum.value = await getRankSumRangeDuring(monthRankSumRange.value, "month", monthRankSumLimit.value);
  } else if (monthRankSumRangeSelectDepth.value === 2) {
    monthRankSum.value = await getRankSumRangeDuringInArea(monthRankSumRange.value, "month", monthRankSumLimit.value, monthRankSumRangeSelect.value);
  } else if (monthRankSumRangeSelectDepth.value === 3) {
    const [area, building] = monthRankSumRangeSelect.value.split("/");
    monthRankSum.value = await getRankSumRangeDuringInBuilding(monthRankSumRange.value, "month", monthRankSumLimit.value, area, building);
  }
}
async function weekRankDailyAvgRangeUpdate() {
  if (weekRankDailyAvgRangeSelectDepth.value === 1) {
    weekRankDailyAvg.value = await getRankDailyAvgRangeDuring(weekRankDailyAvgRange.value, "week", weekRankDailyAvgLimit.value);
  } else if (weekRankDailyAvgRangeSelectDepth.value === 2) {
    weekRankDailyAvg.value = await getRankDailyAvgRangeDuringInArea(
      weekRankDailyAvgRange.value,
      "week",
      weekRankDailyAvgLimit.value,
      weekRankDailyAvgRangeSelect.value
    );
  } else if (weekRankDailyAvgRangeSelectDepth.value === 3) {
    const [area, building] = weekRankDailyAvgRangeSelect.value.split("/");
    weekRankDailyAvg.value = await getRankDailyAvgRangeDuringInBuilding(weekRankDailyAvgRange.value, "week", weekRankDailyAvgLimit.value, area, building);
  }
}
async function monthRankDailyAvgRangeUpdate() {
  if (monthRankDailyAvgRangeSelectDepth.value === 1) {
    monthRankDailyAvg.value = await getRankDailyAvgRangeDuring(monthRankDailyAvgRange.value, "month", monthRankDailyAvgLimit.value);
  } else if (monthRankDailyAvgRangeSelectDepth.value === 2) {
    monthRankDailyAvg.value = await getRankDailyAvgRangeDuringInArea(
      monthRankDailyAvgRange.value,
      "month",
      monthRankDailyAvgLimit.value,
      monthRankDailyAvgRangeSelect.value
    );
  } else if (monthRankDailyAvgRangeSelectDepth.value === 3) {
    const [area, building] = monthRankDailyAvgRangeSelect.value.split("/");
    monthRankDailyAvg.value = await getRankDailyAvgRangeDuringInBuilding(monthRankDailyAvgRange.value, "month", monthRankDailyAvgLimit.value, area, building);
  }
}

onMounted(async () => {
  await Promise.all([
    dayRankSumRangeUpdate(),
    weekRankSumRangeUpdate(),
    monthRankSumRangeUpdate(),
    weekRankDailyAvgRangeUpdate(),
    monthRankDailyAvgRangeUpdate(),
  ]);
  loading.value = false;
});
</script>

<style scoped></style>
