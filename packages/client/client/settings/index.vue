<template>
  <k-layout main="page-settings">
    <template #header>
      {{ components[path].label }}
    </template>
    <template #left>
      <el-scrollbar>
        <el-tree
          ref="tree"
          :data="data"
          :default-expand-all="true"
          @node-click="handleClick"
        ></el-tree>
      </el-scrollbar>
    </template>
    <keep-alive>
      <component :is="components[path].component" :key="path" />
    </keep-alive>
  </k-layout>
</template>

<script lang="ts" setup>

import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import General from './general.vue'
import Appearance from './appearance.vue'

const route = useRoute()
const router = useRouter()

const components = {
  '': {
    label: '通用设置',
    component: General,
  },
  appearance: {
    label: '外观设置',
    component: Appearance,
  },
}

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const data = computed(() => {
  return Object.entries(components).map<Tree>(([id, { label }]) => ({
    id,
    label,
  }))
})

function handleClick(tree: Tree) {
  if (tree.children) return
  path.value = tree.id
}

const path = computed({
  get() {
    const name = route.params.name?.toString()
    return name in components ? name : ''
  },
  set(value) {
    if (!(value in components)) value = ''
    router.replace('/settings/' + value)
  },
})

</script>

<style lang="scss">

</style>
