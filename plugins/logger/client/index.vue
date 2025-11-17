<template>
  <k-layout>
    <div class="logger-toolbar">
      <el-input
        v-model="keyword"
        class="logger-search"
        placeholder="输入关键词以过滤日志，使用空格分隔多个关键词"
        clearable
        size="small"
      >
        <template #suffix>
          <k-icon name="search" />
        </template>
      </el-input>
      <el-switch
        v-model="wrap"
        size="small"
        active-text="自动换行"
        inactive-text="单行显示"
      />
      <el-button size="small" @click="toggleScroll">
        {{ autoScroll ? '停止滚动' : '恢复滚动' }}
      </el-button>
      <span class="logger-toolbar__stat" v-if="keywordList.length">
        匹配 {{ filteredLogs.length }} / {{ totalLogs }}
      </span>
    </div>
    <logs
      class="layout-logger"
      :logs="filteredLogs"
      show-link
      :wrap="wrap"
      :follow="autoScroll"
      pinned
    ></logs>
  </k-layout>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { computed, ref } from 'vue'
import Logs from './logs.vue'

const keyword = ref('')
const wrap = ref(true)
const autoScroll = ref(true)

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())
const keywordList = computed(() => normalizedKeyword.value.split(/\s+/).filter(Boolean))
const totalLogs = computed(() => store.logs?.length || 0)

const filteredLogs = computed(() => {
  const logs = store.logs || []
  if (!keywordList.value.length) return logs
  return logs.filter((record) => {
    const target = [
      record.name,
      record.type,
      record.content,
      record.meta?.paths?.join(' '),
    ].filter(Boolean).join(' ').toLowerCase()
    return keywordList.value.every((word) => target.includes(word))
  })
})

function toggleScroll() {
  autoScroll.value = !autoScroll.value
}

</script>

<style lang="scss" scoped>

.logger-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;

  :deep(.el-switch__label) {
    font-size: 12px;
  }
}

.logger-search {
  flex: 1;
  min-width: 240px;
}

.logger-toolbar__stat {
  font-size: 12px;
  color: var(--k-text-secondary);
}

</style>
