<template>
  <n-space vertical align="center" justify="center" style="min-height: var(--container-height)">
    <n-space align="center" justify="center">
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
          <n-popover placement="left" trigger="hover">
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
          <n-space align="center" size="small">
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
        <template #action v-if="!loading">
          <n-space align="center" justify="space-between">
            <n-button attr-type="button" @click="passwordChangeShow = true"> 修改密码 </n-button>
            <n-button attr-type="button" :loading="logouting" @click="logoutClick"> 退出登录 </n-button>
          </n-space>
        </template>
      </n-card>
      <RoomInfoCard style="width: min(var(--container-width), 600px)" v-if="canBeShow" :room="{ area, building, room }" refresh compare />
    </n-space>
    <n-space align="center" justify="center">
      <RoomChart style="width: min(var(--container-width), 600px)" v-if="canBeShow" type="电量" :room="{ area, building, room }" />
      <RoomChart style="width: min(var(--container-width), 600px)" v-if="canBeShow" type="用电量" :room="{ area, building, room }" />
      <RoomChart style="width: min(var(--container-width), 600px)" v-if="canBeShow" type="日用电量" :room="{ area, building, room }" />
      <RoomChart style="width: min(var(--container-width), 900px)" v-if="canBeShow" type="每日用电量" :room="{ area, building, room }" />
    </n-space>
  </n-space>
  <n-modal v-model:show="passwordChangeShow">
    <n-card style="width: min(80vw, 600px)" title="修改密码" role="dialog">
      <n-space vertical align="center" justify="center" item-style="width: min(var(--container-width), 600px)">
        <n-form ref="passwordChangeForm" :model="passwordChangeFormValue" :rules="passwordChangeFormRule">
          <n-form-item label="当前密码" path="passwordOld">
            <n-input
              v-model:value="passwordChangeFormValue.passwordOld"
              placeholder="默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号"
              type="password"
            />
          </n-form-item>
          <n-form-item label="新密码" path="passwordNew">
            <n-input v-model:value="passwordChangeFormValue.passwordNew" placeholder="就是新密码" type="password" show-password-on="mousedown" />
          </n-form-item>
          <n-form-item label="确认密码" path="passwordAgain">
            <n-input v-model:value="passwordChangeFormValue.passwordAgain" placeholder="再输一遍新密码吧" type="password" show-password-on="mousedown" />
          </n-form-item>
        </n-form>
        <n-space align="center" justify="space-around">
          <n-button size="large" type="primary" :loading="passwordChanging" @click="passwordChangeFormClick" style="width: 120px"> 修改 </n-button>
        </n-space>
      </n-space>
    </n-card>
  </n-modal>
</template>

<script lang="ts">
export default {
  name: "MyRoom",
};

import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInst, FormItemRule } from "naive-ui";

import { logout, changePassword } from "@/api";
import { messageApi, refreshUserInfo } from "@/utils";
</script>

<script lang="ts" setup>
import { NSpace, NButton, NCard, NP, NText, NAvatar, NDivider, NTag, NPopover, NTime, NIcon, NSkeleton, NModal, NForm, NFormItem, NInput } from "naive-ui";
import { CloudDownloadOutline } from "@vicons/ionicons5";

import { userInfo } from "@/utils";
import RoomInfoCard from "@/components/RoomInfoCard.vue";
import RoomChart from "@/components/RoomChart.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const passwordChanging = ref(false);
const logouting = ref(false);

const area = ref("");
const building = ref("");
const room = ref("");
const bed = ref("");
const canBeShow = ref(false);

const passwordChangeShow = ref(false);
const passwordChangeForm = ref<FormInst>();
const passwordChangeFormValue = ref({
  passwordOld: "",
  passwordNew: "",
  passwordAgain: "",
});
const passwordChangeFormRule = {
  passwordOld: {
    required: true,
    message: "请输入当前密码",
    trigger: ["input", "blur"],
  },
  passwordNew: {
    required: true,
    message: "请输入新密码",
    trigger: ["input", "blur"],
  },
  passwordAgain: [
    {
      required: true,
      message: "请再次输入新密码",
      trigger: ["input", "blur"],
    },
    {
      validator: (rule: FormItemRule, passwordAgain: string) =>
        passwordChangeFormValue.value.passwordNew.length >= passwordAgain.length && passwordChangeFormValue.value.passwordNew.startsWith(passwordAgain),
      message: "请确认新密码是否输入一致",
      trigger: "input",
    },
    {
      validator: (rule: FormItemRule, passwordAgain: string) => passwordChangeFormValue.value.passwordNew === passwordAgain,
      message: "请确认新密码是否输入一致",
      trigger: "blur",
    },
  ],
};

async function logoutClick(e: MouseEvent) {
  e.preventDefault();
  logouting.value = true;
  await logout();
  router.push({ name: "Login", query: { redirect: route.fullPath } });
  logouting.value = false;
}

async function passwordChangeFormClick(e: MouseEvent) {
  e.preventDefault();
  passwordChangeForm.value?.validate(async (errors) => {
    passwordChanging.value = true;
    if (!errors) {
      const passwordChangeResult = await changePassword(passwordChangeFormValue.value.passwordOld, passwordChangeFormValue.value.passwordNew);
      if (typeof passwordChangeResult === "string") {
        messageApi.value?.error(passwordChangeResult);
      } else {
        router.push({ name: "Login", query: { redirect: route.fullPath } });
      }
    }
    passwordChanging.value = false;
  });
}

onMounted(async () => {
  await refreshUserInfo(route, router);
  if (userInfo.value) {
    if (userInfo.value.position.custom.state) {
      area.value = userInfo.value.position.custom.area ?? userInfo.value.position.area ?? "存在问题";
      building.value = userInfo.value.position.custom.building ?? userInfo.value.position.building ?? "存在问题";
      room.value = userInfo.value.position.custom.room ?? userInfo.value.position.room ?? "存在问题";
      canBeShow.value = area.value !== "存在问题" && building.value !== "存在问题" && room.value !== "存在问题";
    } else {
      area.value = userInfo.value.position.area ?? "无";
      building.value = userInfo.value.position.building ?? "无";
      room.value = userInfo.value.position.room ?? "无";
      canBeShow.value = area.value !== "无" && building.value !== "无" && room.value !== "无";
    }
    bed.value = userInfo.value.position.bed ? userInfo.value.position.bed.toString() : "0";
    loading.value = false;
  }
});
</script>

<style scoped></style>
