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
      <span class="menu-item" :class="{ disabled: !active }" @click.stop.prevent="deleteGroup">
        <k-icon class="menu-icon" name="trash-can"></k-icon>
      </span>
      <span class="menu-item" @click.stop.prevent="showCreateDialog = true">
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
      <h2 class="k-schema-header">用户管理</h2>
      <p>此用户组内当前共有 {{ store.groups[active].count }} 个用户。</p>
      <el-button @click="showUserDialog = true">添加用户</el-button>
      <h2 class="k-schema-header">权限列表</h2>
      <template v-if="store.groups[active].permissions.length">
        <ul>
          <li v-for="(permission, index) in store.groups[active].permissions">
            {{ permission }}
            <el-button @click="removePermission(index)">删除</el-button>
          </li>
        </ul>
      </template>
      <p v-else>该用户组没有权限。</p>
      <el-select v-model="permission">
        <el-option
          v-for="item in store.permissions.filter(item => !store.groups[active].permissions.includes(item))"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-button :disabled="!permission" @click="addPermission">添加权限</el-button>
    </k-content>

    <k-empty v-else>
      <div>在左侧选择或创建用户组</div>
    </k-empty>
  </k-layout>

  <el-dialog v-model="showCreateDialog" title="选择要创建的类型">
    <el-button-group class="text-center">
      <el-button @click="createGroup">用户组</el-button>
    </el-button-group>
  </el-dialog>

  <el-dialog v-model="showUserDialog" title="用户管理">
    <el-input v-model="platform" placeholder="平台名"/>
    <el-input v-model="account" placeholder="账号"/>
    <template #footer>
      <el-button @click="removeUser">从用户组移除</el-button>
      <el-button @click="addUser">添加到用户组</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { message, send, store } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import {} from '@koishijs/plugin-locales'
import { debounce } from 'throttle-debounce'

const route = useRoute()
const router = useRouter()

const showCreateDialog = ref(false)
const showUserDialog = ref(false)
const platform = ref('')
const account = ref('')
const keyword = ref('')
const permission = ref<string>()
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

const renameGroup = debounce(1000, (id: number, name: string) => {
  send('admin/rename-group', id, name)
})

const name = computed<string>({
  get() {
    return store.groups[active.value].name
  },
  set(value) {
    store.groups[active.value].name = value
    renameGroup(+active.value, value)
  },
})

async function createGroup() {
  showCreateDialog.value = false
  const id = await send('admin/create-group')
  router.replace('/groups/' + id)
}

async function deleteGroup() {
  await send('admin/delete-group', +active.value)
  router.replace('/groups/')
}

async function addPermission() {
  const { permissions } = store.groups[active.value]
  permissions.push(permission.value)
  permission.value = null
  await send('admin/update-group', +active.value, permissions)
}

async function removePermission(index: number) {
  const { permissions } = store.groups[active.value]
  permissions.splice(index, 1)
  await send('admin/update-group', +active.value, permissions)
}

async function addUser() {
  try {
    await send('admin/add-user', +active.value, platform.value, account.value)
    message.success('操作成功')
  } catch (err) {
    console.error(err)
    message.error('操作失败')
  }
  showUserDialog.value = false
}

async function removeUser() {
  try {
    await send('admin/remove-user', +active.value, platform.value, account.value)
    message.success('操作成功')
  } catch (err) {
    console.error(err)
    message.error('操作失败')
  }
  showUserDialog.value = false
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
