<template>
  <n-space vertical>
    <n-card :title="roomName" hoverable>
      <template #header-extra>
        <n-time :time="roomInfo.update_time" type="relative" />
      </template>
      <n-space justify="space-around">
        <n-statistic label="剩余电量" tabular-nums>
          <n-number-animation
              ref="remainingPower"
              :from="0"
              :to="roomInfo.power"
              :duration="500"
              :active="true"
              :precision="2"
          />
          <template #suffix>
            kWh
          </template>
        </n-statistic>
        <n-statistic label="本周日均用电量" tabular-nums>
          <n-number-animation
              ref="avgUsed"
              :from="0"
              :to="-roomInfo.avg_day_this_week"
              :duration="500"
              :active="true"
              :precision="2"
          />
          <template #suffix>
            kWh/d
          </template>
        </n-statistic>
      </n-space>
    </n-card>
  </n-space>
</template>

<script>
import {
  NSpace, NStatistic, NNumberAnimation, NCard, NTime,
} from 'naive-ui'

export default {
  name: "RoomStatic",
  props: {
    roomInfo: Object,
    roomName: String,
  },
  components: {
    NSpace, NStatistic, NNumberAnimation, NCard, NTime,
  },
  setup(props) {
    console.log(props)
    return {
    }
  },
}
</script>

<style scoped>

</style>
