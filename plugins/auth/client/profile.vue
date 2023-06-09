<template>
  <k-layout main="page-profile" :menu="menu">
    <k-content>
      <k-form :schema="schema" v-model="diff"></k-form>

      <h2 class="k-schema-header">
        平台绑定
        <el-button solid class="right" @click="showLoginDialog = true">添加</el-button>
      </h2>
      <div class="k-schema-item" v-for="({ platform, pid, bid }) in store.user.bindings">
        <div class="header">
          <div class="left">{{ platform }} ({{ pid }})</div>
          <div class="right">
            <el-button
              v-if="original.length > 1 || bid !== store.user.id"
              @click.stop.prevent="send('user/unbind', platform, pid)"
            >解绑</el-button>
          </div>
        </div>
      </div>

      <h2 class="k-schema-header">登录历史</h2>
      <ul>
        <li v-for="({ inc, type, createdAt, lastUsedAt, address, userAgent }) in store.user.tokens" :key="inc">
          <div>登录类型：{{ types[type] }}</div>
          <div>登录时间：{{ createdAt }}</div>
          <div>最后访问：{{ lastUsedAt }}</div>
          <div>IP 地址：{{ address }}</div>
          <div>客户端：{{ userAgent }}</div>
          <div><el-button @click="send('user/delete-token', inc)">移除会话</el-button></div>
        </li>
      </ul>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { send, store } from '@koishijs/client'
import { shared, showLoginDialog } from './utils'
import { computed, ref } from 'vue'
import { message, Schema } from '@koishijs/client'
import { UserUpdate } from '@koishijs/plugin-auth'

const types = {
  platform: '平台账户',
  password: '用户密码',
}

const diff = ref<UserUpdate>({})

const schema = computed(() => {
  const result: Schema<UserUpdate> = Schema.object({
    name: Schema.string().description('用户名').default(shared.value.name),
    password: Schema.string().role('secret').description('密码').default(shared.value.password),
  }).description('基本资料')
  return result
})

async function logout() {
  store.user = null
  delete shared.value.id
  delete shared.value.token
  delete shared.value.expiredAt
  return send('user/logout')
}

async function update() {
  try {
    await send('user/update', diff.value)
    message.success('修改成功！')
    Object.assign(shared.value, diff.value)
    Object.assign(store.user, diff.value)
    diff.value = {}
  } catch (e) {
    message.error(e.message)
  }
}

const original = computed(() => {
  return store.user?.bindings.filter(item => store.user.id === item.bid)
})

const menu = computed(() => [{
  icon: 'check',
  label: '应用更改',
  disabled: !diff.value || !Object.keys(diff.value).length,
  action: update,
}, {
  type: 'danger',
  icon: 'sign-out',
  label: '退出登录',
  action: logout,
}])

</script>

<style lang="scss">

.page-profile {
  h1 {
    font-size: 1.375rem;
    margin: 1.5rem 0;
    line-height: 2rem;
  }

  .el-button.right {
    float: right;
  }
}

</style>
