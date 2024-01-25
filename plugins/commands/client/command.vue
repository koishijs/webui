<template>
  <div class="navigation flex flex-wrap gap-x-4 gap-y-2 my-8">
    <router-link
      class="el-button"
      v-if="store.config && store.packages && command.paths.length"
      :to="'/plugins/' + command.paths[0].replace(/\./, '/')"
    >前往插件</router-link>
    <router-link
      class="el-button"
      v-if="store.locales"
      :to="'/locales/commands/' + command.name.replace(/\./, '/')"
    >前往本地化</router-link>
  </div>

  <div class="mb-8">
    <h2 class="k-schema-header">名称设置</h2>
    <table>
      <colgroup>
        <col/>
        <col width="240px"/>
      </colgroup>
      <tr v-for="([name, item], index) in Object.entries(current.aliases)" :key="name">
        <td class="text-left alias-name" :class="{ disabled: item.filter === false }">{{ name }}</td>
        <td class="text-right">
          <el-button
            v-if="index > 0"
            :disabled="!item"
            @click="setDefault(name)"
          >{{ index > 0 ? '设为默认' : '显示名称' }}</el-button>
          <el-button v-if="item.filter !== false" @click="deleteAlias(name)">
            {{ command.initial.aliases[name] ? '禁用' : '删除' }}
          </el-button>
          <el-button v-else @click="recoverAlias(name)">恢复</el-button>
        </td>
      </tr>
    </table>
    <p>
      <el-button @click="showAliasDialog = true">添加别名</el-button>
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

  <el-dialog class="command-alias-dialog" destroy-on-close v-model="showAliasDialog" title="编辑别名" @open="handleOpen">
    <el-input ref="inputEl" :class="{ invalid }" v-model="inputText" @keydown.enter.stop.prevent="onEnter" placeholder="请输入名称"></el-input>
    <template #footer>
      <el-button @click="showAliasDialog = false">取消</el-button>
      <el-button type="primary" :disabled="invalid" @click="onEnter">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

import { ref, watch, computed, nextTick } from 'vue'
import { Schema, Dict, valueMap, clone, store, send, pick, useContext, deepEqual, useRpc } from '@koishijs/client'
import { createSchema } from './utils'
import { CommandData, CommandState } from '../lib'

const ctx = useContext()
const data = useRpc<Dict<CommandData>>()

const props = defineProps<{
  command: CommandData
}>()

const schema = ref<{
  config: Schema
  options: Dict<Schema>
}>()

const inputEl = ref()
const inputText = ref<string>()
const showAliasDialog = ref(false)
const current = ref<CommandState>()

watch(() => props.command, (value) => {
  if (!value) return
  const { initial, override } = value
  schema.value = {
    config: createSchema('command', initial.config),
    options: valueMap(initial.options, (_, key) => createSchema('command-option', initial.options[key])),
  }
  current.value = clone(override)
}, { immediate: true })

ctx.action('command.update', {
  disabled: () => deepEqual(
    pick(current.value, ['config', 'options']),
    pick(props.command.override, ['config', 'options']),
  ),
  action: () => send('command/update', props.command.name, pick(current.value, ['config', 'options'])),
})

function setDefault(name: string) {
  const item = current.value.aliases[name]
  current.value.aliases = {
    [name]: item,
    ...current.value.aliases,
  }
  send('command/aliases', props.command.name, current.value.aliases)
}

function deleteAlias(name: string) {
  if (props.command.initial.aliases[name]) {
    current.value.aliases[name].filter = false
  } else {
    delete current.value.aliases[name]
  }
  send('command/aliases', props.command.name, current.value.aliases)
}

function recoverAlias(name: string) {
  current.value.aliases[name] = props.command.initial.aliases[name]
  send('command/aliases', props.command.name, current.value.aliases)
}

const aliases = computed(() => {
  return Object.values(data.value).flatMap(command => command.override.aliases)
})

const invalid = computed(() => {
  return !inputText.value || aliases.value[inputText.value]
})

async function handleOpen() {
  // https://github.com/element-plus/element-plus/issues/15250
  await nextTick()
  inputEl.value?.focus()
}

async function onEnter() {
  if (!invalid.value) {
    current.value.aliases[inputText.value] = {}
    await send('command/aliases', props.command.name, current.value.aliases)
  }
  showAliasDialog.value = false
  inputText.value = ''
}

</script>

<style lang="scss" scoped>

.alias-name.disabled {
  text-decoration: line-through;
  color: var(--k-color-disabled);
}

</style>
