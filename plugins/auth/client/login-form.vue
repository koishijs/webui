<template>
  <div class="login-form">
    <template v-if="user">
      <h1 v-if="store.user"><span>平台账户绑定</span></h1>
      <h1 v-else><span>平台账户登录</span></h1>
      <p class="hint">欢迎你，{{ user.name || 'Koishi 用户' }}！</p>
      <p class="hint">请用上述账号将下面的验证码发送给任意正在运行的机器人</p>
      <p class="token">{{ user.token }}</p>
      <div class="control">
        <k-button @click="user.token = null">返回上一步</k-button>
      </div>
    </template>

    <template v-else>
      <h1 v-if="store.user"><span>平台账户绑定</span></h1>
      <h1 v-else>
        <k-tab :data="['用户密码登录', '平台账户登录']" v-model="shared.authType"></k-tab>
      </h1>

      <template v-if="store.user || shared.authType === 1">
        <el-input placeholder="平台名" v-model="shared.platform" #prefix>
          <k-icon name="at"></k-icon>
        </el-input>
        <el-input placeholder="账号" v-model="shared.userId" @keypress.enter.stop="loginWithAccount" #prefix>
          <k-icon name="user"></k-icon>
        </el-input>
        <p class="error" v-if="error">{{ error }}</p>
        <div class="control">
          <k-button @click="goBack">返回</k-button>
          <k-button @click="loginWithAccount">获取验证码</k-button>
        </div>
      </template>

      <template v-else>
        <el-input placeholder="用户名" v-model="shared.name" #prefix>
          <k-icon name="user"></k-icon>
        </el-input>
        <el-input placeholder="密码" v-model="shared.password" @keypress.enter.stop="loginWithPassword"
          :type="shared.showPass ? 'text' : 'password'">
          <template #prefix><k-icon name="lock"></k-icon></template>
          <template #suffix>
            <k-icon :name="shared.showPass ? 'eye' : 'eye-slash'" @click="shared.showPass = !shared.showPass"></k-icon>
          </template>
        </el-input>
        <p class="error" v-if="error">{{ error }}</p>
        <div class="control">
          <k-button @click="goBack">返回</k-button>
          <k-button @click="loginWithPassword">登录</k-button>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { shared, showLoginDialog } from './utils'
import { send, store } from '@koishijs/client'
import { UserLogin } from '@koishijs/plugin-auth'

const error = ref<string>()
const user = ref<UserLogin>()

let timestamp = 0
async function loginWithAccount() {
  const now = Date.now()
  if (now < timestamp) return
  const { platform, userId } = shared.value
  if (!platform || !userId) return
  timestamp = now + 1000
  try {
    user.value = await send('login/platform', platform, userId)
  } catch (e) {
    error.value = e.message
  }
}

async function loginWithPassword() {
  const { name, password } = shared.value
  try {
    await send('login/password', name, password)
  } catch (e) {
    error.value = e.message
  }
}

const router = useRouter()

function goBack() {
  if (store.user) {
    showLoginDialog.value = false
  } else {
    router.back()
  }
}

</script>

<style lang="scss">

.login-form {
  text-align: center;

  h1 {
    font-size: 1.5rem;
    margin: 2.5rem auto;
    cursor: default;
  }

  .token {
    font-weight: bold;
  }

  .el-input {
    display: block;
    margin: 1rem auto;
  }

  .el-input__wrapper {
    width: 400px;
  }

  .control {
    margin: 2.5rem auto;
  }

  .k-button {
    width: 8rem;
    margin: 0 1rem;
  }
}

</style>
