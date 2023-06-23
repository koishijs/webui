<template>
  <div class="market-list">
  
    <slot name="header" v-bind="{ all, packages, hasFilter: hasFilter(modelValue) }"></slot>
    <div class="market-container">
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
      :page-size="pageSize"
      :total="packages.length"
      layout="prev, pager, next"
    />
  </div>
</template>

<script lang="ts" setup>

import { computed, inject, ref } from 'vue'
import { SearchObject } from '@koishijs/registry'
import { getSorted, getFiltered, hasFilter, kConfig } from '../utils'
import MarketPackage from './package.vue'

const props = withDefaults(defineProps<{
  modelValue: string[],
  data: SearchObject[],
  installed?: (data: SearchObject) => boolean,
  pageSize?: number,
  gravatar?: string,
}>(), {
  pageSize: 24,
})

const emit = defineEmits(['update:modelValue'])

const config = inject(kConfig, {})

const all = computed(() => getSorted(props.data, props.modelValue))

const packages = computed(() => getFiltered(all.value, props.modelValue, config))

const page = ref(1)

const pages = computed(() => {
  const result: SearchObject[][] = []
  for (let i = 0; i < packages.value.length; i += props.pageSize) {
    result.push(packages.value.slice(i, i + props.pageSize))
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

.market-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(336px, 1fr));
  gap: var(--card-margin);
  margin: var(--card-margin) 0;
  justify-items: center;
}

.pagination {
  margin: var(--card-margin) 0;
  justify-content: center;
}

</style>
