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
        />
      </n-grid-item>
    </n-grid>
    <n-space v-if="!roomsSelect.length" vertical align="center" justify="center" style="min-height: calc(var(--container-height) - 40px - 8px)">
      <n-empty description="要不咱先选几个寝室看看数据？" />
    </n-space>
    <n-space v-else vertical align="center" justify="center" item-style="width: var(--container-width)">
      <n-grid :x-gap="8" :y-gap="8" cols="1 800:2 1200:3 1600:4 2000:5">
        <n-grid-item v-for="(roomPath, index) in roomsSelect" :key="roomPath">
          <RoomInfoCard
            :card-header-style="`background: linear-gradient(
            ${colors[index % colors.length]}aa,
            ${colors[index % colors.length]}77,
            ${colors[index % colors.length]}44,
            #ffffff00)`"
            :room="JSON.parse(roomPath)"
            :on-remove="() => roomsSelect.splice(index, 1)"
          />
        </n-grid-item>
      </n-grid>
      <n-grid :x-gap="8" :y-gap="8" cols="1">
        <n-grid-item>
          <RoomsChart type="电量" :rooms="roomsSelect.map((roomPath) => JSON.parse(roomPath))" />
        </n-grid-item>
        <n-grid-item>
          <RoomsChart type="用电量" :rooms="roomsSelect.map((roomPath) => JSON.parse(roomPath))" />
        </n-grid-item>
        <n-grid-item>
          <RoomsChart type="日用电量" :rooms="roomsSelect.map((roomPath) => JSON.parse(roomPath))" />
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
import { useRoute, useRouter } from "vue-router";
import { Base64 } from "js-base64";
import type { CascaderInst, TreeSelectInst, TreeSelectOption } from "naive-ui";

import { getAreas, getBuildings, getRooms } from "@/api";
import { roomNameRegex } from "@/utils";
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
        else roomsSelect.value.push(room.value_fact);
      }
    }
  loading.value = false;
});

async function loadAreas(force: boolean = false): Promise<SelectorOption[]> {
  if (!force && roomsOption.value.length > 0) return roomsOption.value;

  const areas = await getAreas();
  roomsOption.value = areas.map<SelectorOption>((area) => ({
    value_show: area,
    value_fact: JSON.stringify({ area }),
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
    value_fact: JSON.stringify({ area, building }),
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
  const roomUnclassified = new Map<string, string[]>();
  rooms.forEach((room) => {
    const roomNameRegexResult = roomNameRegex(room);
    if (roomNameRegexResult.length === 2) {
      if (!roomUnclassified.has(roomNameRegexResult[0])) roomUnclassified.set(roomNameRegexResult[0], []);
      roomUnclassified.get(roomNameRegexResult[0])!.push(roomNameRegexResult[1]);
    } else if (roomNameRegexResult.length === 3) {
      if (!roomClassified.has(roomNameRegexResult[0])) roomClassified.set(roomNameRegexResult[0], new Map());
      if (!roomClassified.get(roomNameRegexResult[0])!.has(roomNameRegexResult[1])) roomClassified.get(roomNameRegexResult[0])!.set(roomNameRegexResult[1], []);
      roomClassified.get(roomNameRegexResult[0])!.get(roomNameRegexResult[1])!.push(roomNameRegexResult[2]);
    }
  });
  parent.children = <SelectorOption[]>[];
  parent.children.push(
    ...Array.from(roomUnclassified).map(([b, l_]) => ({
      value_show: b,
      value_fact: JSON.stringify({ area, building, path: b }),
      depth: 3,
      isLeaf: false,
      path: [...parent.path, b],
      children: Array.from(l_).map((l) => ({
        value_show: l,
        value_fact: JSON.stringify({ area, building, path: l }),
        depth: 4,
        isLeaf: true,
        path: [...parent.path, b, l],
      })),
    }))
  );
  parent.children.push(
    ...Array.from(roomClassified).map(([b, l_]) => ({
      value_show: b,
      value_fact: JSON.stringify({ area, building, path: b }),
      depth: 3,
      isLeaf: false,
      path: [...parent.path, b],
      children: Array.from(l_).map(([l, r_]) => ({
        value_show: l,
        value_fact: JSON.stringify({ area, building, path: l }),
        depth: 4,
        isLeaf: false,
        path: [...parent.path, b, l],
        children: Array.from(r_).map((r) => ({
          value_show: r,
          value_fact: JSON.stringify({ area, building, room: r }),
          depth: 5,
          isLeaf: true,
          path: [...parent.path, b, l, r],
        })),
      })),
    }))
  );
  return parent.children;
}

async function handleRoomsLoad(option_: SelectorOption | TreeSelectOption) {
  // todo: 删除 TreeSelectOption
  const option = <SelectorOption>option_;
  if (option.depth === 1) {
    await loadBuildings(option.path[0], option);
  } else if (option.depth === 2) {
    await loadRooms(option.path[0], option.path[1], option);
  }
}

function handleRoomsSelect(values: string[], options: SelectorOption[]) {
  router.replace({
    name: "ComparisonChart",
    query: { rooms: Base64.encodeURI(JSON.stringify(options.map((option) => option.path))) },
  });
}
</script>

<style scoped></style>
