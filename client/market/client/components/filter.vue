<template>
  <div class="market-filter-group">
    <div class="market-filter-title">
      <h2 class="text">排序</h2>
    </div>
    <template v-for="(item, key) in comparators" :key="key">
      <div
        v-if="!item.hidden"
        class="market-filter-item"
        :class="{ active: activeSort[0] === key }"
        @click="toggleSort('sort:' + key, $event)">
        <span class="icon"><market-icon :name="item.icon"></market-icon></span>
        <span class="text">{{ item.text }}</span>
        <span class="spacer"></span>
        <span class="order"><market-icon :name="activeSort[1]"></market-icon></span>
      </div>
    </template>
  </div>
  <div class="market-filter-group">
    <div class="market-filter-title">
      <h2 class="text">筛选</h2>
    </div>
    <template v-for="(item, key) in badges" :key="key">
      <div
        v-if="!item.hidden?.(config ?? {}, 'filter')"
        class="market-filter-item"
        :class="{ [key]: true, active: words.includes(item.query), disabled: words.includes(item.negate) }"
        @click="toggleQuery(item, $event)">
        <span class="icon"><market-icon :name="key"></market-icon></span>
        <span class="text">{{ item.text }}</span>
        <span class="spacer"></span>
        <span class="count" v-if="data">
          {{ data.filter(x => validate(x, item.query, config)).length }}
        </span>
      </div>
    </template>
  </div>
  <div class="market-filter-group">
    <div class="market-filter-title">
      <h2 class="text">分类</h2>
    </div>
    <div
      v-for="(title, key) in categories" :key="key" class="market-filter-item"
      :class="{ active: words.includes('category:' + key) }"
      @click="toggleCategory('category:' + key, $event)">
      <span class="icon"><market-icon :name="'solid:' + key"></market-icon></span>
      <span class="text">{{ title }}</span>
      <span class="spacer"></span>
      <span class="count" v-if="data">
        {{ data.filter(item => resolveCategory(item.category) === key).length }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import { Badge, badges, validate, comparators, categories, resolveCategory, MarketConfig } from '../utils'
import { AnalyzedPackage } from '@koishijs/registry'
import MarketIcon from '../icons'

const props = defineProps<{
  modelValue: string[]
  config?: MarketConfig
  data?: AnalyzedPackage[]
}>()

const emit = defineEmits(['update:modelValue'])

const words = ref<string[]>()

watch(() => props.modelValue, (value) => {
  words.value = value.slice()
}, { immediate: true, deep: true })

const activeSort = computed<string[]>(() => {
  let word = words.value.find(w => w.startsWith('sort:'))
  if (!word) return ['rating', 'desc']
  word = word.slice(5)
  if (word.endsWith('-desc')) {
    return [word.slice(0, -5), 'desc']
  } else if (word.endsWith('-asc')) {
    return [word.slice(0, -4), 'asc']
  } else {
    return [word, 'desc']
  }
})

function addWord(word: string) {
  if (!words.value[words.value.length - 1]) {
    words.value.pop()
  }
  words.value.push(word, '')
}

function toggleSort(word: string, event: MouseEvent) {
  const index = words.value.findIndex(x => x.startsWith('sort:'))
  if (index === -1) {
    if (word === 'sort:rating') {
      addWord('sort:rating-asc')
    } else {
      addWord(word)
    }
  } else if (words.value[index] === word || words.value[index] === word + '-desc') {
    words.value[index] = word + '-asc'
  } else if (words.value[index] === word + '-asc') {
    words.value[index] = word
  } else {
    words.value[index] = word
  }
  emit('update:modelValue', words.value)
}

function toggleCategory(word: string, event: MouseEvent) {
  const index = words.value.findIndex(x => x.startsWith('category:'))
  if (index === -1) {
    addWord(word)
  } else if (words[index] === word) {
    words.value.splice(index, 1)
  } else {
    words.value[index] = word
  }
  emit('update:modelValue', words.value)
}

function toggleQuery(item: Badge, event: MouseEvent) {
  const { query, negate } = item
  const index = words.value.findIndex(x => x === query || x === negate)
  if (index === -1) {
    addWord(query)
  } else if (words.value[index] === query) {
    words.value[index] = negate
  } else {
    words.value.splice(index, 1)
  }
  emit('update:modelValue', words.value)
}

</script>

<style lang="scss" scoped>

.market-filter-item {
  display: flex;
  margin: 4px 0;
  color: var(--k-color-secondary);
  transition: color 0.5s;
  align-items: center;
  z-index: 2;
  height: 24px;
  cursor: pointer;

  &:hover {
    color: var(--k-color-primary);
  }

  &.active {
    color: var(--k-color-active);

    &.verified, &.newborn {
      color: var(--k-color-success);
    }

    &.preview {
      color: var(--k-color-warning);
    }

    &.insecure {
      color: var(--k-color-danger);
    }
  }

  &.disabled {
    opacity: 0.5;
    text-decoration: line-through 2px;
  }

  .icon {
    display: inline-flex;
    width: 1.75rem;
    margin-right: 4px;
    align-items: center;
    justify-content: center;
  }

  &:not(.active) .order {
    display: none;
  }

  .order {
    display: inline-flex;
    width: 1.75rem;
    align-items: center;
    justify-content: center;
  }

  svg {
    height: 1rem;
    max-width: 1.125rem;
  }

  .text, .count {
    line-height: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .count {
    margin-right: 4px;
  }

  .spacer {
    flex: 1;
  }
}

</style>
