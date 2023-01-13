<template>
  <k-layout main="darker" class="page-market" :menu="menu">
    <div v-if="!store.market">
      <div class="el-loading-spinner">
        <svg class="circular" viewBox="25 25 50 50">
          <circle class="path" cx="50" cy="50" r="20" fill="none"></circle>
        </svg>
        <p class="el-loading-text">正在加载插件市场……</p>
      </div>
    </div>

    <el-scrollbar v-else-if="store.market.total">
      <div class="search-box">
        <k-badge type="success" v-for="(word, index) in words.slice(0, -1)" :key="index" @click="words.splice(index, 1)">{{ word }}</k-badge>
        <input
          placeholder="输入想要查询的插件名"
          v-model="words[words.length - 1]"
          @blur="onEnter"
          @keydown.escape="onEscape"
          @keydown.backspace="onBackspace"
          @keypress.enter.prevent="onEnter"
          @keypress.space.prevent="onEnter"/>
        <k-icon name="search"></k-icon>
      </div>
      <div class="market-filter">
        共搜索到 {{ realWords.length ? all.length + ' / ' : '' }}{{ visible.length }} 个插件。
        <el-checkbox v-if="store.packages" v-model="config.showInstalled">
          {{ global.static ? '只显示可用插件' : `显示已下载的插件 (共 ${installed} 个)` }}
        </el-checkbox>
      </div>
      <div class="market-container">
        <package-view v-for="data in objects" :key="data.name" :data="data" @query="onQuery"></package-view>
      </div>
    </el-scrollbar>

    <k-comment v-else type="error" class="market-error">
      <p>无法连接到插件市场。这可能是以下原因导致的：</p>
      <ul>
        <li>无法连接到网络，请检查你的网络连接和代理设置</li>
        <li>您所用的 registry 不支持搜索功能 (如 npmmirror)，请考虑进行更换</li>
      </ul>
    </k-comment>
  </k-layout>
</template>

<script setup lang="ts">

import { router, store, global } from '@koishijs/client'
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { config, refresh } from '../utils'
import { validate } from './utils'
import PackageView from './package.vue'

const route = useRoute()

const { keyword } = route.query
const words = reactive(Array.isArray(keyword) ? keyword : (keyword || '').split(' '))
if (words[words.length - 1]) words.push('')

const realWords = computed(() => words.filter(w => w))

watch(words, () => {
  const { keyword: _, ...rest } = route.query
  const keyword = realWords.value.join(' ')
  if (keyword) {
    router.replace({ query: { keyword, ...rest } })
  } else {
    router.replace({ query: rest })
  }
}, { deep: true })

function onEnter(event: Event) {
  const last = words[words.length - 1]
  if (!last) return
  if (words.slice(0, -1).includes(last)) {
    words.pop()
  }
  words.push('')
}

function onEscape(event: KeyboardEvent) {
  words[words.length - 1] = ''
}

function onBackspace(event: KeyboardEvent) {
  if (words[words.length - 1] === '' && words.length > 1) {
    event.preventDefault()
    words.splice(words.length - 2, 1)
  }
}

function onQuery(word: string) {
  if (!words[words.length - 1]) words.pop()
  if (!words.includes(word)) words.push(word)
  words.push('')
}

const visible = computed(() => {
  return Object.values(store.market.data).filter((data) => {
    return !data.manifest.hidden || words.includes('show:hidden')
  })
})

const all = computed(() => {
  return visible.value.filter((data) => {
    return words.every(word => validate(data, word))
  })
})

const installed = computed(() => {
  return all.value.filter(item => store.packages[item.name]).length
})

const objects = computed(() => {
  return all.value
    .filter(item => global.static
      ? !config.showInstalled || store.packages[item.name]
      : config.showInstalled || !store.packages[item.name])
    .sort((a, b) => 0
      || (global.static ? +b.portable - +a.portable : 0)
      || b.score.final - a.score.final)
})

const menu = computed(() => [refresh.value])

</script>

<style lang="scss">

.page-market .layout-main .el-scrollbar__view {
  padding: 0 var(--card-margin);
}

.search-box {
  margin: 2rem auto 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  height: 3rem;
  border-radius: 1.5rem;
  background-color: var(--card-bg);
  align-items: center;
  padding: 0 1.2rem;
  box-shadow: var(--card-shadow);
  transition: var(--color-transition);

  input {
    height: 3rem;
    width: 100%;
    font-size: 1em;
    background-color: transparent;
    border: none;
    outline: none;
    color: var(--fg1);
    transition: var(--color-transition);
  }

  .badge {
    flex-shrink: 0;
  }

  .badge + input {
    margin-left: 0.4rem;
  }
}

.search-box, .market-container {
  .k-badge {
    cursor: pointer;
    user-select: none;
  }
}

.market-filter {
  width: 100%;
  margin: 0.5rem 0 -0.5rem;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-primary);
  transition: color 0.3s ease;

  .el-checkbox {
    margin-left: 1.5rem;
  }
}

.market-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(336px, 1fr));
  gap: var(--card-margin);
  margin: var(--card-margin) 0;
  justify-items: center;
}

.market-error.k-comment {
  margin-left: 2rem;
  margin-right: 2rem;
}

</style>
