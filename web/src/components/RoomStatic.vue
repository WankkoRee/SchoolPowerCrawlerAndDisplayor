<template>
  <n-space vertical>
    <n-card :title="roomName" hoverable>
      <template #header-extra>
        <n-time :time="new Date(roomInfo.update_time ? roomInfo.update_time : 0)" type="relative" />
      </template>
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
