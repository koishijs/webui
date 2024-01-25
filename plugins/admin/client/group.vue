<template>
  <k-layout>
    <template #header>
      <template v-if="activeGroup">用户组</template>
      <template v-else-if="activeTrack">用户组路线</template>
      <template v-else>权限管理</template>
      <template v-if="active.type">
        -
        <input
          class="rename-input"
          v-model="renameInput"
          placeholder="未命名"
        />
      </template>
    </template>

    <template #menu>
      <span class="menu-item" :class="{ disabled: !active.type }" @click.stop.prevent="deleteItem">
        <k-icon class="menu-icon" name="trash-can"></k-icon>
      </span>
      <span class="menu-item" @click.stop.prevent="showCreateDialog = true">
        <k-icon class="menu-icon" name="add"></k-icon>
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
        <k-tab-group :data="data.group" v-model="activeGroup" #="{ id }">
          {{ store.locales?.[`permission.${id}`] || data.group[id].name || '未命名' }}
        </k-tab-group>
        <div class="k-tab-group-title">用户组路线</div>
        <k-tab-group :data="data.track" v-model="activeTrack" #="{ id }">
          {{ store.locales?.[`permission-track.${id}`] || data.track[id].name || '未命名' }}
        </k-tab-group>
      </el-scrollbar>
    </template>

    <k-content v-if="activeGroup || activeTrack">
      <template v-if="activeGroup">
        <!-- nav: 前往本地化翻译 -->
        <h2 class="k-schema-header">用户管理</h2>
        <p>此用户组内当前共有 {{ data.group[activeGroup].count }} 个用户。</p>
        <el-button @click="showUserDialog = true">添加用户</el-button>
      </template>

      <h2 class="k-schema-header">权限列表</h2>
      <template v-if="permissions.length">
        <table class="perm-table">
          <tr v-for="(permission, index) in permissions" :key="index">
            <td class="text-left"><permission-name :id="permission" /></td>
            <td class="text-right">
              <el-button v-if="getLink(permission)" @click="router.push(getLink(permission))">前往</el-button>
              <el-button @click="removePermission(index)">删除</el-button>
            </td>
          </tr>
        </table>
      </template>
      <p v-else>该用户组没有权限。</p>

      <el-select v-model="permission">
        <el-option
          v-for="id in [...Object.keys(data.group).map(id => `group:${id}`), ...active.type === 'track' ? [] : store.permissions]"
          :key="id"
          :value="id">
          <permission-name :id="id" />
        </el-option>
      </el-select>
      <el-button :disabled="!permission" @click="addPermission">添加权限</el-button>
    </k-content>

    <k-empty v-else>
      <div>在左侧选择或创建用户组</div>
    </k-empty>
  </k-layout>

  <el-dialog class="create-dialog" v-model="showCreateDialog" destroy-on-close>
    <template #header>
      <span class="k-horizontal-tab-item" :class="{ active: createType === 'group' }" @click="createType = 'group'">创建用户组</span>
      <span class="k-horizontal-tab-item" :class="{ active: createType === 'track' }" @click="createType = 'track'">创建用户组路线</span>
    </template>
    <el-input :class="{ invalid }" v-model="createInput" @keydown.enter.stop.prevent="createItem" placeholder="请输入名称"></el-input>
    <template #footer>
      <el-button @click="showCreateDialog = false">取消</el-button>
      <el-button type="primary" :disabled="invalid" @click="createItem">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog class="user-dialog" v-model="showUserDialog" destroy-on-close title="用户管理">
    <div class="my-4"><el-input v-model="platform" placeholder="平台名"/></div>
    <div class="my-4"><el-input v-model="account" placeholder="账号"/></div>
    <template #footer>
      <el-button type="primary" @click="removeUser">从用户组移除</el-button>
      <el-button type="primary" @click="addUser">添加到用户组</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { message, send, store, useRpc } from '@koishijs/client'
import type Admin from '@koishijs/plugin-admin/src'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import {} from '@koishijs/plugin-locales'
import { debounce } from 'throttle-debounce'
import PermissionName from './name.vue'

const data = useRpc<Admin.Data>()

const route = useRoute()
const router = useRouter()

const showCreateDialog = ref(false)
const showUserDialog = ref(false)
const platform = ref('')
const account = ref('')
const keyword = ref('')
const createType = ref<'group' | 'track'>('group')
const createInput = ref('')
const invalid = computed(() => !createInput.value)
const permission = ref<string>()
const root = ref<{ $el: HTMLElement }>(null)

interface Active {
  type?: 'group' | 'track'
  id?: string
}

const active = computed<Active>(() => {
  if (route.path.startsWith('/admin/group/')) {
    const id = route.path.slice(13)
    if (id in data.value.group) {
      return { type: 'group', id }
    }
  } else if (route.path.startsWith('/admin/track/')) {
    const id = route.path.slice(13)
    if (id in data.value.track) {
      return { type: 'track', id }
    }
  }
  return {}
})

const activeGroup = computed<string>({
  get() {
    if (active.value.type !== 'group') return ''
    return active.value.id
  },
  set(id) {
    if (!(id in data.value.group)) id = ''
    router.replace('/admin/group/' + id)
  },
})

const activeTrack = computed<string>({
  get() {
    if (active.value.type !== 'track') return ''
    return active.value.id
  },
  set(id) {
    if (!(id in data.value.track)) id = ''
    router.replace('/admin/track/' + id)
  },
})

const permissions = computed(() => {
  return data.value[active.value.type][active.value.id].permissions
})

const renameItem = debounce(1000, (type: 'group' | 'track', id: number, name: string) => {
  send(`admin/rename-${type}`, id, name)
})

const renameInput = computed<string>({
  get() {
    return data.value[active.value.type][active.value.id].name
  },
  set(value) {
    data.value[active.value.type][active.value.id].name = value
    renameItem(active.value.type, +active.value.id, value)
  },
})

async function createItem() {
  showCreateDialog.value = false
  const id = await send(`admin/create-${createType.value}`, createInput.value)
  router.replace(`/admin/${createType.value}/` + id)
  createInput.value = ''
}

async function deleteItem() {
  await send(`admin/delete-${active.value.type}`, +active.value.id)
  router.replace('/admin/')
}

async function addPermission() {
  const { permissions } = data.value[active.value.type][active.value.id]
  permissions.push(permission.value)
  permission.value = null
  await send(`admin/update-${active.value.type}`, +active.value.id, permissions)
}

async function removePermission(index: number) {
  const { permissions } = data.value[active.value.type][active.value.id]
  permissions.splice(index, 1)
  await send(`admin/update-${active.value.type}`, +active.value.id, permissions)
}

async function addUser() {
  try {
    await send('admin/add-user', +activeGroup.value, platform.value, account.value)
    message.success('操作成功')
  } catch (err) {
    console.error(err)
    message.error('操作失败')
  }
  showUserDialog.value = false
}

async function removeUser() {
  try {
    await send('admin/remove-user', +activeGroup.value, platform.value, account.value)
    message.success('操作成功')
  } catch (err) {
    console.error(err)
    message.error('操作失败')
  }
  showUserDialog.value = false
}

function getLink(name: string) {
  if (name.startsWith('group:')) {
    return `/admin/group/${name.slice(6)}`
  } else if (name.startsWith('track:')) {
    return `/admin/track/${name.slice(6)}`
  } else if (name.startsWith('command:')) {
    return `/commands/${name.slice(8).replace(/\./g, '/')}`
  }
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

.perm-table {
  margin: 1rem 0;

  tr:hover {
    transition: var(--color-transition);
    background-color: var(--k-side-bg);
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

</style>
