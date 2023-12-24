<template>
  <slot name="header" v-bind="{ all, packages, hasFilter: hasFilter(modelValue) }"></slot>
  <template v-if="packages.length">
    <el-pagination
      class="pagination"
      background
      v-model:current-page="page"
      :pager-count="5"
      :page-size="limit"
      :total="packages.length"
      layout="prev, pager, next"
    />
    <div class="package-list">
      <market-package
        v-for="data in pages[page - 1]"
        :key="data.package.name"
        class="k-card"
        :data="data"
        :gravatar="gravatar"
        @query="onQuery"
        #action
      >
        <slot name="action" v-bind="data"></slot>
      </market-package>
    </div>
    <el-pagination
      class="pagination"
      background
      v-model:current-page="page"
      :pager-count="5"
      :page-size="limit"
      :total="packages.length"
      layout="prev, pager, next"
    />
  </template>
  <k-empty v-else>
    没有搜索到相关插件。
  </k-empty>
</template>

<script lang="ts" setup>

import { computed, inject, ref, watch } from 'vue'
import { SearchObject } from '@koishijs/registry'
import { getSorted, getFiltered, hasFilter, kConfig } from '../utils'
import MarketPackage from './package.vue'

const props = defineProps<{
  modelValue: string[],
  data: SearchObject[],
  installed?: (data: SearchObject) => boolean,
  gravatar?: string,
}>()

const emit = defineEmits(['update:modelValue', 'update:page'])

const config = inject(kConfig, {})

const all = computed(() => getSorted(props.data, props.modelValue))

const packages = computed(() => getFiltered(all.value, props.modelValue, config))

const limit = computed(() => {
  for (const word of props.modelValue) {
    if (word.startsWith('limit:')) {
      const size = parseInt(word.slice(6))
      if (size) return size
    }
  }
  return 24
})

const page = ref(1)

watch(page, (page) => emit('update:page', page))

const pages = computed(() => {
  const result: SearchObject[][] = []
  for (let i = 0; i < packages.value.length; i += limit.value) {
    result.push(packages.value.slice(i, i + limit.value))
  }
  return result
})

function onQuery(word: string) {
  const words = props.modelValue.slice()
  if (!words[words.length - 1]) words.pop()
  if (!words.includes(word)) words.push(word)
  words.push('')
  emit('update:modelValue', words)
}

</script>

<style lang="scss" scoped>

.package-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(336px, 1fr));
  gap: var(--card-margin);
  justify-items: center;
  flex: 1 0 auto;
}

.pagination {
  margin: var(--card-margin) 0;
  justify-content: center;
}

.k-empty {
  flex: 1 0 auto;
}

</style>
