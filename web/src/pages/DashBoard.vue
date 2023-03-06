<template>
  <n-space style="width: 100%" item-style="width: 80%" align="center" justify="center">
    <n-grid style="width: 100%" item-responsive cols="6" :x-gap="8" :y-gap="8">
      <n-grid-item span="6 600:2">
        <n-card hoverable>
          <n-statistic label="已采集校区" tabular-nums>
            <template #prefix>
              <n-icon>
                <Board24Regular />
              </n-icon>
            </template>
            <n-number-animation :from="0" :to="areasCount" show-separator />
            <template #suffix>个</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item span="6 600:2">
        <n-card hoverable>
          <n-statistic label="已采集宿舍楼" tabular-nums>
            <template #prefix>
              <n-icon>
                <Building24Regular />
              </n-icon>
            </template>
            <n-number-animation :from="0" :to="buildingsCount" show-separator />
            <template #suffix>个</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item span="6 600:2">
        <n-card hoverable>
          <n-statistic label="已采集寝室" tabular-nums>
            <template #prefix>
              <n-icon>
                <ConferenceRoom24Regular />
              </n-icon>
            </template>
            <n-number-animation :from="0" :to="roomsCount" show-separator />
            <template #suffix>个</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item span="6 720:4 1000:3">
        <n-card hoverable>
          <n-statistic label="最后采集时间" tabular-nums>
            <template #prefix>
              <n-icon>
                <ClockArrowDownload24Regular />
              </n-icon>
            </template>
            <n-time :time="lastTime" type="relative" />，<n-time :time="lastTime" type="datetime" />
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item span="6 720:2 1000:3">
        <n-card hoverable>
          <n-statistic label="距下次采集" tabular-nums>
            <template #prefix>
              <n-icon>
                <Timer24Regular />
              </n-icon>
            </template>
            <n-countdown
              :precision="1"
              :duration="new Date(lastTime).setMinutes(lastTime.getMinutes() + 60) - new Date().getTime()"
              @finish="showRefresh = true"
            />
            <n-tooltip v-if="showRefresh" :show-arrow="false" trigger="hover">
              <template #trigger>
                <n-button text style="font-size: 24px" @click="refresh">
                  <n-icon>
                    <ArrowClockwise24Regular />
                  </n-icon>
                </n-button>
              </template>
              刷新页面
            </n-tooltip>
          </n-statistic>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "DashBoard",
};
import { ref, onMounted, inject } from "vue";

import { getLastTime, getRangeCount } from "@/api";
</script>

<script lang="ts" setup>
import { NSpace, NGrid, NGridItem, NCard, NStatistic, NNumberAnimation, NIcon, NCountdown, NTime, NButton, NTooltip } from "naive-ui";
import {
  Board24Regular,
  Building24Regular,
  ConferenceRoom24Regular,
  ClockArrowDownload24Regular,
  Timer24Regular,
  ArrowClockwise24Regular,
} from "@vicons/fluent";

const reload = inject<ReloadFunc>("f_reload")!;

const areasCount = ref(0);
const buildingsCount = ref(0);
const roomsCount = ref(0);
const lastTime = ref(new Date());
const showRefresh = ref(false);

async function refresh() {
  await reload();
}

onMounted(async () => {
  const [lastTime_, areasCount_, buildingsCount_, roomsCount_] = await Promise.all([
    getLastTime(),
    getRangeCount("area"),
    getRangeCount("building"),
    getRangeCount("room"),
  ]);
  lastTime.value = new Date(lastTime_);
  areasCount.value = areasCount_;
  buildingsCount.value = buildingsCount_;
  roomsCount.value = roomsCount_;
});
</script>

<style scoped></style>
