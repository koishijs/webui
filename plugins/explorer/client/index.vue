<template>
  <k-layout menu="explorer">
    <template #header>
      资源管理器{{ active ? ' - ' + active : '' }}
    </template>

    <template #left>
      <el-scrollbar ref="root" @contextmenu.stop="trigger($event, rootEntry)">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
          ref="tree"
          node-key="filename"
          :draggable="true"
          :data="data"
          :props="{ label: 'name', class: getClass }"
          :filter-node-method="filterNode"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          :default-expanded-keys="expandedKeys"
          @node-click="handleClick"
          @node-contextmenu="trigger"
          @node-expand="handleExpand"
          @node-collapse="handleCollapse"
          @node-drop="handleDrop"
          #="{ node }">
          <div class="item">
            <div class="label">
              <input
                v-focus
                v-if="node.data.filename === renaming"
                v-model="node.data.name"
                @keypress.enter.prevent="confirmRename(node.data)"
                @keydown.escape.prevent="cancelRename()"
              />
              <template v-else>{{ node.data.name }}</template>
            </div>
            <div class="right">
              <template v-if="node.data.oldValue !== node.data.newValue">M</template>
            </div>
          </div>
        </el-tree>
      </el-scrollbar>
    </template>

    <k-empty v-if="files[active]?.type !== 'file'">在左侧栏选择要查看的文件</k-empty>
    <div v-else-if="files[active]?.loading">
      <div class="el-loading-spinner">
        <svg class="circular" viewBox="25 25 50 50">
          <circle class="path" cx="50" cy="50" r="20" fill="none"></circle>
        </svg>
        <p class="el-loading-text">正在加载……</p>
      </div>
    </div>
    <template v-else-if="files[active]?.mime">
      <k-image-viewer v-if="files[active].mime.startsWith('image/')" :src="files[active].newValue" />
      <audio v-else-if="files[active].mime.startsWith('audio/')" :src="files[active].newValue" controls />
      <video v-else-if="files[active].mime.startsWith('video/')" :src="files[active].newValue" controls />
      <div v-else>不支持的文件格式：{{ files[active].mime }}</div>
    </template>
    <div ref="editor" v-else class="editor"></div>
  </k-layout>

  <el-dialog v-model="showRemoving" destroy-on-close>
    你真的要删除文件{{ removing?.endsWith('/') ? '夹' : '' }} {{ removing }} 吗？
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="removing = null">取消</el-button>
        <el-button type="primary" @click="send('explorer/remove', removing), removing = null">
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { ref, computed, watch, onActivated, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useElementSize } from '@vueuse/core'
import { base64ToArrayBuffer, send, store, useColorMode, useContext, useMenu } from '@koishijs/client'
import { Entry } from '@koishijs/plugin-explorer'
import { files, TreeEntry, uploading, vFocus } from './store'
import { model } from './editor'
import * as monaco from 'monaco-editor'

const ctx = useContext()
const route = useRoute()
const router = useRouter()
const keyword = ref('')
const tree = ref(null)
const root = ref<{ $el: HTMLElement }>(null)
const editor = ref(null)
const renaming = ref<string>(null)
const data = ref<TreeEntry[]>([])
const removing = ref<string>(null)

const trigger = useMenu('explorer.tree')

ctx.action('explorer.save', {
  disabled: () => files[active.value]?.newValue === files[active.value]?.oldValue,
  action: async () => {
    const content = files[active.value].newValue
    await send('explorer/write', active.value, content)
    files[active.value].oldValue = content
  },
})

ctx.action('explorer.refresh', {
  action: () => send('explorer/refresh'),
})

ctx.action('explorer.tree.create-file', {
  disabled: ({ explorer }) => explorer.tree.type !== 'directory',
  action: ({ explorer }) => createEntry(explorer.tree, 'file'),
})

ctx.action('explorer.tree.create-directory', {
  disabled: ({ explorer }) => explorer.tree.type !== 'directory',
  action: ({ explorer }) => createEntry(explorer.tree, 'directory'),
})

ctx.action('explorer.tree.upload', {
  disabled: ({ explorer }) => explorer.tree.type !== 'directory',
  action: ({ explorer }) => uploading.value = explorer.tree.filename + '/',
})

ctx.action('explorer.tree.download', {
  disabled: ({ explorer }) => explorer.tree.type !== 'file',
  action: ({ explorer }) => downloadFile(explorer.tree.filename),
})

ctx.action('explorer.tree.remove', {
  disabled: ({ explorer }) => !explorer.tree.filename,
  action: ({ explorer }) => initRemove(explorer.tree),
})

ctx.action('explorer.tree.rename', {
  disabled: ({ explorer }) => !explorer.tree.filename,
  action: ({ explorer }) => {
    cancelRename()
    renaming.value = explorer.tree.filename
  },
})

const showRemoving = computed({
  get: () => !!removing.value,
  set: (v) => removing.value = null,
})

function* getExpanded(tree: TreeEntry[]) {
  for (const item of tree) {
    if (item.expanded) yield item.filename
    if (item.children) yield* getExpanded(item.children)
  }
}

const expandedKeys = computed(() => [...getExpanded(data.value)])

function merge(base: TreeEntry[], head: Entry[]) {
  return head?.map((entry) => {
    const old = base.find(old => old.type === entry.type && old.name === entry.name)
    if (old) {
      return { ...old, ...entry, children: merge(old.children, entry.children) }
    } else {
      return entry
    }
  })
}

watch(() => store.explorer, (value) => {
  data.value = merge(data.value, value) || []
}, { immediate: true })

let instance: monaco.editor.IStandaloneCodeEditor = null

watch(keyword, (val) => {
  tree.value.filter(val)
})

const mode = useColorMode()

watch(editor, () => {
  if (!editor.value) return instance = null
  instance = monaco.editor.create(editor.value, {
    model,
    theme: 'vs-' + mode.value,
    tabSize: 2,
  })
})

const { width, height } = useElementSize(editor)

watch([width, height], () => {
  instance?.layout()
})

watch(mode, () => {
  monaco.editor.setTheme('vs-' + mode.value)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(6)
    return name in files ? name : ''
  },
  set(name) {
    if (!(name in files)) name = ''
    router.replace('/files' + name)
  },
})

function getClass(data: TreeEntry) {
  const words: string[] = []
  if (data.name === active.value) words.push('is-active')
  return words.join(' ')
}

function filterNode(value: string, data: TreeEntry) {
  return data.name.toLowerCase().includes(keyword.value.toLowerCase())
}

function createEntry(entry: TreeEntry, type: 'file' | 'directory') {
  cancelRename()
  renaming.value = entry.filename + '/'
  files[renaming.value] = {
    type,
    name: '',
    filename: renaming.value,
    oldValue: '',
    newValue: '',
  }
  entry.expanded = true
  entry.children.push(files[renaming.value])
}

function confirmRename(entry: TreeEntry) {
  const segments = entry.filename.split(/\//g)
  const name = segments.pop()
  segments.push(entry.name)
  const filename = segments.join('/')
  if (filename in files || !entry.name) {
    if (name) {
      entry.name = name
    } else {
      delete files[entry.filename]
      const parent = files[segments.slice(0, -1).join('/')]?.children || data.value
      parent.splice(parent.indexOf(entry), 1)
    }
  } else if (entry.filename !== filename) {
    files[filename] = entry
    delete files[entry.filename]
    if (name) {
      send('explorer/rename', entry.filename, filename)
      active.value = filename
    } else if (entry.type === 'file') {
      send('explorer/write', filename, '')
      active.value = filename
    } else {
      send('explorer/mkdir', filename)
    }
    entry.filename = filename
  }
  renaming.value = null
}

function cancelRename() {
  if (!renaming.value) return
  const entry = files[renaming.value]
  const segments = entry.filename.split(/\//g)
  const name = segments.pop()
  segments.push(entry.name)
  if (name) {
    entry.name = name
  } else {
    delete files[entry.filename]
    const parent = files[segments.slice(0, -1).join('/')]?.children || data.value
    parent.splice(parent.indexOf(entry), 1)
  }
  renaming.value = null
}

interface Node {
  label: string
  data: TreeEntry
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

watch(() => files[active.value], async (entry) => {
  if (entry?.type !== 'file') return
  if (typeof entry.oldValue !== 'string') {
    entry.loading = send('explorer/read', entry.filename)
    const { base64, mime } = await entry.loading
    entry.loading = null
    entry.mime = mime
    if (mime) {
      entry.oldValue = entry.newValue = `data:${mime};base64,${base64}`
    } else {
      entry.oldValue = entry.newValue = atob(base64)
    }
  }
  model.setValue(entry.newValue)
  monaco.editor.setModelLanguage(model, getLanguage(entry.filename))
}, { immediate: true })

model.onDidChangeContent((e) => {
  const entry = files[active.value]
  if (!entry) return
  entry.newValue = model.getValue()
})

async function handleClick(data: TreeEntry) {
  if (data.type !== 'file') return
  active.value = data.filename
}

const rootEntry = computed<TreeEntry>(() => ({
  name: '',
  filename: '',
  type: 'directory',
  children: data.value,
}))

function handleExpand(entry: TreeEntry) {
  entry.expanded = true
}

function handleCollapse(entry: TreeEntry) {
  entry.expanded = false
}

function handleDrop(source: Node, target: Node, position: 'before' | 'after' | 'inner', event: DragEvent) {
}

function initRemove(entry: TreeEntry) {
  cancelRename()
  removing.value = entry.filename + (entry.type === 'directory' ? '/' : '')
}

onActivated(async () => {
  const container = root.value.$el
  await nextTick()
  const element = container.querySelector('.el-tree-node.is-active') as HTMLElement
  if (!element) return
  root.value['setScrollTop'](element.offsetTop - (container.offsetHeight - element.offsetHeight) / 2)
})

async function downloadFile(filename: string) {
  const { base64 } = await send('explorer/read', filename)
  const blob = new Blob([base64ToArrayBuffer(base64)])
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

</script>

<style lang="scss" scoped>

.editor {
  height: 100%;
  width: 100%;
  position: absolute;
}

.search {
  margin-top: 1rem;
  padding: 0 1.5rem;
}

.el-tree {
  margin-bottom: 1rem;
}

.item {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
}

.label {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: var(--color-transition);
}

.right {
  height: 100%;
  margin: 0 0.75rem;
}

</style>
