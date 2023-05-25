<template>
  <schema-base>
    <template #title><slot name="title"></slot></template>
    <template #desc><slot name="desc"></slot></template>
    <template #menu><slot name="menu"></slot></template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix><slot name="suffix"></slot></template>
    <template #control>
      <el-button @click="showDialog = true">{{ target ?? hint }}</el-button>
      <el-dialog class="file-picker" destroy-on-close v-model="showDialog">
        <template #header>
          <el-button class="back-button" :disabled="current === '/'" @click="toPrevious()">
            <k-icon name="chevron-left"></k-icon>
          </el-button>
          从 {{ current }} {{ hint }}
        </template>
        <el-scrollbar>
          <div class="entry" v-for="entry in entries" :key="entry.name" @click="handleClick(entry)">
            <k-icon class="entry-icon" :name="entry.type"></k-icon>
              <input
                v-focus
                v-if="entry.filename === current"
                v-model="entry.name"
                @keypress.enter.prevent="confirmRename()"
                @keydown.escape.prevent="cancelRename()"
              />
              <template v-else>{{ entry.name }}</template>
          </div>
        </el-scrollbar>
        <template #footer>
          <div class="left">
            <el-button v-if="options.allowCreate" @click="createFolder()">创建新目录</el-button>
          </div>
          <div class="right">
            <el-button @click="showDialog = false">取消</el-button>
            <el-button v-if="allowDirectory" type="primary" @click="confirm()">选定当前目录</el-button>
          </div>
        </template>
      </el-dialog>
    </template>
  </schema-base>
</template>

<script lang="ts" setup>

import { computed, PropType, ref } from 'vue'
import { isNullable, Schema, SchemaBase, send, store, useConfig } from '@koishijs/client'
import { files, vFocus } from './store'
import { Entry } from '@koishijs/plugin-explorer'
import {} from 'koishi'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<string>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
})

const config = useConfig<string>()

defineEmits(['update:modelValue'])

const options = computed<Schemastery.Path.Options>(() => ({
  filters: ['file'],
  ...props.schema.meta.extra,
}))

const allowDirectory = computed(() => options.value.filters.includes('directory'))

const hint = computed(() => {
  if (allowDirectory.value) {
    return options.value.filters.length === 1 ? '选择目录' : '选择目录或文件'
  } else {
    return '选择文件'
  }
})

const showDialog = ref(false)
const current = ref('/')

const entries = computed(() => {
  return files[current.value.slice(0, -1)]?.children || store?.explorer || []
})

function handleClick(entry: Entry) {
  if (entry.filename === current.value) return
  if (entry.type === 'directory') {
    current.value = current.value + entry.name + '/'
  } else {
    config.value = current.value.slice(1) + entry.name
    showDialog.value = false
  }
}

function createFolder() {
  files[current.value] = {
    type: 'directory',
    name: '',
    filename: current.value,
    oldValue: '',
    newValue: '',
  }
  const parent = files[current.value.slice(0, -1)]?.children || store?.explorer || []
  parent.push(files[current.value])
}

function confirmRename() {
  const entry = files[current.value]
  if (!entry) return
  const filename = current.value + entry.name
  if (filename in files || !entry.name) {
    cancelRename()
  } else {
    files[filename] = entry
    delete files[current.value]
    send('explorer/mkdir', filename)
    entry.filename = filename
  }
}

function cancelRename() {
  const entry = files[current.value]
  if (!entry) return
  delete files[current.value]
  const parent = files[current.value.slice(0, -1)]?.children || store?.explorer || []
  parent.splice(parent.indexOf(entry), 1)
}

const target = computed(() => {
  if (isNullable(config.value)) return
  if (!config.value) return '根目录'
  const entry = files['/' + config.value]
  if (!entry) return config.value
  return (entry.type === 'file' ? '文件：' : '目录：') + entry.name
})

function toPrevious() {
  const index = current.value.slice(0, -1).lastIndexOf('/')
  current.value = current.value.slice(0, index + 1)
}

function confirm() {
  showDialog.value = false
  if (allowDirectory.value) {
    config.value = current.value.slice(1, -1)
  }
}

</script>

<style lang="scss">

.file-picker {
  height: 50vh;
  display: flex;
  flex-direction: column;

  header {
    display: flex;
    align-items: center;
  }

  .back-button {
    width: 2rem;
    height: 2rem;
    margin-right: 0.75rem;
  }

  .el-dialog__body {
    flex: 1 1 auto;
    overflow: auto;
    padding: 20px 20px;
  }

  .entry {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      background-color: var(--k-hover-bg);
    }

    .entry-icon {
      height: 1rem;
      width: 1.25rem;
      margin-right: 0.5rem;
    }
  }

  .el-dialog__footer {
    display: flex;
    justify-content: space-between;
  }
}

</style>
