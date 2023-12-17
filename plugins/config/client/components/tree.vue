<template>
  <el-scrollbar class="plugin-tree" ref="root">
    <div class="search">
      <el-input v-model="keyword" #suffix>
        <k-icon name="search"></k-icon>
      </el-input>
    </div>
    <el-tree
      ref="tree"
      node-key="id"
      :data="plugins.data"
      :draggable="true"
      :auto-expand-parent="false"
      :default-expanded-keys="plugins.expanded"
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      :props="{ class: getClass }"
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
      @node-click="handleClick"
      @node-contextmenu="trigger"
      @node-drop="handleDrop"
      @node-expand="handleExpand"
      @node-collapse="handleCollapse"
      #="{ node }">
      <div class="item">
        <div class="label" :title="getLabel(node)">
          {{ getLabel(node) }}
        </div>
        <div class="right">
          <span class="status-light ignore-disabled" :class="getStatus(node.data)"></span>
        </div>
      </div>
    </el-tree>
  </el-scrollbar>
</template>

<script lang="ts" setup>

import { ref, computed, onActivated, nextTick, watch } from 'vue'
import { send, useMenu } from '@koishijs/client'
import { Tree, getStatus, plugins } from './utils'

const props = defineProps<{
  modelValue: string
}>()

const trigger = useMenu('config.tree')

const emits = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: val => emits('update:modelValue', val),
})

function filterNode(value: string, data: Tree) {
  return data.name.toLowerCase().includes(keyword.value.toLowerCase())
}

interface Node {
  data: Tree
  label?: string
  parent: Node
  expanded: boolean
  isLeaf: boolean
  childNodes: Node[]
}

function getLabel(node: Node) {
  if (node.data.name === 'group') {
    return '分组：' + (node.label || node.data.path)
  } else {
    return node.label || node.data.name || '待添加'
  }
}

function allowDrag(node: Node) {
  return node.data.path !== ''
}

function allowDrop(source: Node, target: Node, type: 'inner' | 'prev' | 'next') {
  if (type !== 'inner') {
    return target.data.path !== '' || type === 'next'
  }
  return target.data.id.startsWith('group:')
}

function handleClick(tree: Tree) {
  model.value = tree.path
}

function handleExpand(data: Tree, target: Node, instance) {
  send('manager/meta', data.path, { $collapsed: null })
}

function handleCollapse(data: Tree, target: Node, instance) {
  send('manager/meta', data.path, { $collapsed: true })
}

function handleDrop(source: Node, target: Node, position: 'before' | 'after' | 'inner', event: DragEvent) {
  const parent = position === 'inner' ? target : target.parent
  let index = parent.childNodes.findIndex(node => node.data.path === source.data.path)
  if (!parent.data.path) index -= 1 // global config
  send('manager/teleport', source.data.parent?.path ?? '', source.data.id, parent.data.path, index)
}

function getClass(tree: Tree) {
  const words: string[] = []
  if (tree.children) words.push('is-group')
  if (tree.disabled) words.push('is-disabled')
  if (tree.path === model.value) words.push('is-active')
  return words.join(' ')
}

const root = ref<{ $el: HTMLElement }>(null)
const tree = ref(null)
const keyword = ref('')

watch(keyword, (val) => {
  tree.value.filter(val)
})

onActivated(async () => {
  const container = root.value.$el
  await nextTick()
  const element = container.querySelector('.el-tree-node.is-active') as HTMLElement
  if (!element) return
  root.value['setScrollTop'](element.offsetTop - (container.offsetHeight - element.offsetHeight) / 2)
})

</script>

<style lang="scss">

.plugin-tree {
  width: 100%;
  height: 100%;
  overflow: auto;

  .el-scrollbar__view {
    padding: 1rem 0;
    line-height: 2.25rem;
  }

  .search {
    padding: 0 1.5rem;
  }

  .k-icon-filter {
    height: 15px;
  }

  .el-tree-node {
    &.is-group > .el-tree-node__content {
      font-weight: bold;
    }
  }

  .el-tree-node__content {
    .item {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      transition: var(--color-transition);
    }

    .right {
      height: 100%;
      margin: 0 1.5rem 0 0.5rem;
    }
  }
}

</style>
