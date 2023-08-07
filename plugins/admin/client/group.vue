<template>
  <k-layout>
    <template #header>
      权限管理
      <template v-if="active">
        -
        <input
          class="rename-input"
          v-model="name"
          placeholder="未命名"
        />
      </template>
    </template>

    <template #menu>
      <!-- <span class="menu-item" :class="{ disabled: !command }" @click.stop.prevent="updateConfig">
        <k-icon class="menu-icon" name="check"></k-icon>
      </span> -->
      <!-- <span class="menu-item" :class="{ disabled: !command?.create }" @click.stop.prevent="removeCommand">
        <k-icon class="menu-icon" name="trash-can"></k-icon>
      </span> -->
      <span class="menu-item" @click.stop.prevent="showDialog = true">
        <k-icon class="menu-icon" name="plus"></k-icon>
      </span>
    </template>

    <template #left>
      <el-scrollbar class="user-groups" ref="root">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <div class="k-tab-group-title">用户组</div>
        <k-tab-group :data="store.groups" v-model="active" #="{ id }">
          {{ store.locales?.[`permission.${id}`] || store.groups[id].name || '未命名' }}
        </k-tab-group>
      </el-scrollbar>
    </template>

    <k-content class="detail" v-if="active">
      <!-- nav: 前往本地化翻译 -->
      <!-- 用户列表，添加用户？ -->
      <h2>权限列表</h2>
      <p v-if="store.groups[active].permissions.length">
        {{ store.groups[active].permissions }}
      </p>
      <p v-else>
        该用户组没有权限。
      </p>
    </k-content>

    <k-empty v-else>
      <div>在左侧选择或创建用户组</div>
    </k-empty>
  </k-layout>

  <el-dialog v-model="showDialog" title="选择要创建的类型">
    <el-button-group class="text-center">
      <el-button @click="createGroup">用户组</el-button>
    </el-button-group>
  </el-dialog>
</template>

<script lang="ts" setup>

import { send, store } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import {} from '@koishijs/plugin-locales'

const route = useRoute()
const router = useRouter()

const showDialog = ref(false)
const keyword = ref('')
const root = ref<{ $el: HTMLElement }>(null)

const active = computed<string>({
  get() {
    const name = route.path.slice(8)
    return name in store.groups ? name : ''
  },
  set(name) {
    if (!(name in store.groups)) name = ''
    router.replace('/groups/' + name)
  },
})

const name = computed<string>({
  get() {
    return store.groups[active.value].name
  },
  set(value) {
    store.groups[active.value].name = value
    send('admin/rename-group', +active.value, value)
  },
})

async function createGroup() {
  showDialog.value = false
  const id = await send('admin/create-group')
  router.replace('/groups/' + id)
}

</script>

<style lang="scss">

.user-groups {
  width: 100%;
  height: 100%;
  overflow: auto;

  .el-scrollbar__view {
    padding: 1rem 0;
  }

  .search {
    padding: 0 1.5rem;
  }
}

.rename-input {
  border: none;
  outline: none;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  background: transparent;
}

.el-button-group.text-center {
  display: flex;
  justify-content: center;
}

</style>
