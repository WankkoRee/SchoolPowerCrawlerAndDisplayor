<template>
  <n-space vertical align="center" justify="center" :size="8">
    <n-grid :cols="1" item-responsive style="width: var(--container-width)">
      <n-grid-item span="0 904:1">
        <n-skeleton v-if="loading" width="100%" :height="40" :sharp="false" />
        <n-cascader
          v-else
          ref="roomsSelector"
          placeholder="请选择要查询的寝室"
          :options="roomsOption"
          label-field="value_show"
          value-field="value_fact"
          :cascade="true"
          multiple
          check-strategy="child"
          clearable
          remote
          :show-path="false"
          separator=" > "
          size="large"
          max-tag-count="responsive"
          v-model:value="roomsSelect"
          @load="handleRoomsLoad"
          @update:value="handleRoomsSelect"
          :disabled="roomsSelectLoading"
        />
      </n-grid-item>
      <n-grid-item span="1 904:0">
        <n-skeleton v-if="loading" width="100%" :height="40" :sharp="false" />
        <n-tree-select
          v-else
          ref="roomsSelector"
          placeholder="请选择要查询的寝室"
          :options="roomsOption"
          label-field="value_show"
          key-field="value_fact"
          checkable
          :cascade="false"
          multiple
          check-strategy="child"
          clearable
          :show-path="false"
          separator=" > "
          size="large"
          max-tag-count="responsive"
          v-model:value="roomsSelect"
          @load="handleRoomsLoad"
          @update:value="handleRoomsSelect"
          :disabled="roomsSelectLoading"
        />
      </n-grid-item>
    </n-grid>
    <n-space vertical align="center" justify="center" style="min-height: calc(var(--container-height) - 40px - 8px)">
      <n-empty v-if="!roomsSelected.length" description="要不咱先选几个寝室看看数据？" />
    </n-space>
    <n-space v-if="roomsSelected.length" vertical align="center" justify="center" item-style="width: var(--container-width)">
      <n-grid :x-gap="8" :y-gap="8" cols="1 800:2 1200:3 1600:4 2000:5">
        <n-grid-item v-for="(roomPath, index) in roomsSelected" :key="roomPath">
          <RoomInfoCard
            :cardStyle="`background: linear-gradient(
            ${colors[index % colors.length]}aa,
            ${colors[index % colors.length]}77,
            ${colors[index % colors.length]}44,
            #ffffff00)`"
            :area="roomsData[roomPath].area"
            :building="roomsData[roomPath].building"
            :room="roomsData[roomPath].room"
            :full-name="roomsData[roomPath].fullName"
            @remove="removeRooms([roomPath])"
          />
        </n-grid-item>
      </n-grid>
      <n-grid :x-gap="8" :y-gap="8" cols="1">
        <n-grid-item>
          <RoomsChart
            chartName="电量"
            :roomsName="roomsSelected.map((roomPath) => roomsData[roomPath].fullName)"
            :roomsLogs="roomsSelected.map((roomPath) => roomsData[roomPath].roomLogs)"
          />
        </n-grid-item>
        <n-grid-item>
          <RoomsChart
            chartName="用电量"
            :roomsName="roomsSelected.map((roomPath) => roomsData[roomPath].fullName)"
            :roomsLogs="roomsSelected.map((roomPath) => roomsData[roomPath].roomSpendings)"
          />
        </n-grid-item>
        <n-grid-item>
          <RoomsChart
            chartName="日用电量"
            :roomsName="roomsSelected.map((roomPath) => roomsData[roomPath].fullName)"
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
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Base64 } from "js-base64";
import type { CascaderInst, TreeSelectInst, TreeSelectOption } from "naive-ui";

import { getAreas, getBuildings, getRooms, getRoomLogs, getRoomDailys } from "@/api";
import { messageApi } from "@/utils";
</script>

<script setup lang="ts">
import { NSpace, NCascader, NTreeSelect, NEmpty, NGrid, NGridItem, NSkeleton } from "naive-ui";

import RoomInfoCard from "@/components/RoomInfoCard.vue";
import RoomsChart from "@/components/RoomsChart.vue";
import { colors } from "@/utils";

const route = useRoute();
const router = useRouter();

const loading = ref(true);

const roomsSelector = ref<CascaderInst | TreeSelectInst>();
const roomsOption = ref<SelectorOption[]>([]);
const roomsSelect = ref<string[]>([]);
const roomsSelected = ref<string[]>([]);
const roomsSelectLoading = ref(false);
const roomsData: {
  [key: string]: {
    area: string;
    building: string;
    room: string;
    fullName: string;
    roomLogs: RoomPowerData[];
    roomSpendings: RoomPowerData[];
    roomDailys: RoomPowerData[];
  };
} = {};

onMounted(async () => {
  const areas = await loadAreas();
  if (route.query.rooms)
    for (const newRoomSelected of <string[][]>JSON.parse(Base64.decode(<string>route.query.rooms))) {
      const area = areas.find((area) => area.value_show === newRoomSelected[0]);
      if (!area) continue;
      const buildings = await loadBuildings(area.path[0], area);
      const building = buildings.find((building) => building.value_show === newRoomSelected[1]);
      if (!building) continue;
      let rooms = await loadRooms(building.path[0], building.path[1], building);
      for (const range of newRoomSelected.slice(2)) {
        const room = rooms.find((room) => room.value_show === range);
        if (!room) break;
        if (room.children) rooms = room.children;
        else await addRooms([room.value_fact]);
      }
    }
  loading.value = false;
});

async function loadAreas(force: boolean = false): Promise<SelectorOption[]> {
  if (!force && roomsOption.value.length > 0) return roomsOption.value;

  const areas = await getAreas();
  roomsOption.value = areas.map<SelectorOption>((area) => ({
    value_show: area,
    value_fact: JSON.stringify([area]),
    depth: 1,
    isLeaf: false,
    path: [area],
  }));
  return roomsOption.value;
}

async function loadBuildings(area: string, parent: SelectorOption, force: boolean = false): Promise<SelectorOption[]> {
  if (!force && parent.children && parent.children.length > 0) return parent.children;

  const buildings = await getBuildings(area);
  parent.children = buildings.map<SelectorOption>((building) => ({
    value_show: building,
    value_fact: JSON.stringify([...parent.path, building]),
    depth: 2,
    isLeaf: false,
    path: [...parent.path, building],
  }));
  return parent.children;
}

async function loadRooms(area: string, building: string, parent: SelectorOption, force: boolean = false): Promise<SelectorOption[]> {
  if (!force && parent.children && parent.children.length > 0) return parent.children;

  const rooms = await getRooms(area, building);
  const roomClassified = new Map<string, Map<string, string[]>>();
  const roomUnclassified: string[] = [];
  rooms.forEach((room) => {
    const roomRegexResult = room.match(/^([A-Z\d]+)-(\d+?)(\d{2}(?:-.+?)?)$/);
    if (roomRegexResult === null) {
      console.warn(`${room} 无法匹配正则表达式 /^([A-Z\\d]+)-(\\d+?)(\\d{2}(?:-.+?)?)$/`);
      roomUnclassified.push(room);
    } else {
      const [b, l, r] = roomRegexResult.slice(1, 4);
      if (!roomClassified.has(b)) roomClassified.set(b, new Map());
      if (!roomClassified.get(b)!.has(l)) roomClassified.get(b)!.set(l, []);
      roomClassified.get(b)!.get(l)!.push(r);
    }
  });
  parent.children = <SelectorOption[]>[];
  if (roomUnclassified.length > 0) {
    parent.children.push({
      value_show: "未分类",
      value_fact: JSON.stringify([...parent.path, "未分类"]),
      depth: 3,
      isLeaf: false,
      path: [...parent.path, "未分类"],
      children: roomUnclassified.map((room) => ({
        value_show: room,
        value_fact: JSON.stringify([...parent.path, "未分类", room]),
        depth: 4,
        isLeaf: true,
        path: [...parent.path, "未分类", room],
      })),
    });
  }
  parent.children.push(
    ...Array.from(roomClassified).map(([b, l_]) => ({
      value_show: `${b}栋`,
      value_fact: JSON.stringify([...parent.path, `${b}栋`]),
      depth: 3,
      isLeaf: false,
      path: [...parent.path, `${b}栋`],
      children: Array.from(l_).map(([l, r_]) => ({
        value_show: `${b}-${l}层`,
        value_fact: JSON.stringify([...parent.path, `${b}栋`, `${b}-${l}层`]),
        depth: 4,
        isLeaf: false,
        path: [...parent.path, `${b}栋`, `${b}-${l}层`],
        children: Array.from(r_).map((r) => ({
          value_show: `${b}-${l}${r}`,
          value_fact: JSON.stringify([...parent.path, `${b}栋`, `${b}-${l}层`, `${b}-${l}${r}`]),
          depth: 5,
          isLeaf: true,
          path: [...parent.path, `${b}栋`, `${b}-${l}层`, `${b}-${l}${r}`],
        })),
      })),
    }))
  );
  return parent.children;
}

watch(
  () => [...roomsSelected.value],
  () => {
    router.replace({
      name: "ComparisonChart",
      query: { rooms: Base64.encodeURI(JSON.stringify(roomsSelector.value!.getCheckedData().options.map((option) => option!.path))) },
    });
  }
);

async function handleRoomsLoad(option_: SelectorOption | TreeSelectOption) {
  // todo: 删除 TreeSelectOption
  const option = <SelectorOption>option_;
  if (option.depth === 1) {
    await loadBuildings(option.path[0], option);
  } else if (option.depth === 2) {
    await loadRooms(option.path[0], option.path[1], option);
  }
}

async function handleRoomsSelect() {
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
  const tmpSelected = [...roomsSelect.value];

  // 先取消选中，直接改动 roomsSelect 不会触发本事件
  roomsSelect.value.splice(0, roomsSelect.value.length); // == roomsSelect.value.clear()
  roomsSelect.value.push(...roomsSelected.value);

  const maxLimit = 8;
  if (tmpSelected.length > maxLimit) {
    messageApi.value!.warning(`最多选择${maxLimit}个，你尝试选择的寝室有${tmpSelected.length}个，已超出范围`, { keepAliveOnHover: true });
  } else {
    // 对比选中情况
    const removedRooms = roomsSelected.value.filter((roomPath) => !tmpSelected.includes(roomPath));
    const addedRooms = tmpSelected.filter((roomPath) => !roomsSelected.value.includes(roomPath));
    // 处理 removed
    await removeRooms(removedRooms);
    // 处理 added
    await addRooms(addedRooms);
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

async function addRooms(addedRooms: string[]) {
  for (const roomPath of addedRooms) {
    if (Object.keys(roomsData).indexOf(roomPath) === -1) {
      try {
        const roomPA: string[] = JSON.parse(roomPath);
        const [area, building, room] = [roomPA[0], roomPA[1], roomPA[roomPA.length - 1]];
        const [roomLogs, roomDailys] = await Promise.all([getRoomLogs(area, building, room), getRoomDailys(area, building, room)]);

        roomsData[roomPath] = {
          area,
          building,
          room,
          fullName: `${area} > ${building} > ${room}`,
          roomLogs: roomLogs.map(({ ts, power }) => ({ ts: ts, power })),
          roomSpendings: roomLogs.filter(({ spending }) => spending >= 0).map(({ ts, spending }) => ({ ts: ts, power: spending })),
          roomDailys: roomDailys.map(({ ts, spending }) => ({ ts: ts, power: spending })),
        };
      } catch {
        continue;
      }
    }
    roomsSelect.value.push(roomPath);
    await nextTick();
    roomsSelected.value.push(roomPath); // add新选中的寝室
  }
}

async function removeRooms(removedRooms: string[]) {
  roomsSelect.value = roomsSelect.value.filter((roomPath) => !removedRooms.includes(roomPath));
  await nextTick();
  roomsSelected.value = roomsSelected.value.filter((roomPath) => !removedRooms.includes(roomPath));
}
</script>

<style scoped></style>
