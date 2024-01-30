<template>
  <k-layout menu="command">
    <template #header>
      指令管理{{ active ? ' - ' + active : '' }}
    </template>

    <template #left>
      <el-scrollbar class="command-tree w-full h-full overflow-auto" ref="root">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
          ref="treeEl"
          :draggable="true"
          :data="treeData"
          :props="{ label: 'name', class: getClass }"
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
      <Command :command="data[active]"></Command>
    </k-content>

    <k-empty v-else>
      <div>请在左侧选择指令</div>
    </k-empty>

    <el-dialog class="command-dialog" destroy-on-close v-model="showCreateDialog" title="添加指令" @open="handleOpen">
      <el-input ref="inputEl" :class="{ invalid: !inputText }" v-model="inputText" @keydown.enter.stop.prevent="onEnter" placeholder="请输入名称"></el-input>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!inputText" @click="onEnter">确定</el-button>
      </template>
    </el-dialog>
  </k-layout>
</template>

<script lang="ts" setup>

import { Dict, send, useRpc, useContext } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, nextTick, onActivated, ref, watch } from 'vue'
import { CommandData } from '@koishijs/plugin-commands'
import {} from '@koishijs/plugin-locales'
import {} from '@koishijs/plugin-config'
import Command from './command.vue'

const route = useRoute()
const router = useRouter()
const ctx = useContext()

const data = useRpc<Dict<CommandData>>()

const inputEl = ref()
const inputText = ref('')
const treeEl = ref(null)
const keyword = ref('')
const root = ref<{ $el: HTMLElement }>(null)

const treeData = computed(() => {
  const topLevel = { ...data.value }
  for (const name in data.value) {
    for (const name2 of data.value[name].children) {
      delete topLevel[name2]
    }
  }
  function traverse(names: string[]) {
    return names.sort().map((name) => {
      const command = data.value[name]
      return { ...command, children: traverse(command.children) }
    })
  }
  return traverse(Object.keys(topLevel))
})

const showCreateDialog = ref(false)

async function handleOpen() {
  // https://github.com/element-plus/element-plus/issues/15250
  await nextTick()
  inputEl.value?.focus()
}

watch(keyword, (val) => {
  treeEl.value.filter(val)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(10).replace(/\//g, '.')
    return name in data.value ? name : ''
  },
  set(name) {
    if (!(name in data.value)) name = ''
    router.replace('/commands/' + name.replace(/\./g, '/'))
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

async function onEnter() {
  await send('command/create', inputText.value)
  inputText.value = ''
}

onActivated(async () => {
  const container = root.value.$el
  await nextTick()
  const element = container.querySelector('.el-tree-node.is-active') as HTMLElement
  if (!element) return
  root.value['setScrollTop'](element.offsetTop - (container.offsetHeight - element.offsetHeight) / 2)
})

ctx.action('command.create', {
  action: () => showCreateDialog.value = true,
})

ctx.action('command.remove', {
  disabled: () => !data.value[active.value]?.create,
  action: () => send('command/remove', data.value[active.value].name),
})

</script>

<style lang="scss">

.command-tree {
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
