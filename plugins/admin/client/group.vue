<template>
  <k-layout>
    <template #header>
      <template v-if="activeGroup">用户组</template>
      <template v-else-if="activeTrack">用户组路线</template>
      <template v-else>权限管理</template>
      <template v-if="activeGroup || activeTrack">
        -
        <input
          class="rename-input"
          v-model="renameInput"
          placeholder="未命名"
        />
      </template>
    </template>

    <template #menu>
      <span class="menu-item" :class="{ disabled: !activeGroup && !activeTrack }" @click.stop.prevent="deleteItem">
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
        <k-tab-group :data="store.admin.groups" v-model="activeGroup" #="{ id }">
          {{ store.locales?.[`permission.${id}`] || store.admin.groups[id].name || '未命名' }}
        </k-tab-group>
        <div class="k-tab-group-title">用户组路线</div>
        <k-tab-group :data="store.admin.tracks" v-model="activeTrack" #="{ id }">
          {{ store.locales?.[`permission-track.${id}`] || store.admin.tracks[id].name || '未命名' }}
        </k-tab-group>
      </el-scrollbar>
    </template>

    <k-content v-if="activeGroup">
      <!-- nav: 前往本地化翻译 -->
      <h2 class="k-schema-header">用户管理</h2>
      <p>此用户组内当前共有 {{ store.admin.groups[activeGroup].count }} 个用户。</p>
      <el-button @click="showUserDialog = true">添加用户</el-button>
      <h2 class="k-schema-header">权限列表</h2>
      <template v-if="store.admin.groups[activeGroup].permissions.length">
        <ul>
          <li v-for="(permission, index) in store.admin.groups[activeGroup].permissions">
            {{ permission }}
            <el-button @click="removePermission(index)">删除</el-button>
          </li>
        </ul>
      </template>
      <p v-else>该用户组没有权限。</p>
      <el-select v-model="permission">
        <el-option
          v-for="id in store.permissions.filter(item => !store.admin.groups[activeGroup].permissions.includes(item))"
          :key="id"
          :value="id">
          <template v-if="id.startsWith('command.')">
            指令：{{ id.slice(8) }}
          </template>
          <template v-else-if="id.startsWith('group.')">
            用户组：{{ store.locales?.[`permission.${id}`] || store.admin.groups[id.slice(6)].name || '未命名' }}
          </template>
          <template v-else>
            {{ store.locales?.[`permission.${id}`] || id }}
          </template>
        </el-option>
      </el-select>
      <el-button :disabled="!permission" @click="addPermission">添加权限</el-button>
    </k-content>

    <k-content v-else-if="activeTrack">
      <h2 class="k-schema-header">权限列表</h2>
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

  <el-dialog v-model="showUserDialog" destroy-on-close title="用户管理">
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
const createType = ref<'group' | 'track'>('group')
const createInput = ref('')
const invalid = computed(() => !createInput.value)
const permission = ref<string>()
const root = ref<{ $el: HTMLElement }>(null)

const activeGroup = computed<string>({
  get() {
    if (!route.path.startsWith('/admin/group/')) return ''
    const id = route.path.slice(13)
    return id in store.admin.groups ? id : ''
  },
  set(id) {
    if (!(id in store.admin.groups)) id = ''
    router.replace('/admin/group/' + id)
  },
})

const activeTrack = computed<string>({
  get() {
    if (!route.path.startsWith('/admin/track/')) return ''
    const id = route.path.slice(13)
    return id in store.admin.tracks ? id : ''
  },
  set(id) {
    if (!(id in store.admin.tracks)) id = ''
    router.replace('/admin/track/' + id)
  },
})

const renameGroup = debounce(1000, (id: number, name: string) => {
  send('admin/rename-group', id, name)
})

const renameTrack = debounce(1000, (id: number, name: string) => {
  send('admin/rename-track', id, name)
})

const renameInput = computed<string>({
  get() {
    if (activeGroup.value) {
      return store.admin.groups[activeGroup.value].name
    } else if (activeTrack.value) {
      return store.admin.tracks[activeTrack.value].name
    }
  },
  set(value) {
    if (activeGroup.value) {
      store.admin.groups[activeGroup.value].name = value
      renameGroup(+activeGroup.value, value)
    } else if (activeTrack.value) {
      store.admin.tracks[activeTrack.value].name = value
      renameTrack(+activeTrack.value, value)
    }
  },
})

async function createItem() {
  showCreateDialog.value = false
  const id = await send(`admin/create-${createType.value}`, createInput.value)
  router.replace(`/admin/${createType.value}/` + id)
  createInput.value = ''
}

async function deleteItem() {
  if (activeTrack.value) {
    await send('admin/delete-track', +activeTrack.value)
    router.replace('/admin/')
  } else {
    await send('admin/delete-group', +activeGroup.value)
    router.replace('/admin/')
  }
}

async function addPermission() {
  const { permissions } = store.admin.groups[activeGroup.value]
  permissions.push(permission.value)
  permission.value = null
  await send('admin/update-group', +activeGroup.value, permissions)
}

async function removePermission(index: number) {
  const { permissions } = store.admin.groups[activeGroup.value]
  permissions.splice(index, 1)
  await send('admin/update-group', +activeGroup.value, permissions)
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

.create-dialog {
  .el-input.invalid .el-input__wrapper {
    box-shadow: 0 0 0 1px var(--el-color-danger) inset;
  }
}

</style>
