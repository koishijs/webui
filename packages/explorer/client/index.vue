<template>
  <k-layout>
    <template #left>
      <el-scrollbar class="command-tree" ref="root">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
          ref="tree"
          :draggable="true"
          :data="store.explorer"
          :props="{ label: 'name', class: getClass }"
          :filter-node-method="filterNode"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          @node-click="handleClick"
          @node-drop="handleDrop"
        ></el-tree>
      </el-scrollbar>
    </template>

    {{ active }}
  </k-layout>
</template>

<script lang="ts" setup>

import { ref, computed, watch, onActivated, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dict, store } from '@koishijs/client'
import { Entry } from '@koishijs/plugin-explorer/src'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const tree = ref(null)
const root = ref<{ $el: HTMLElement }>(null)

watch(keyword, (val) => {
  tree.value.filter(val)
})

const files = computed<Dict<Entry>>(() => {
  const results = {}
  function traverse(entries: Entry[], prefix = '') {
    if (!entries) return
    for (const entry of entries) {
      entry.filename = prefix + entry.name
      results[entry.filename] = entry
      traverse(entry.children, entry.filename + '/')
    }
  }
  traverse(store.explorer)
  return results
})

const active = computed<string>({
  get() {
    const name = route.path.slice(7)
    return name in files.value ? name : ''
  },
  set(name) {
    if (!(name in files.value)) name = ''
    router.replace('/files/' + name)
  },
})

function getClass(data: Entry) {
  const words: string[] = []
  if (data.name === active.value) words.push('is-active')
  return words.join(' ')
}

function filterNode(value: string, data: Entry) {
  return data.name.includes(keyword.value)
}

interface Node {
  label: string
  data: Entry
  parent: Node
  expanded: boolean
  isLeaf: boolean
  childNodes: Node[]
}

function allowDrag(node: Node) {
  return false
}

function allowDrop(source: Node, target: Node, type: 'inner' | 'prev' | 'next') {
  return false
}

function handleClick(data: Entry) {
  active.value = data.filename
}

function handleDrop(source: Node, target: Node, position: 'before' | 'after' | 'inner', event: DragEvent) {
}

onActivated(async () => {
  const container = root.value.$el
  await nextTick()
  const element = container.querySelector('.el-tree-node.is-active') as HTMLElement
  if (!element) return
  root.value['setScrollTop'](element.offsetTop - (container.offsetHeight - element.offsetHeight) / 2)
})

</script>

<style lang="scss" scoped>

</style>
