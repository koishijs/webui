<template>
  <k-layout class="page-locales">
    <template #header>
      本地化 - {{ active }}
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
        <el-tree
          :data="data"
          :props="{ class: getClass }"
          :default-expand-all="true"
          :expand-on-click-node="false"
          @node-click="handleClick"
        ></el-tree>
      </el-scrollbar>
    </template>

    <k-content>
      <template v-for="path in activePaths" :key="path">
        <h3>{{ path }}</h3>
        <div class="translation" v-for="locale in displayLocales" :key="locale">
          <span class="locale">{{ locale }}</span>
          <el-input
            autosize
            type="textarea"
            :modelValue="store.locales['$' + locale]?.[`${active}.${path}`]"
            :placeholder="store.locales[locale][`${active}.${path}`]"
            @update:modelValue="handleUpdate(locale, path, $event)"
          ></el-input>
        </div>
      </template>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { send, store } from '@koishijs/client'
import { computed, ref } from 'vue'
import { debounce } from 'throttle-debounce'

const displayLocales = ref(['zh', 'en'])

const active = ref('')

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
    if (!locale) continue
    Object.assign(result, store.locales[locale])
  }
  return Object.keys(result).filter(path => !path.includes('._') && !path.includes('@'))
})

const activePaths = computed(() => {
  return paths.value
    .filter(path => path.startsWith(active.value + '.'))
    .map(path => path.slice(active.value.length + 1))
    .filter(path => active.value.split('.').length >= 2 || !path.includes('.'))
})

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const data = computed(() => {
  const result: Tree[] = []
  for (const path of paths.value) {
    const parts = path.split('.')
    let node = result
    for (let i = 0; i < Math.min(parts.length - 1, 2); i++) {
      const label = parts[i]
      if (!label) break
      const id = parts.slice(0, i + 1).join('.')
      let child = node.find(item => item.id === id)
      if (!child) {
        child = { id, label }
        node.push(child)
      }
      node = child.children ??= []
    }
  }
  return result
})

const update = debounce(1000, () => {
  const result = {}
  for (const locale in store.locales) {
    if (!locale.startsWith('$')) continue
    result[locale.slice(1)] = store.locales[locale]
  }
  send('l10n', result)
})

function handleUpdate(locale: string, path: string, value: string) {
  const root = store.locales['$' + locale] ??= {}
  root[`${active.value}.${path}`] = value
  update()
}

</script>

<style lang="scss">

.page-locales {
  .layout-left .el-scrollbar__view {
    padding: 1rem 0;
    line-height: 2.25rem;
  }

  .el-tree-node__expand-icon {
    margin-left: 8px;
  }

  .el-tree-node {
    &.is-active > .el-tree-node__content {
      background-color: var(--hover-bg);
      color: var(--active);
    }
  }

  .el-tree-node__content {
    line-height: 2.25rem;
    height: 2.25rem;
    transition: var(--color-transition);

    &:hover {
      background-color: var(--hover-bg);
    }
  }

  .el-tree-node__label {
    font-size: 16px;
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
