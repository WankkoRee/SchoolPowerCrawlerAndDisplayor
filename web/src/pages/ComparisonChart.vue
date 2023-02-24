<template>
  <n-space vertical>
    <n-cascader
      placeholder="请选择要查询的寝室"
      :options="roomsOption"
      :cascade="true"
      multiple
      check-strategy="child"
      clearable
      remote
      separator=" > "
      size="large"
      max-tag-count="responsive"
      v-model:value="roomsSelect"
      @load="handleRoomsLoad"
      @update:value="handleRoomsSelect"
      :disabled="roomsSelectLoading"
    />
    <n-empty v-if="!roomsSelected.length" description="要不咱先选几个寝室看看数据？" />
    <n-space v-if="roomsSelected.length" vertical>
      <n-grid :x-gap="8" :y-gap="8" cols="1 800:2 1200:3 1600:4 2000:5">
        <n-grid-item v-for="(roomPath, index) in roomsSelected" :key="roomPath">
          <RoomInfo
            :cardStyle="`background-color: ${colors[index % colors.length]}77`"
            :roomInfo="roomsData[roomPath].roomInfo"
            :roomData="roomsData[roomPath].roomData"
          />
        </n-grid-item>
      </n-grid>
      <n-grid :x-gap="8" :y-gap="8" cols="1">
        <n-grid-item>
          <RoomsChart
            chartName="电量"
            :roomsName="roomsSelected.map((roomPath) => roomsData[roomPath].roomInfo.fullName)"
            :roomsLogs="roomsSelected.map((roomPath) => roomsData[roomPath].roomLogs)"
          />
        </n-grid-item>
        <n-grid-item>
          <RoomsChart
            chartName="用电量"
            :roomsName="roomsSelected.map((roomPath) => roomsData[roomPath].roomInfo.fullName)"
            :roomsLogs="roomsSelected.map((roomPath) => roomsData[roomPath].roomSpendings)"
          />
        </n-grid-item>
        <n-grid-item>
          <RoomsChart
            chartName="日均用电量"
            :roomsName="roomsSelected.map((roomPath) => roomsData[roomPath].roomInfo.fullName)"
            :roomsLogs="roomsSelected.map((roomPath) => roomsData[roomPath].roomDailys)"
          />
        </n-grid-item>
      </n-grid>
    </n-space>
  </n-space>
</template>

<script lang="ts">
export default {
  name: "ComparisonChart",
};
import { ref, onMounted } from "vue";
import type { CascaderOption, TreeSelectOption } from "naive-ui";

import { getAreas, getBuildings, getRooms, getRoomInfo, getRoomSumDuring, getRoomAvgDuring, getRoomLogs, getRoomDailys } from "@/api";
import { messageApi } from "@/utils";

type Option = CascaderOption | TreeSelectOption;
</script>

<script setup lang="ts">
import { NSpace, NCascader, NEmpty, NGrid, NGridItem } from "naive-ui";

import RoomInfo from "@/components/RoomInfo.vue";
import RoomsChart from "@/components/RoomsChart.vue";
import { colors } from "@/utils";

const roomsOption = ref<Option[]>([]);
const roomsSelect = ref<string[]>([]);
const roomsSelected = ref<string[]>([]);
const roomsSelectLoading = ref(false);
const roomsData: {
  [key: string]: {
    roomInfo: {
      area: string;
      building: string;
      room: string;
      path: string;
      fullName: string;
    };
    roomData: {
      ts: Date;
      power: number;
      spendingDay: number;
      spendingWeek: number;
      spendingMonth: number;
      avgWeek: number;
      avgMonth: number;
    };
    roomLogs: { ts: Date; power: number }[];
    roomSpendings: { ts: Date; power: number }[];
    roomDailys: { ts: Date; power: number }[];
  };
} = {};

onMounted(async () => {
  const areas = await getAreas();
  roomsOption.value.splice(0, roomsOption.value.length); // roomsOption.value.clear()
  roomsOption.value = areas.map<Option>((area) => ({
    label: area,
    value: area,
    key: area,
    depth: 1,
    isLeaf: false,
  }));
});

async function handleRoomsLoad(option: Option) {
  if (option.depth === 1) {
    const areaPath = (option.value || option.key)!.toString();
    const buildings = await getBuildings(areaPath);
    option.children = buildings.map<Option>((building) => ({
      label: building,
      value: `${areaPath}/${building}`,
      key: `${areaPath}/${building}`,
      depth: 2,
      isLeaf: false,
    }));
  } else if (option.depth === 2) {
    const buildingPath = (option.value || option.key)!.toString();
    const rooms = await getRooms(buildingPath);
    option.children = rooms.map<Option>((room) => ({
      label: room,
      value: `${buildingPath}/${room}`,
      key: `${buildingPath}/${room}`,
      depth: 3,
      isLeaf: true,
    }));
  }
}

async function handleRoomsSelect(value: string[]) {
  // 预处理
  roomsSelectLoading.value = true;
  roomsOption.value.forEach((buildings) => {
    buildings.disabled = true;
    if (buildings.children)
      buildings.children.forEach((rooms) => {
        rooms.disabled = true;
        if (rooms.children)
          rooms.children.forEach((room) => {
            room.disabled = true;
          });
      });
  });
  // 处理
  const tmpSelected = [...value];

  roomsSelect.value.splice(0, roomsSelect.value.length); // == roomsSelect.value.clear()
  roomsSelect.value.push(...roomsSelected.value);

  const maxLimit = 8;
  if (tmpSelected.length > maxLimit) {
    messageApi.value!.warning(`最多选择${maxLimit}个，你尝试选择的寝室有${tmpSelected.length}个，已超出范围`, { keepAliveOnHover: true });
  } else {
    await showRooms(tmpSelected);
  }
  // 后处理
  roomsOption.value.forEach((buildings) => {
    buildings.disabled = false;
    if (buildings.children)
      buildings.children.forEach((rooms) => {
        rooms.disabled = false;
        if (rooms.children)
          rooms.children.forEach((room) => {
            room.disabled = false;
          });
      });
  });
  roomsSelectLoading.value = false;
}

async function showRooms(rooms: string[]) {
  const deleted = roomsSelected.value.filter((roomPath) => !rooms.includes(roomPath));
  const added = rooms.filter((roomPath) => !roomsSelected.value.includes(roomPath));

  // 处理 deleted
  roomsSelected.value = roomsSelected.value.filter((roomPath) => !deleted.includes(roomPath));
  roomsSelect.value = roomsSelect.value.filter((roomPath) => !deleted.includes(roomPath));

  // 处理 added
  for (const roomPath of added) {
    if (Object.keys(roomsData).indexOf(roomPath) === -1) {
      try {
        const [roomInfo, roomSumDay, roomSumWeek, roomSumMonth, roomAvgWeek, roomAvgMonth, roomLogs, roomDailys] = await Promise.all([
          getRoomInfo(roomPath),
          getRoomSumDuring(roomPath, "day"),
          getRoomSumDuring(roomPath, "week"),
          getRoomSumDuring(roomPath, "month"),
          getRoomAvgDuring(roomPath, "week"),
          getRoomAvgDuring(roomPath, "month"),
          getRoomLogs(roomPath),
          getRoomDailys(roomPath),
        ]);

        roomsData[roomPath] = {
          roomInfo: {
            area: roomInfo.area,
            building: roomInfo.building,
            room: roomInfo.room,
            path: roomPath,
            fullName: `${roomInfo.area} > ${roomInfo.building} > ${roomInfo.room}`,
          },
          roomData: {
            ts: new Date(roomInfo.ts),
            power: roomInfo.power,
            spendingDay: roomSumDay,
            spendingWeek: roomSumWeek,
            spendingMonth: roomSumMonth,
            avgWeek: roomAvgWeek,
            avgMonth: roomAvgMonth,
          },
          roomLogs: roomLogs.map(({ ts, power }) => ({ ts: new Date(ts), power })),
          roomSpendings: roomLogs.filter(({ spending }) => spending >= 0).map(({ ts, spending }) => ({ ts: new Date(ts), power: spending })),
          roomDailys: roomDailys.map(({ ts, spending }) => ({ ts: new Date(ts), power: spending })),
        };
      } catch {
        continue;
      }
    }
    roomsSelected.value.push(roomPath); // add新选中的寝室
    roomsSelect.value.push(roomPath);
  }
}
</script>

<style scoped></style>
