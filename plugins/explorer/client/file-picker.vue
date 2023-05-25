<template>
  <schema-base>
    <template #title><slot name="title"></slot></template>
    <template #desc><slot name="desc"></slot></template>
    <template #menu><slot name="menu"></slot></template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix><slot name="suffix"></slot></template>
    <template #control>
      <el-button @click="showDialog = true">{{ lastname || hint }}</el-button>
      <el-dialog class="file-picker" destroy-on-close v-model="showDialog">
        <template #header>
          <el-button class="back-button" :disabled="current === '/'" @click="toPrevious()">
            <k-icon name="chevron-left"></k-icon>
          </el-button>
          从 {{ current }} {{ hint }}
        </template>
        <el-scrollbar>
          <div class="entry" v-for="entry in entries" :key="entry.name" @click="handleClick(entry)">
            <k-icon class="entry-icon" :name="entry.type"></k-icon>{{ entry.name }}
          </div>
        </el-scrollbar>
        <template #footer>
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="showDialog = false">确定</el-button>
        </template>
      </el-dialog>
    </template>
  </schema-base>
</template>

<script lang="ts" setup>

import { computed, PropType, ref } from 'vue'
import { Schema, SchemaBase, store } from '@koishijs/client'
import { files } from './store'
import { Entry } from '@koishijs/plugin-explorer'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<string>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
})

const emit = defineEmits(['update:modelValue'])

const hint = computed(() => {
  const { filters = ['file'] } = props.schema.meta.extra
  if (filters.includes('directory')) {
    return filters.length === 1 ? '选择目录' : '选择目录或文件'
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
  if (entry.type === 'directory') {
    current.value = current.value + entry.name + '/'
  } else {
    emit('update:modelValue', current.value.slice(1) + entry.name)
    showDialog.value = false
  }
}

const lastname = computed(() => {
  if (!props.modelValue) return
  const index = props.modelValue.lastIndexOf('/')
  return index === -1 ? props.modelValue : props.modelValue.slice(index + 1)
})

function toPrevious() {
  const index = current.value.slice(0, -1).lastIndexOf('/')
  current.value = current.value.slice(0, index + 1)
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
    gap: 1rem;
    justify-content: flex-end;
  }
}

</style>
