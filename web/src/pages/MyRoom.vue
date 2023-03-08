<template>
  <n-space vertical align="center" justify="center" style="min-height: var(--container-height)" item-style="width: var(--container-width)">
    <n-card :title="userInfo.info.name" hoverable>
      <n-space align="center" justify="space-between">
        <n-p>
          <n-text>学号</n-text>
          <n-divider vertical />
          <n-text>{{ userInfo.info.number }}</n-text>
          <br />
          <n-text>学院</n-text>
          <n-divider vertical />
          <n-text>{{ userInfo.info.faculty }} </n-text>
          <br />
          <n-text>年级</n-text>
          <n-divider vertical />
          <n-text>{{ userInfo.info.grade }} </n-text>
          <br />
          <n-text>专业</n-text>
          <n-divider vertical />
          <n-text>{{ userInfo.info.major }} </n-text>
          <br />
          <n-text>班级</n-text>
          <n-divider vertical />
          <n-text>{{ userInfo.info.class }} </n-text>
        </n-p>
        <n-popover trigger="hover">
          <template #trigger>
            <n-avatar :size="64" :src="'https://dk.nynu.edu.cn/' + userInfo.info.picture" style="height: unset" />
          </template>
          照片来自<n-tag :bordered="false">随行校园</n-tag>，本应用不保存任何隐私信息。
        </n-popover>
      </n-space>
      <template #header-extra>
        <n-popover trigger="hover">
          <template #trigger>
            <n-tag round :bordered="false">
              <n-time :time="userInfo.update_time" type="relative" />
              <template #icon>
                <n-icon>
                  <cloud-download-outline />
                </n-icon>
              </template>
            </n-tag>
          </template>
          数据同步于：<n-time :time="userInfo.update_time" type="datetime" />
        </n-popover>
      </template>
      <template #footer>
        <n-space align="center">
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag type="success"> {{ userInfo.position.area }} </n-tag>
            </template>
            <n-text>校区</n-text>
          </n-popover>
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag type="success"> {{ userInfo.position.building }} </n-tag>
            </template>
            <n-text>宿舍楼</n-text>
          </n-popover>
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag type="success"> {{ userInfo.position.room }} </n-tag>
            </template>
            <n-text>寝室</n-text>
          </n-popover>
          <n-popover trigger="hover">
            <template #trigger>
              <n-tag round type="success"> {{ userInfo.position.bed }} </n-tag>
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
  </n-space>
</template>

<script lang="ts">
export default {
  name: "MyRoom",
};

import { useRoute, useRouter } from "vue-router";

import { logout } from "@/api";
</script>

<script lang="ts" setup>
import { NSpace, NButton, NCard, NP, NText, NAvatar, NDivider, NTag, NPopover, NTime, NIcon } from "naive-ui";
import { CloudDownloadOutline } from "@vicons/ionicons5";

import { userInfo } from "@/utils";

const route = useRoute();
const router = useRouter();

async function logoutClick(e: MouseEvent) {
  e.preventDefault();
  await logout();
  router.push({ name: "Login", query: { redirect: route.fullPath } });
}
</script>

<style scoped></style>
