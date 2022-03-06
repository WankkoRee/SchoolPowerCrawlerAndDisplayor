<template>
  <n-card :title="title" hoverable>
    <n-grid :x-gap="8" :y-gap="8" cols="1">
      <n-grid-item v-for="(roomInfo, index) in data" :key="index">
        <span>
          {{ {0: '🥇', 1: '🥈', 2:'🥉'}[index] || '' }} {{ roomInfo.area }} の {{ roomInfo.building }} の {{ roomInfo.room }}
        </span>
        <n-progress type="line" :processing="true" :color="{0: '#ffd666', 1: '#bfbfbf', 2: '#d46b08'}[index] || '#66ccff'" indicator-placement="outside" :percentage="roomInfo.power / data[0].power * 100">
          {{ -roomInfo.power }} {{ unit }}
        </n-progress>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>

<script>
import {NCard, NGrid, NGridItem, NProgress} from "naive-ui";

export default {
  name: "RoomsRank",
  props: {
    title: String,
    data: Array,
    unit: String,
  },
  components: {
    NCard, NGrid, NGridItem, NProgress,
  },
  setup() {
    return {
    }
  }
}
</script>

<style scoped>

</style>