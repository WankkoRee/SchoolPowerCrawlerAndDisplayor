<template>
  <n-space vertical>
    <n-card :title="roomInfo.fullName" hoverable>
      <template #header-extra>
        <n-popover trigger="hover">
          <template #trigger>
            <n-time :time="roomData.ts" type="relative" />
          </template>
          <n-time :time="roomData.ts" type="datetime" />
        </n-popover>
      </template>
      <n-space justify="space-between">
        <n-space vertical>
          <n-statistic label="剩余电量" tabular-nums>
            <n-number-animation
                ref="remainingPower"
                :from="0"
                :to="roomData.power"
                :duration="500"
                :active="true"
                :precision="2"
            />
            <template #suffix>kWh</template>
          </n-statistic>
          <n-statistic label="今日用电量" tabular-nums>
            <n-number-animation
                ref="spendingDay"
                :from="0"
                :to="roomData.spendingDay"
                :duration="500"
                :active="true"
                :precision="2"
            />
            <template #suffix>kWh</template>
          </n-statistic>
        </n-space>
        <n-space vertical>
          <n-statistic label="本周日均用电量" tabular-nums>
            <n-number-animation
                ref="avgWeek"
                :from="0"
                :to="roomData.avgWeek"
                :duration="500"
                :active="true"
                :precision="2"
            />
            <template #suffix>kWh/d</template>
          </n-statistic>
          <n-statistic label="本月日均用电量" tabular-nums>
            <n-number-animation
                ref="avgMonth"
                :from="0"
                :to="roomData.avgMonth"
                :duration="500"
                :active="true"
                :precision="2"
            />
            <template #suffix>kWh/d</template>
          </n-statistic>
        </n-space>
      </n-space>
    </n-card>
  </n-space>
</template>

<script>
import {
  NSpace, NStatistic, NNumberAnimation, NCard, NTime, NPopover,
} from 'naive-ui'

export default {
  name: "RoomInfo",
  props: {
    roomInfo: Object,
    roomData: Object,
  },
  components: {
    NSpace, NStatistic, NNumberAnimation, NCard, NTime, NPopover,
  },
  setup() {
    return {
    }
  },
}
</script>

<style scoped>

</style>
