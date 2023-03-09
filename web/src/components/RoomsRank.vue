<template>
  <n-grid :x-gap="8" :y-gap="8" cols="1">
    <n-grid-item v-for="(roomData, index) in data" :key="index">
      <n-button
        v-if="roomData.area && roomData.building && roomData.room"
        text
        @click="() => compareRoom(router, roomData.area, roomData.building, roomData.room)"
      >
        {{ index + 1 }}.
        {{ roomData.area }}
        {{ roomData.building ? ` > ${roomData.building}` : "" }}
        {{ roomData.room ? ` > ${roomData.room}` : "" }}
      </n-button>
      <span v-else>
        {{ index + 1 }}.
        {{ roomData.area }}
        {{ roomData.building ? ` > ${roomData.building}` : "" }}
        {{ roomData.room ? ` > ${roomData.room}` : "" }}
      </span>
      <n-progress
        type="line"
        :processing="true"
        :color="{ 0: '#ffdd80', 1: '#cccccc', 2: '#d49d6a' }[index] || '#66ccff'"
        indicator-placement="outside"
        :percentage="(roomData.spending / data[0].spending) * 100"
      >
        {{ roomData.spending.toFixed(2) }} {{ unit }}
      </n-progress>
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts">
export default {
  name: "RoomsRank",
};

import { useRouter } from "vue-router";
</script>

<script lang="ts" setup>
import { NGrid, NGridItem, NProgress, NButton } from "naive-ui";

import { compareRoom } from "@/utils";

const props = defineProps<{
  data: RankData[];
  unit: string;
}>();

const router = useRouter();
</script>

<style scoped></style>
