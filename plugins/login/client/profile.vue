<template>
  <k-layout main="page-profile" :menu="menu">
    <k-content>
      <k-form :schema="schema" v-model="diff" #epilog>
        <h2 class="k-schema-header">
          平台用户绑定
          <el-button solid @click="showDialog = true">添加</el-button>
        </h2>
        <div class="schema-item" v-for="({ platform, pid, bid }) in store.user.bindings">
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
      </k-form>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { send, store } from '@koishijs/client'
import { config, showDialog } from './utils'
import { computed, ref } from 'vue'
import { message, Schema } from '@koishijs/client'
import { UserUpdate } from '@koishijs/plugin-login'

const diff = ref<UserUpdate>({})

const schema = computed(() => {
  const result: Schema<UserUpdate> = Schema.object({
    name: Schema.string().description('用户名').default(config.value.name),
  }).description('基本资料')
  result.dict.password = Schema.string().role('secret').description('密码').default(config.value.password)
  return result
})

async function logout() {
  delete config.value.id
  delete config.value.token
  delete config.value.expire
  return send('user/logout')
}

async function update() {
  try {
    await send('user/update', diff.value)
    message.success('修改成功！')
    Object.assign(config.value, diff)
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
  type: 'error',
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
}

</style>
