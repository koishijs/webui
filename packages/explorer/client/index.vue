<template>
  <k-layout>
    <template #header>
      资源管理器 - {{ active }}
    </template>

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

    <div ref="editor" v-if="files[active]?.type === 'file'" class="editor"></div>
    <k-empty v-else>在左侧栏选择要查看的文件</k-empty>
  </k-layout>
</template>

<script lang="ts" setup>

import { ref, computed, watch, onActivated, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark, useElementSize } from '@vueuse/core'
import { Dict, send, store } from '@koishijs/client'
import { Entry } from '@koishijs/plugin-explorer/src'
import { model } from './editor'
import * as monaco from 'monaco-editor'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const tree = ref(null)
const root = ref<{ $el: HTMLElement }>(null)
const editor = ref(null)

let instance: monaco.editor.IStandaloneCodeEditor = null

watch(keyword, (val) => {
  tree.value.filter(val)
})

const isDark = useDark()

watch(editor, () => {
  if (!editor.value) return instance = null
  instance = monaco.editor.create(editor.value, {
    model,
    theme: isDark.value ? 'vs-dark' : 'vs-light',
    tabSize: 2,
  })
})

const { width, height } = useElementSize(editor)

watch([width, height], () => {
  instance?.layout()
})

watch(isDark, () => {
  monaco.editor.setTheme(isDark.value ? 'vs-dark' : 'vs-light')
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

function getLanguage(filename: string) {
  const index = filename.lastIndexOf('.')
  const extension = index === -1 ? '' : filename.slice(index)
  for (const language of monaco.languages.getLanguages()) {
    if (language.extensions?.includes(extension)) return language.id
  }
  return 'plaintext'
}

async function updateContent(filename: string) {
  const content = await send('explorer/file', filename)
  model.setValue(content)
  monaco.editor.setModelLanguage(instance.getModel(), getLanguage(filename))
}

watch(active, async (filename) => {
  if (files.value[filename]?.type !== 'file') return
  await updateContent(filename)
}, { immediate: true })

async function handleClick(data: Entry) {
  if (data.type !== 'file') return
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

.editor {
  height: 100%;
  width: 100%;
  position: absolute;
}

</style>
