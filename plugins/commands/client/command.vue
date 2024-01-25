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
    <h2 class="k-schema-header">
      别名设置
      <el-button class="float-right mr-4" @click="(inputName = target = '', inputSource = '')">添加</el-button>
    </h2>
    <table>
      <tr v-for="([name, alias], index) in Object.entries(current.aliases)" :key="name">
        <td class="text-left">
          <span class="alias-name" :class="{ disabled: alias.filter === false }">{{ name }}</span>
          {{ stringify(alias) ? `(${stringify(alias)})` : '' }}
        </td>
        <td class="text-right">
          <el-button
            v-if="index > 0"
            :disabled="alias.filter === false"
            @click="setDefault(name)"
          >{{ index > 0 ? '设为默认' : '显示名称' }}</el-button>
          <el-button v-if="alias.filter !== false" @click="deleteAlias(name)">
            {{ command.initial.aliases[name] ? '禁用' : '删除' }}
          </el-button>
          <el-button v-else @click="recoverAlias(name)">恢复</el-button>
        </td>
      </tr>
    </table>
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

  <el-dialog
    class="command-alias-dialog"
    destroy-on-close
    v-model="showAliasDialog"
    :title="target ? '编辑别名' : '添加别名'"
    @open="handleOpen"
  >
    <div>
      <el-input
        ref="inputEl"
        :class="{ invalid: invalidName }"
        v-model="inputName"
        @keydown.enter.stop.prevent="onEnter"
        placeholder="请输入别名"
      ></el-input>
    </div>
    <div class="mt-2">
      <el-input
        :class="{ invalid: parsed.error }"
        v-model="inputSource"
        @keydown.enter.stop.prevent="onEnter"
        placeholder="请输入参数 (可选)"
      ></el-input>
    </div>
    <template #footer>
      <el-button @click="showAliasDialog = false">取消</el-button>
      <el-button type="primary" :disabled="invalidName || parsed.error" @click="onEnter">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

import { ref, watch, computed, nextTick } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { Schema, Dict, valueMap, clone, store, send, pick, useContext, deepEqual, useRpc } from '@koishijs/client'
import { createSchema } from './utils'
import { CommandData, CommandState } from '../lib'
import type { Argv, Command } from 'koishi'

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
const inputName = ref('')
const inputSource = ref('')
const target = ref<string>(null)
const current = ref<CommandState>()

const showAliasDialog = computed({
  get: () => typeof target.value === 'string',
  set: () => target.value = null,
})

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

function stringify(alias: Command.Alias) {
  return [
    ...alias.args || [],
    ...Object.entries(alias.options || {}).map(([key, value]) => {
      return value === true ? `--${key}` : `--${key}=${value}`
    }),
  ].join(' ')
}

async function handleOpen() {
  // https://github.com/element-plus/element-plus/issues/15250
  await nextTick()
  inputEl.value?.focus()
}

const aliases = computed(() => {
  return Object.values(data.value).flatMap(command => command.override.aliases)
})

const invalidName = computed(() => {
  return !inputName.value || aliases.value[inputName.value]
})

const parsed = ref<Argv>({})

watchDebounced(inputSource, async (value) => {
  if (!value.trim()) return
  parsed.value = await send('command/parse', props.command.name, inputSource.value)
}, { debounce: 500 })

async function onEnter() {
  if (invalidName.value) return
  if (inputSource.value.trim()) {
    const alias = await send('command/parse', props.command.name, inputSource.value)
    if (alias.error) return
    current.value.aliases[inputName.value] = alias
  } else {
    current.value.aliases[inputName.value] = {}
  }
  await send('command/aliases', props.command.name, current.value.aliases)
  showAliasDialog.value = false
  inputSource.value = ''
}

</script>

<style lang="scss" scoped>

.alias-name.disabled {
  text-decoration: line-through;
  color: var(--k-color-disabled);
}

tr {
  transition: var(--color-transition);
}

tr:hover {
  background-color: var(--el-fill-color);
}

</style>
