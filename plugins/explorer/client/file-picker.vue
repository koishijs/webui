<template>
  <el-button @click="showDialog = true">选择文件</el-button>
  <el-dialog class="file-picker" destroy-on-close v-model="showDialog">
    <template #header>
      从 {{ current }} 选择文件
    </template>
    <div class="entry" v-for="entry in entries" :key="entry.name" @click="handleClick(entry)">
      {{ entry.name }}
    </div>
    <template #footer>
      <el-button @click="showDialog = false">取消</el-button>
      <el-button type="primary" @click="showDialog = false">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue'
import { store } from '@koishijs/client'
import { files } from './store'
import { Entry } from '../src'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

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

</script>

<style lang="scss">

.file-picker {
  height: 50vh;
  display: flex;
  flex-direction: column;

  .el-dialog__body {
    flex: 1 1 auto;
    overflow: auto;
  }

  .entry {
    padding: 0.25rem 1rem;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      background-color: var(--hover-bg);
    }
  }

  .el-dialog__footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
}

</style>
