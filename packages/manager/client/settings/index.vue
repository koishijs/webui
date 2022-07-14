<template>
  <k-layout :menu="menu">
    <template #header>
      <!-- root -->
      <template v-if="current.path === '@global' || !current.path">
        {{ current.label }}
      </template>

      <!-- group -->
      <template v-else-if="current.children">
        分组 <k-alias :current="current"></k-alias>
      </template>

      <!-- plugin -->
      <template v-else>
        <template v-if="!current.label">
          <el-select v-model="current.target" filterable placeholder="插件选择">
            <el-option
              v-for="name in Object.values(store.packages).slice(1).map(value => value.shortname).sort()"
              :key="name" :label="name" :value="name"
            ></el-option>
          </el-select>
        </template>
        <template v-else>
          <span class="label">{{ current.label }}</span>
          <k-alias :current="current"></k-alias>
        </template>
      </template>
    </template>

    <template #left>
      <tree-view v-model="path"></tree-view>
    </template>

    <k-content class="plugin-view" :key="path">
      <global-settings v-if="current.path === '@global'" :current="current" v-model="config"></global-settings>
      <group-settings v-else-if="current.children" v-model="config" :current="current"></group-settings>
      <plugin-settings v-else :current="current" v-model="config"></plugin-settings>
    </k-content>
  </k-layout>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addItem, envMap, plugins, removeItem, separator, Tree } from './utils'
import GlobalSettings from './global.vue'
import GroupSettings from './group.vue'
import TreeView from './tree.vue'
import PluginSettings from './plugin.vue'
import KAlias from './alias.vue'
import { clone, send, store } from '@koishijs/client'

const route = useRoute()
const router = useRouter()

const path = computed<string>({
  get() {
    const name = route.path.slice(9)
    return name in plugins.value.paths ? name : '@global'
  },
  set(name) {
    if (!(name in plugins.value.paths)) name = '@global'
    router.replace('/plugins/' + name)
  },
})

const current = ref<Tree>()
const config = ref()

watch(() => plugins.value.paths[path.value], (value) => {
  current.value = value
  config.value = clone(value.config)
}, { immediate: true })

const name = computed(() => {
  const { label, target } = current.value
  const shortname = target || label
  if (shortname.includes('/')) {
    const [left, right] = shortname.split('/')
    return [`${left}/koishi-plugin-${right}`].find(name => name in store.packages)
  }
  return [
    `@koishijs/plugin-${shortname}`,
    `koishi-plugin-${shortname}`,
  ].find(name => name in store.packages)
})

const type = computed(() => {
  const env = envMap.value[name.value]
  if (!env) return
  if (env.warning && current.value.disabled) return 'warning'
  for (const name in env.using) {
    if (current.value.parent.config.$deps[name]) {
      if (env.impl.includes(name)) return 'warning'
    } else {
      if (env.using[name].required) return 'warning'
    }
  }
})

const menu = computed(() => {
  const isGlobal = current.value.path === '@global'
  const isGroup = current.value.children
  const isPlugin = !isGlobal && !isGroup
  const isDisabled = current.value.disabled
  return [{
    icon: isDisabled ? 'play' : 'stop',
    label: isDisabled ? '启用插件' : '停用插件',
    disabled: !isPlugin || !name.value,
    action: () => execute(isDisabled ? 'reload' : 'unload'),
  }, {
    type: isDisabled ? type.value : '',
    icon: isDisabled ? 'save' : 'check',
    label: isDisabled ? '保存配置' : '重载配置',
    disabled: isGroup || !isGlobal && !name.value,
    action: () => {
      if (isGlobal) {
        send('manager/app-reload', config.value)
      } else {
        execute(isDisabled ? 'unload' : 'reload')
      }
    },
  }, {
    type: 'error',
    icon: 'trash-can',
    label: isGroup ? '移除分组' : '移除插件',
    disabled: !current.value.path || isGlobal,
    action: () => removeItem(current.value.path),
  }, {
    icon: 'add-plugin',
    label: '添加插件',
    disabled: isPlugin,
    action: () => addItem(current.value.path, 'unload', ''),
  }, {
    icon: 'add-group',
    label: '添加分组',
    disabled: isPlugin,
    action: () => addItem(current.value.path, 'group', 'group'),
  }]
})

function execute(event: 'unload' | 'reload') {
  send(`manager/${event}`, current.value.path, config.value, current.value.target)
  if (current.value.target) {
    const segments = current.value.path.split(separator)
    segments[segments.length - 1] = current.value.target
    router.replace('/plugins/' + segments.join('/'))
  }
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

</style>
