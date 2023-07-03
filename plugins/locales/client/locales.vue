<template>
  <k-layout class="page-locales">
    <template #header>
      本地化{{ active ? ' - ' + active : '' }}
    </template>

    <template #menu>
      <el-dropdown placement="bottom" popper-class="k-dropdown">
        <span class="menu-item">
          <k-icon class="menu-icon" name="globe"></k-icon>
        </span>
        <template #dropdown>
          <el-checkbox-group v-model="displayLocales">
            <template v-for="(_, locale) in store.locales" :key="locale">
              <el-checkbox v-if="locale && !locale.startsWith('$')" :label="locale">
                {{ locale }}
              </el-checkbox>
            </template>
          </el-checkbox-group>
        </template>
      </el-dropdown>
    </template>

    <template #left>
      <el-scrollbar>
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
          ref="tree"
          :data="data.data"
          :props="{ class: getClass }"
          :filter-node-method="filterNode"
          :default-expand-all="true"
          :expand-on-click-node="false"
          @node-click="handleClick"
        ></el-tree>
      </el-scrollbar>
    </template>

    <k-content v-if="active">
      <k-slot name="locale-main" :data="{ active }"></k-slot>

      <template v-for="path in data.map[active]" :key="path">
        <h3>{{ path }}</h3>
        <div class="translation" v-for="locale in displayLocales" :key="locale">
          <span class="locale">{{ locale }}</span>
          <el-input
            autosize
            type="textarea"
            :modelValue="(store.locales['$' + locale]?.[`${active}.${path}`] as any)"
            :placeholder="store.locales[locale]?.[`${active}.${path}`] || store.locales[''][`${active}.${path}`] as any"
            @update:modelValue="handleUpdate(locale, path, $event)"
          ></el-input>
        </div>
      </template>
    </k-content>
    <k-empty v-else>
      <div>请在左侧选择类别</div>
    </k-empty>
  </k-layout>
</template>

<script lang="ts" setup>

import { useRoute, useRouter } from 'vue-router'
import { Dict, send, store } from '@koishijs/client'
import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const route = useRoute()
const router = useRouter()

const displayLocales = ref(['zh-CN', 'en-US'])
const tree = ref(null)
const keyword = ref('')

watch(keyword, (val) => {
  tree.value.filter(val)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(9).replace(/\//g, '.')
    return name in data.value.map ? name : ''
  },
  set(name) {
    if (!(name in data.value.map)) name = ''
    router.replace('/locales/' + name.replace(/\./g, '/'))
  },
})

function filterNode(value: string, data: Tree) {
  return data.label.toLowerCase().includes(keyword.value.toLowerCase())
}

function getClass(tree: Tree) {
  const words: string[] = []
  if (tree.id === active.value) words.push('is-active')
  return words.join(' ')
}

function handleClick(tree: Tree) {
  active.value = tree.id
}

const paths = computed(() => {
  const result = {}
  for (const locale in store.locales) {
    Object.assign(result, store.locales[locale])
  }
  return Object.keys(result).filter(path => !path.includes('._') && !path.includes('@'))
})

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

function sortTree(trees: Tree[]) {
  trees.sort((a, b) => a.label.localeCompare(b.label))
  for (const tree of trees) {
    if (tree.children) sortTree(tree.children)
  }
}

const data = computed(() => {
  const data: Tree[] = []
  const map: Dict<string[]> = {}
  for (const path of paths.value) {
    const parts = path.split('.')
    if (parts.length < 2 || path.includes('$')) continue
    let children = data
    let depth = Math.min(parts.length - 1, 2)
    for (let i = parts.length - 1; i >= depth; i--) {
      if (paths.value.includes(parts.slice(0, i).join('.') + '.$')) {
        depth = i
        break
      }
    }
    for (let i = 0; i < depth; i++) {
      const label = parts[i]
      const id = parts.slice(0, i + 1).join('.')
      let child = children.find(item => item.id === id)
      if (!child) {
        child = { id, label }
        children.push(child)
        map[id] = []
      }
      children = child.children ??= []
    }
    map[parts.slice(0, depth).join('.')].push(parts.slice(depth).join('.'))
  }
  sortTree(data)
  return { data, map }
})

const update = useDebounceFn(() => {
  const result = {}
  for (const locale in store.locales) {
    if (!locale.startsWith('$')) continue
    result[locale.slice(1)] = store.locales[locale]
  }
  send('l10n', result)
}, 1000)

function handleUpdate(locale: string, path: string, value: string) {
  const root = store.locales['$' + locale] ??= {}
  if (value) {
    root[`${active.value}.${path}`] = value
  } else {
    root[`${active.value}.${path}`] = null
  }
  update()
}

</script>

<style lang="scss">

.page-locales {
  .layout-left .el-scrollbar__view {
    padding: 1rem 0;
  }

  .search {
    padding: 0 1.5rem;
  }

  .translation {
    display: flex;
    margin: 0.5rem;

    span.locale {
      width: 4rem;
      height: 2rem;
      flex: 0 0 auto;
      padding: 0.25rem 0.5rem;
      box-sizing: border-box;
    }
  }
}

.k-dropdown {
  .el-checkbox {
    display: flex;
    margin-right: 0;
    padding: 0 1rem;
  }
}

</style>
