<template>
  <n-grid :x-gap="8" :y-gap="8" cols="1">
    <n-grid-item v-for="(roomInfo, index) in data" :key="index">
      <span>
        {{ {0: '🥇', 1: '🥈', 2:'🥉'}[index] || '' }} {{ ["area", "building", "room"].includes(type)?roomInfo.area:'' }}{{ ["building", "room"].includes(type)?` の ${roomInfo.building}`:'' }}{{ ["room"].includes(type)?` の ${roomInfo.room}`:'' }}
      </span>
      <n-progress type="line" :processing="true" :color="{0: '#ffd666', 1: '#bfbfbf', 2: '#d46b08'}[index] || '#66ccff'" indicator-placement="outside" :percentage="roomInfo.power / data[0].power * 100">
        {{ -roomInfo.power }} {{ unit }}
      </n-progress>
    </n-grid-item>
  </n-grid>
</template>

<script>
import {NGrid, NGridItem, NProgress} from "naive-ui";

export default {
  name: "RoomsRank",
  props: {
    data: Array,
    type: String,
    unit: String,
  },
  components: {
    NGrid, NGridItem, NProgress,
  },
  setup() {
    return {
    }
  }
}
</script>

<style scoped>

</style>