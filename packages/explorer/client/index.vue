<template>
  <k-layout>
    <template #header>
      资源管理器{{ active ? ' - ' + active : '' }}
    </template>

    <template #menu>
      <span class="menu-item" :class="{ disabled: files[active]?.newValue === files[active]?.oldValue }" @click.prevent="send('explorer/write', active, files[active].newValue)">
        <k-icon class="menu-icon" name="save"></k-icon>
      </span>
      <span class="menu-item" @click.prevent="send('explorer/refresh')">
        <k-icon class="menu-icon" name="refresh"></k-icon>
      </span>
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
          node-key="filename"
          :draggable="true"
          :data="data"
          :props="{ label: 'name', class: getClass }"
          :filter-node-method="filterNode"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          :default-expanded-keys="expandedKeys"
          @node-click="handleClick"
          @node-contextmenu="handleContextMenu"
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
                @keypress.enter.prevent="confirmRename()"
                @keypress.esc.prevent="cancelRename()"
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

    <div ref="editor" v-if="files[active]?.type === 'file'" class="editor"></div>
    <k-empty v-else>在左侧栏选择要查看的文件</k-empty>
  </k-layout>

  <teleport to="body">
    <div ref="menu" class="context-menu" v-if="menuTarget">
      <div class="item" v-if="menuTarget.type === 'directory'" @click.prevent="createEntry('file')">
        新建文件
      </div>
      <div class="item" v-if="menuTarget.type === 'directory'" @click.prevent="createEntry('directory')">
        新建文件夹
      </div>
      <div class="item" @click.prevent="cancelRename(), removing = menuTarget.filename">
        删除
      </div>
      <div class="item" @click.prevent="cancelRename(), renaming = menuTarget.filename">
        重命名
      </div>
    </div>
  </teleport>

  <el-dialog v-model="showRemoving" destroy-on-close>
    你真的要删除文件 {{ removing }} 吗？
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

import { Directive, ref, computed, watch, onActivated, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark, useElementSize, useEventListener } from '@vueuse/core'
import { send, store } from '@koishijs/client'
import { Entry } from '@koishijs/plugin-explorer/src'
import { files } from './store'
import { model } from './editor'
import * as monaco from 'monaco-editor'

const vFocus: Directive = {
  mounted: (el) => el.focus()
}

interface TreeEntry extends Entry {
  expanded?: boolean
}

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const tree = ref(null)
const menu = ref(null)
const root = ref<{ $el: HTMLElement }>(null)
const editor = ref(null)
const menuTarget = ref<TreeEntry>(null)
const renaming = ref<string>(null)
const data = ref<TreeEntry[]>([])
const removing = ref<string>(null)

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

useEventListener('click', () => {
  menuTarget.value = null
})

useEventListener('contextmenu', () => {
  menuTarget.value = null
})

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

const active = computed<string>({
  get() {
    const name = route.path.slice(7)
    return name in files ? name : ''
  },
  set(name) {
    if (!(name in files)) name = ''
    router.replace('/files/' + name)
  },
})

function getClass(data: TreeEntry) {
  const words: string[] = []
  if (data.name === active.value) words.push('is-active')
  return words.join(' ')
}

function filterNode(value: string, data: TreeEntry) {
  return data.name.includes(keyword.value)
}

function createEntry(type: 'file' | 'directory') {
  cancelRename()
  renaming.value = menuTarget.value.filename + '/'
  files[renaming.value] = {
    type,
    name: '',
    filename: renaming.value,
    oldValue: '',
    newValue: '',
  }
  menuTarget.value.expanded = true
  menuTarget.value.children.push(files[renaming.value])
}

function confirmRename() {
  const entry = files[renaming.value]
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
    entry.oldValue = entry.newValue = await send('explorer/read', entry.filename)
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

async function handleContextMenu(event: MouseEvent, data: TreeEntry) {
  event.preventDefault()
  menuTarget.value = data
  await nextTick()
  const { clientX, clientY } = event
  menu.value.style.left = clientX + 'px'
  menu.value.style.top = clientY + 'px'
}

function handleExpand(entry: TreeEntry) {
  entry.expanded = true
}

function handleCollapse(entry: TreeEntry) {
  entry.expanded = false
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

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 12rem;
  padding: 0.5rem 0;
  border-radius: 4px;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: var(--color-transition);
  font-size: 14px;

  .item {
    user-select: none;
    padding: 0.25rem 1.5rem;
    cursor: pointer;
    transition: var(--color-transition);

    &:hover {
      background-color: var(--hover-bg);
    }
  }
}

</style>
