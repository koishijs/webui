<template>
  <k-layout>
    <template #header>
      指令管理{{ active ? ' - ' + active : '' }}
    </template>

    <template #menu>
      <span class="menu-item" :class="{ disabled: !command }" @click.stop.prevent="updateConfig">
        <k-icon class="menu-icon" name="check"></k-icon>
      </span>
      <span class="menu-item" :class="{ disabled: !command?.create }" @click.stop.prevent="removeCommand">
        <k-icon class="menu-icon" name="trash-can"></k-icon>
      </span>
      <span class="menu-item" @click.stop.prevent="title = '添加指令'">
        <k-icon class="menu-icon" name="add"></k-icon>
      </span>
    </template>

    <template #left>
      <el-scrollbar class="command-tree w-full h-full overflow-auto" ref="root">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
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
        ></el-tree>
      </el-scrollbar>
    </template>

    <k-content class="command-config" v-if="active">
      <div class="navigation flex flex-wrap gap-x-4 gap-y-2 my-8">
        <router-link
          class="el-button"
          v-if="store.config && store.packages && command.paths.length"
          :to="'/plugins/' + command.paths[0].replace(/\./, '/')"
        >前往插件</router-link>
        <router-link
          class="el-button"
          v-if="store.locales"
          :to="'/locales/commands/' + active.replace(/\./, '/')"
        >前往本地化</router-link>
      </div>

      <div class="aliases">
        <h2 class="k-schema-header">名称设置</h2>
        <table>
          <colgroup>
            <col/>
            <col width="240px"/>
          </colgroup>
          <tr v-for="([name, item], index) in Object.entries(current.aliases)" :key="name">
            <td class="text-left alias-name" :class="{ disabled: !item }">{{ name }}</td>
            <td class="text-right">
              <el-button
                v-if="index > 0"
                :disabled="!item"
                @click="setDefault(name)"
              >{{ index > 0 ? '设为默认' : '显示名称' }}</el-button>
              <el-button v-if="item" @click="deleteAlias(name)">{{ command.initial.aliases[name] ? '禁用' : '删除' }}</el-button>
              <el-button v-else @click="recoverAlias(name)">恢复</el-button>
            </td>
          </tr>
        </table>
        <p>
          <el-button @click="title = '编辑别名'">添加别名</el-button>
        </p>
      </div>

      <k-form
        :schema="schema.config"
        :initial="command.override.config"
        v-model="current.config"
        #title
      >指令设置</k-form>

      <template v-for="(option, key) in command.initial.options" :key="key">
        <k-form
          :schema="schema.options[key]"
          :initial="command.override.options[key]"
          v-model="current.options[key]"
          #title
        >选项：{{ option.syntax }}</k-form>
      </template>
    </k-content>

    <k-empty v-else>
      <div>请在左侧选择指令</div>
    </k-empty>

    <el-dialog class="command-dialog" destroy-on-close v-model="dialog" :title="title" @open="handleOpen">
      <el-input ref="inputEl" :class="{ invalid }" v-model="alias" @keydown.enter.stop.prevent="onEnter" placeholder="请输入名称"></el-input>
      <template #footer>
        <el-button @click="title = ''">取消</el-button>
        <el-button type="primary" :disabled="invalid" @click="onEnter">确定</el-button>
      </template>
    </el-dialog>
  </k-layout>
</template>

<script lang="ts" setup>

import { clone, Dict, pick, Schema, send, store, valueMap } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, nextTick, onActivated, ref, watch } from 'vue'
import { CommandData, CommandState } from '@koishijs/plugin-commands'
import {} from '@koishijs/plugin-locales'
import {} from '@koishijs/plugin-config'
import { commands, createSchema } from './utils'

const route = useRoute()
const router = useRouter()

const inputEl = ref()
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

const aliases = computed(() => {
  return Object.values(commands.value).flatMap(command => command.override.aliases)
})

const invalid = computed(() => {
  return !alias.value || aliases.value[alias.value]
})

const dialog = computed({
  get: () => !!title.value,
  set: (value) => {
    if (!value) title.value = ''
  },
})

async function handleOpen() {
  // https://github.com/element-plus/element-plus/issues/15250
  await nextTick()
  inputEl.value?.focus()
}

watch(keyword, (val) => {
  tree.value.filter(val)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(10).replace(/\//g, '.')
    return name in commands.value ? name : ''
  },
  set(name) {
    if (!(name in commands.value)) name = ''
    router.replace('/commands/' + name.replace(/\./g, '/'))
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
  if (title.value === '添加指令') {
    await send('command/create', alias.value)
  } else if (!invalid.value) {
    current.value.aliases[alias.value] = {}
    await send('command/aliases', command.value.name, current.value.aliases)
  }
  alias.value = ''
  title.value = ''
}

function updateConfig() {
  send('command/update', command.value.name, pick(current.value, ['config', 'options']))
}

function removeCommand() {
  send('command/remove', command.value.name)
}

function setDefault(name: string) {
  const item = current.value.aliases[name]
  current.value.aliases = {
    [name]: item,
    ...current.value.aliases,
  }
  send('command/aliases', command.value.name, current.value.aliases)
}

function deleteAlias(name: string) {
  if (command.value.initial.aliases[name]) {
    current.value.aliases[name] = false
  } else {
    delete current.value.aliases[name]
  }
  send('command/aliases', command.value.name, current.value.aliases)
}

function recoverAlias(name: string) {
  current.value.aliases[name] = command.value.initial.aliases[name]
  send('command/aliases', command.value.name, current.value.aliases)
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

  .aliases {
    margin-bottom: 2rem;

    * + .button {
      margin-left: 0.5rem;
    }

    .button:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .alias-name.disabled {
    text-decoration: line-through;
    color: var(--k-color-disabled);
  }
}

.command-dialog {
  .el-input.invalid .el-input__wrapper {
    box-shadow: 0 0 0 1px var(--el-color-danger) inset;
  }
}

</style>
