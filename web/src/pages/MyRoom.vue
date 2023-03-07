<template>
  <n-layout v-if="userInfo === undefined" position="absolute" style="top: 0; bottom: 0">
    <n-space vertical align="center" justify="center" style="height: 100%" item-style="width: min(80vw, 600px)">
      <n-form ref="loginForm" :model="loginFormValue" :rules="loginFormRule">
        <n-form-item label="账号" path="username">
          <n-input v-model:value="loginFormValue.username" placeholder="就是你的学号" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="loginFormValue.password" placeholder="默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号" type="password" />
        </n-form-item>
      </n-form>
      <n-space align="center" justify="space-between">
        <n-button size="small" quaternary @click="loginFormHelpShow = true"> 忘记密码 </n-button>
        <n-button size="large" type="primary" @click="loginFormClick" style="width: 120px"> 登录 </n-button>
        <n-button size="small" quaternary @click="loginFormHelpShow = true"> 无法登录 </n-button>
      </n-space>
    </n-space>
    <n-modal v-model:show="loginFormHelpShow">
      <n-card style="width: min(80vw, 600px)" title="登录帮助" role="dialog">
        <n-p>
          <n-text>如果你：</n-text>
          <n-ol>
            <n-li>忘记了密码</n-li>
            <n-li>被别人修改了密码</n-li>
            <n-li>碰到了其他无法登录的情况</n-li>
          </n-ol>
          <n-text>请联系开发者</n-text>
        </n-p>
      </n-card>
    </n-modal>
  </n-layout>

  <n-layout v-if="userInfo !== undefined" position="absolute" style="top: 0; bottom: 0">
    <n-space vertical align="center" justify="center" style="height: 100%" item-style="width: min(80vw, 600px)">
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
  </n-layout>
</template>

<script lang="ts">
export default {
  name: "MyRoom",
};

import { ref, inject } from "vue";
import type { FormInst } from "naive-ui";

import { messageApi } from "@/utils";
import { login, logout } from "@/api";
</script>

<script lang="ts" setup>
import {
  NLayout,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NModal,
  NCard,
  NP,
  NText,
  NOl,
  NLi,
  NAvatar,
  NDivider,
  NTag,
  NPopover,
  NTime,
  NIcon,
} from "naive-ui";
import { CloudDownloadOutline } from "@vicons/ionicons5";

import { userInfo } from "@/utils";

const reload = inject<ReloadFunc>("f_reload")!;

const loginForm = ref<FormInst>();
const loginFormHelpShow = ref(false);
const loginFormValue = ref({
  username: "",
  password: "",
});
const loginFormRule = {
  username: {
    required: true,
    message: "请输入账号",
    trigger: "blur",
  },
  password: {
    required: true,
    message: "请输入密码",
    trigger: "blur",
  },
};
function loginFormClick(e: MouseEvent) {
  e.preventDefault();
  loginForm.value?.validate(async (errors) => {
    if (!errors) {
      const loginResult = await login(loginFormValue.value.username, loginFormValue.value.password);
      if (typeof loginResult === "string") {
        messageApi.value?.error(loginResult);
      } else {
        await reload();
      }
    }
  });
}

async function logoutClick(e: MouseEvent) {
  e.preventDefault();
  await logout();
  await reload();
}
</script>

<style scoped></style>
