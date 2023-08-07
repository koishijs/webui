<template>
  <k-layout>
    <template #header>
      权限管理{{ active ? ' - ' + active : '' }}
    </template>

    <template #menu>
      <!-- <span class="menu-item" :class="{ disabled: !command }" @click.stop.prevent="updateConfig">
        <k-icon class="menu-icon" name="check"></k-icon>
      </span>
      <span class="menu-item" :class="{ disabled: !command?.create }" @click.stop.prevent="removeCommand">
        <k-icon class="menu-icon" name="trash-can"></k-icon>
      </span>
      <span class="menu-item" @click.stop.prevent="title = '添加指令'">
        <k-icon class="menu-icon" name="plus"></k-icon>
      </span> -->
    </template>

    <template #left>
      <el-scrollbar class="command-tree" ref="root">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <!-- <el-tree
          ref="tree"
          :draggable="true"
          :data="store.commands"
          :props="{ label: 'name', class: getClass }"
          :filter-node-method="filterNode"
          :default-expand-all="true"
          :expand-on-click-node="false"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          @node-click="handleClick"
          @node-drop="handleDrop"
        ></el-tree> -->
      </el-scrollbar>
    </template>

    <k-content class="command-config" v-if="active">
    </k-content>

    <k-empty v-else>
      <div>请在左侧选择权限</div>
    </k-empty>
  </k-layout>
</template>

<script lang="ts" setup>

import { clone, Dict, pick, Schema, send, store, valueMap } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, nextTick, onActivated, ref, watch } from 'vue'
import { CommandData, CommandState } from '@koishijs/plugin-commands'
import {} from '@koishijs/plugin-locales'
import {} from '@koishijs/plugin-config'

const route = useRoute()
const router = useRouter()

const title = ref('')
const alias = ref('')
const tree = ref(null)
const keyword = ref('')
const current = ref<CommandState>()
const root = ref<{ $el: HTMLElement }>(null)
const schema = ref<{
  config: Schema
  options: Dict<Schema>
}>()

const dialog = computed({
  get: () => !!title.value,
  set: (value) => {
    if (!value) title.value = ''
  },
})

watch(keyword, (val) => {
  tree.value.filter(val)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(8)
    return name in store.groups ? name : ''
  },
  set(name) {
    if (!(name in store.groups)) name = ''
    router.replace('/groups/' + name.replace(/\./g, '/'))
  },
})

interface Node {
  label: string
  data: CommandData
  parent: Node
  expanded: boolean
  isLeaf: boolean
  childNodes: Node[]
}

function getClass(data: CommandData) {
  const words: string[] = []
  if (data.name === active.value) words.push('is-active')
  return words.join(' ')
}

function filterNode(value: string, data: CommandData) {
  return data.name.toLowerCase().includes(keyword.value.toLowerCase())
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
  send('command/teleport', source.data.name, parent.data.name)
}

onActivated(async () => {
  const container = root.value.$el
  await nextTick()
  const element = container.querySelector('.el-tree-node.is-active') as HTMLElement
  if (!element) return
  root.value['setScrollTop'](element.offsetTop - (container.offsetHeight - element.offsetHeight) / 2)
})

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
}

</style>
