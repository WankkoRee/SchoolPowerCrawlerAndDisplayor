<template>
  <n-space vertical align="center" justify="center" style="min-height: var(--container-height)">
    <n-card hoverable style="width: min(var(--container-width), 600px)">
      <template #header>
        <n-skeleton v-if="loading" text :width="80" :sharp="false" />
        <span v-else>{{ userInfo?.info.name }}</span>
      </template>
      <n-space align="center" justify="space-between">
        <n-p>
          <n-text>学号</n-text>
          <n-divider vertical />
          <n-skeleton v-if="loading" text :width="100" round />
          <n-text v-else>{{ userInfo?.info.number }}</n-text>
          <br />
          <n-text>学院</n-text>
          <n-divider vertical />
          <n-skeleton v-if="loading" text :width="120" round />
          <n-text v-else>{{ userInfo?.info.faculty }} </n-text>
          <br />
          <n-text>年级</n-text>
          <n-divider vertical />
          <n-skeleton v-if="loading" text :width="60" round />
          <n-text v-else>{{ userInfo?.info.grade }} </n-text>
          <br />
          <n-text>专业</n-text>
          <n-divider vertical />

          <n-skeleton v-if="loading" text :width="80" round />
          <n-text v-else>{{ userInfo?.info.major }} </n-text>
          <br />
          <n-text>班级</n-text>
          <n-divider vertical />
          <n-skeleton v-if="loading" text :width="60" round />
          <n-text v-else>{{ userInfo?.info.class }} </n-text>
        </n-p>
        <n-popover trigger="hover">
          <template #trigger>
            <n-skeleton v-if="loading" :width="64" :height="90" :sharp="false" />
            <n-avatar v-else :size="64" :src="'https://dk.nynu.edu.cn/' + userInfo?.info.picture" style="height: unset" />
          </template>
          照片来自<n-tag :bordered="false">随行校园</n-tag>，本应用不保存任何隐私信息。
        </n-popover>
      </n-space>
      <template #header-extra>
        <n-popover trigger="hover">
          <template #trigger>
            <n-tag round :bordered="false">
              <template #icon>
                <n-icon>
                  <cloud-download-outline />
                </n-icon>
              </template>
              <n-skeleton v-if="loading" text :width="50" round />
              <n-time v-else :time="userInfo?.update_time" type="relative" />
            </n-tag>
          </template>
          <span>数据同步于：</span>
          <n-skeleton v-if="loading" text :width="138" round />
          <n-time v-else :time="userInfo?.update_time" type="datetime" />
        </n-popover>
      </template>
      <template #footer>
        <n-space align="center">
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag type="success">
                <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                <span v-else>{{ area }}</span>
              </n-tag>
            </template>
            <n-text>校区</n-text>
          </n-popover>
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag type="success">
                <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                <span v-else>{{ building }}</span>
              </n-tag>
            </template>
            <n-text>宿舍楼</n-text>
          </n-popover>
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag type="success">
                <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                <span v-else>{{ room }}</span>
              </n-tag>
            </template>
            <n-text>寝室</n-text>
          </n-popover>
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag round type="success">
                <n-skeleton v-if="loading" text :width="16" round />
                <span v-else>{{ bed }}</span>
              </n-tag>
            </template>
            <n-text>床位</n-text>
          </n-popover>
        </n-space>
      </template>
      <template #action>
        <n-space align="center" justify="space-between">
          <n-button attr-type="button" @click=""> 修改密码 </n-button>
          <n-button attr-type="button" @click="logoutClick"> 退出登录 </n-button>
        </n-space>
      </template>
    </n-card>
    <RoomInfoCard
      style="width: min(var(--container-width), 600px)"
      v-if="fullName !== ''"
      :area="area"
      :building="building"
      :room="room"
      :full-name="fullName"
    />
  </n-space>
</template>

<script lang="ts">
export default {
  name: "MyRoom",
};

import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { logout } from "@/api";
import { refreshUserInfo } from "@/utils";
</script>

<script lang="ts" setup>
import { NSpace, NButton, NCard, NP, NText, NAvatar, NDivider, NTag, NPopover, NTime, NIcon, NSkeleton } from "naive-ui";
import { CloudDownloadOutline } from "@vicons/ionicons5";

import { userInfo } from "@/utils";
import RoomInfoCard from "@/components/RoomInfoCard.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);

const area = ref("");
const building = ref("");
const room = ref("");
const bed = ref("");
const fullName = ref("");

async function logoutClick(e: MouseEvent) {
  e.preventDefault();
  await logout();
  router.push({ name: "Login", query: { redirect: route.fullPath } });
}

onMounted(async () => {
  await refreshUserInfo();
  if (userInfo.value) {
    let canBeShow = true;
    if (userInfo.value.position.custom.state) {
      area.value = userInfo.value.position.custom.area ?? userInfo.value.position.area ?? "存在问题";
      building.value = userInfo.value.position.custom.building ?? userInfo.value.position.building ?? "存在问题";
      room.value = userInfo.value.position.custom.room ?? userInfo.value.position.room ?? "存在问题";
      canBeShow &&= area.value !== "存在问题" && building.value !== "存在问题" && room.value !== "存在问题";
    } else {
      area.value = userInfo.value.position.area ?? "无";
      building.value = userInfo.value.position.building ?? "无";
      room.value = userInfo.value.position.room ?? "无";
      canBeShow &&= area.value !== "无" && building.value !== "无" && room.value !== "无";
    }
    bed.value = userInfo.value.position.bed ? userInfo.value.position.bed.toString() : "0";
    if (canBeShow) fullName.value = `${area.value} > ${building.value} > ${room.value}`;
  }
  loading.value = true;
});
</script>

<style scoped></style>
