<template>
  <n-space vertical align="center" justify="center" style="min-height: var(--container-height)" item-style="width: min(var(--container-width), 300px)">
    <n-form ref="loginForm" :model="loginFormValue" :rules="loginFormRule">
      <n-form-item label="账号" path="username">
        <n-input v-model:value="loginFormValue.username" placeholder="就是你的学号" />
      </n-form-item>
      <n-form-item label="密码" path="password">
        <n-input
          v-model:value="loginFormValue.password"
          placeholder="默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号"
          type="password"
          show-password-on="mousedown"
        >
          <template #suffix>
            <n-button size="small" quaternary type="tertiary" @click="loginFormHelpShow = true"> 忘记密码 </n-button>
          </template>
        </n-input>
      </n-form-item>
    </n-form>
    <n-space align="center" justify="center">
      <n-button size="large" type="primary" :loading="logining" @click="loginFormClick" style="width: 120px"> 登录 </n-button>
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
</template>

<script lang="ts">
export default {
  name: "Login",
};

import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInst } from "naive-ui";

import { messageApi } from "@/utils";
import { login } from "@/api";
</script>

<script lang="ts" setup>
import { NSpace, NForm, NFormItem, NInput, NButton, NModal, NCard, NP, NText, NOl, NLi } from "naive-ui";

const route = useRoute();
const router = useRouter();

const logining = ref(false);
const loginForm = ref<FormInst>();
const loginFormHelpShow = ref(false);
const loginFormValue = ref({
  username: "",
  password: "",
});
const loginFormRule = {
  username: {
    required: true,
    message: "请输入账号，就是你的学号",
    trigger: "blur",
  },
  password: {
    required: true,
    message: "请输入密码，默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号",
    trigger: "blur",
  },
};
function loginFormClick(e: MouseEvent) {
  e.preventDefault();
  loginForm.value?.validate(async (errors) => {
    logining.value = true;
    if (!errors) {
      const loginResult = await login(loginFormValue.value.username, loginFormValue.value.password);
      if (typeof loginResult === "string") {
        messageApi.value?.error(loginResult);
      } else {
        router.push(typeof route.query.redirect === "string" ? route.query.redirect : { name: "Index" });
      }
    }
    logining.value = false;
  });
}
</script>

<style scoped></style>
