<template>
  <k-layout menu="config.tree" :menu-data="current">
    <template #header>
      <!-- root -->
      <template v-if="!current.path">全局设置</template>

      <!-- group -->
      <template v-else-if="current.children">
        分组 <k-alias :current="current"></k-alias>
      </template>

      <!-- plugin -->
      <template v-else>
        <template v-if="!current.name">
          <el-select v-model="current.target" filterable placeholder="插件选择">
            <el-option
              v-for="name in Object.values(store.packages).slice(1).map(value => value.shortname).sort()"
              :key="name" :label="name" :value="name"
            ></el-option>
          </el-select>
        </template>
        <template v-else>
          <span class="label">{{ current.name }}</span>
          <k-alias :current="current"></k-alias>
        </template>
      </template>
    </template>

    <template #left>
      <tree-view v-model="path"></tree-view>
    </template>

    <k-content class="plugin-view" :key="path">
      <global-settings v-if="!current.path" :current="current" v-model="config"></global-settings>
      <group-settings v-else-if="current.children" v-model="config" :current="current"></group-settings>
      <plugin-settings v-else :current="current" v-model="config"></plugin-settings>
    </k-content>

    <el-dialog
      v-model="showRemove"
      title="确认移除"
      destroy-on-close
      @closed="remove = null"
    >
      <template v-if="remove">
        确定要移除{{ remove.children ? `分组 ${remove.alias}` : `插件 ${remove.name}` }} 吗？此操作不可撤销！
      </template>
      <template #footer>
        <el-button @click="showRemove = false">取消</el-button>
        <el-button type="danger" @click="(showRemove = false, removeItem(remove.path))">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showRename"
      title="重命名"
      destroy-on-close
      @closed="rename = null"
    >
      <template v-if="rename">
        <el-input v-model="input" @keydown.enter.stop.prevent="renameItem(rename, input)"/>
      </template>
      <template #footer>
        <el-button @click="showRename = false">取消</el-button>
        <el-button type="danger" @click="renameItem(rename, input)">确定</el-button>
      </template>
    </el-dialog>
  </k-layout>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clone, message, messageBox, send, store, useContext, Schema } from '@koishijs/client'
import { Tree, getFullName, addItem, hasCoreDeps, current, plugins, removeItem, select, splitPath } from './utils'
import GlobalSettings from './global.vue'
import GroupSettings from './group.vue'
import TreeView from './tree.vue'
import PluginSettings from './plugin.vue'
import KAlias from './alias.vue'

const route = useRoute()
const router = useRouter()

const path = computed<string>({
  get() {
    const name = route.path.slice(9)
    return name in plugins.value.paths ? name : ''
  },
  set(name) {
    if (!(name in plugins.value.paths)) name = ''
    router.replace('/plugins/' + name)
  },
})

const config = ref()
const input = ref('')

const remove = ref<Tree>()
const showRemove = ref(false)
const rename = ref<Tree>()
const showRename = ref(false)

watch(remove, (value) => {
  if (value) showRemove.value = true
})

watch(rename, (value) => {
  if (value) showRename.value = true
})

watch(() => plugins.value.paths[path.value], (value) => {
  current.value = value
  config.value = clone(value.config)
}, { immediate: true })

const ctx = useContext()

ctx.define('config.tree', current)

ctx.action('config.tree.add-plugin', {
  disabled: ({ config }) => config.tree.path && !config.tree.children,
  action: ({ config }) => select.value = config.tree,
})

ctx.action('config.tree.add-group', {
  disabled: ({ config }) => config.tree.path && !config.tree.children,
  action: ({ config }) => addItem(config.tree.path, 'group', 'group'),
})

ctx.action('config.tree.rename', {
  disabled: ({ config }) => !config.tree.path,
  action: ({ config }) => {
    input.value = config.tree.label || (config.tree.name === 'group' ? config.tree.alias : config.tree.name)
    rename.value = config.tree
  },
})

ctx.action('config.tree.remove', {
  disabled: ({ config }) => !config.tree.path,
  action: ({ config }) => remove.value = config.tree,
})

ctx.action('config.tree.add-plugin', {
  disabled: ({ config }) => config.tree.path && !config.tree.children,
  action: ({ config }) => select.value = config.tree,
})

ctx.action('config.tree.add-group', {
  disabled: ({ config }) => config.tree.path && !config.tree.children,
  action: ({ config }) => addItem(config.tree.path, 'group', 'group'),
})

function checkConfig(name: string) {
  let schema = store.packages[getFullName(name)]?.runtime.schema
  if (!schema) return true
  try {
    (new Schema(schema))(config.value)
    return true
  } catch {
    message.error('当前配置项不满足约束，请检查配置！')
    return false
  }
}

ctx.action('config.tree.save', {
  shortcut: 'ctrl+s',
  action: async ({ config: { tree } }) => {
    const { disabled, path } = tree
    if (!disabled && !checkConfig(tree.name)) return
    if (!path) return send('manager/app-reload', config.value)
    try {
      await execute(tree, disabled ? 'unload' : 'reload')
      message.success(disabled ? '配置已保存。' : '配置已重载。')
    } catch (error) {
      message.error('操作失败，请检查日志！')
    }
  },
})

ctx.action('config.tree.toggle', {
  disabled: ({ config }) => !config.tree.path || hasCoreDeps(config.tree),
  action: async ({ config: { tree } }) => {
    const { disabled, name } = tree
    if (disabled && !checkConfig(tree.name)) return
    try {
      await execute(tree, disabled ? 'reload' : 'unload')
      message.success((name === 'group' ? '分组' : '插件') + (disabled ? '已启用。' : '已停用。'))
    } catch (error) {
      message.error('操作失败，请检查日志！')
    }
  },
})

async function execute(tree: Tree, event: 'unload' | 'reload') {
  await send(`manager/${event}`, tree.path, config.value, tree.target)
  if (tree.target) {
    const segments = splitPath(tree.path)
    segments[segments.length - 1] = tree.target
    router.replace('/plugins/' + segments.join('/'))
  }
}

function renameItem(tree: Tree, name: string) {
  showRename.value = false
  tree.label = name
  send('manager/meta', tree.path, { $label: name || null })
}

</script>

<style lang="scss">

.end {
  margin-right: 0.5rem;
}

.config-header {
  font-size: 1.375rem;
  margin: 0 0 2rem;
  line-height: 2rem;

  .k-button {
    float: right;
  }
}

.plugin-view .k-content > *:first-child {
  margin-top: 0;
}

</style>
