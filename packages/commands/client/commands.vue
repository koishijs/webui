<template>
  <k-layout>
    <template #header>
      指令管理{{ active ? ' - ' + active : '' }}
    </template>

    <template #menu>
      <span class="menu-item" @click.stop.prevent="send('command/update', command.name, current)">
        <k-icon class="menu-icon" name="check"></k-icon>
      </span>
    </template>

    <template #left>
      <el-scrollbar class="command-tree">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
          ref="tree"
          :draggable="true"
          :data="store.commands"
          :props="{ label: 'name' }"
          :filter-node-method="filterNode"
          :default-expand-all="true"
          :expand-on-click-node="false"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          @node-click="handleClick"
          @node-drop="handleDrop"
        ></el-tree>
      </el-scrollbar>
    </template>

    <k-content class="command-config" v-if="active">
      <div class="navigation">
        <router-link
          class="k-button"
          v-if="store.config && store.packages && command.paths.length"
          :to="'/plugins/' + command.paths[0].replace(/\./, '/')"
        >前往插件</router-link>
        <router-link
          class="k-button"
          v-if="store.locales"
          :to="'/locales/commands/' + active.replace(/\./, '/')"
        >前往本地化</router-link>
      </div>

      <k-form
        :schema="schema.config"
        :initial="command.override.config"
        v-model="current.config"
      ></k-form>

      <template v-for="(option, key) in command.initial.options" :key="key">
        <k-form
          :schema="schema.options[key]"
          :initial="command.override.options[key]"
          v-model="current.options[key]"
        >
          <template #title>{{ option.syntax }}</template>
        </k-form>
      </template>
    </k-content>

    <k-empty v-else>
      <div>请在左侧选择指令</div>
    </k-empty>
  </k-layout>
</template>

<script lang="ts" setup>

import { clone, Dict, Schema, send, store, valueMap } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { CommandData, CommandState } from '@koishijs/plugin-commands'
import {} from '@koishijs/plugin-locales'
import {} from '@koishijs/plugin-market'
import { commands, createSchema } from './utils'

const route = useRoute()
const router = useRouter()

const tree = ref(null)
const keyword = ref('')
const current = ref<CommandState>()
const schema = ref<{
  config: Schema
  options: Dict<Schema>
}>()

watch(keyword, (val) => {
  tree.value.filter(val)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(10).replace(/\//, '.')
    return name in commands.value ? name : ''
  },
  set(name) {
    if (!(name in commands.value)) name = ''
    router.replace('/commands/' + name.replace(/\./, '/'))
  },
})

const command = computed(() => commands.value[active.value])

watch(command, (value) => {
  if (!value) return
  const { initial, override } = value
  schema.value = {
    config: createSchema('command', initial.config),
    options: valueMap(initial.options, (_, key) => createSchema('command-option', initial.options[key])),
  }
  current.value = clone(override)
}, { immediate: true })

interface Node {
  label: string
  data: CommandData
  parent: Node
  expanded: boolean
  isLeaf: boolean
  childNodes: Node[]
}

function filterNode(value: string, data: CommandData) {
  return data.name.includes(keyword.value)
}

function allowDrag(node: Node) {
  return !node.data.name.includes('.')
}

function allowDrop(source: Node, target: Node, type: 'inner' | 'prev' | 'next') {
  return source.parent !== (type === 'inner' ? target : target.parent)
}

function handleClick(data: CommandData) {
  active.value = data.name
}

function handleDrop(source: Node, target: Node, position: 'before' | 'after' | 'inner', event: DragEvent) {
  const parent = position === 'inner' ? target : target.parent
  send('command/rename', source.data.name, (parent.data.name || '') + '/' + source.data.name)
}

</script>

<style lang="scss">

.command-tree {
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

.command-config {
  .k-content > *:first-child {
    margin-top: 0;
  }

  .navigation {
    margin: 2rem 0;
    display: flex;
    gap: 0.5rem 1rem;
    flex-wrap: wrap;
  }
}

</style>
