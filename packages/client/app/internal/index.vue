<template>
  <k-layout main="page-settings">
    <template #header>
      {{ ctx.settings[path].title }}
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
      <component :is="ctx.settings[path].component || Fallback" :key="path" />
    </keep-alive>
  </k-layout>
</template>

<script lang="ts" setup>

import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useCordis } from '@koishijs/client'
import Fallback from './fallback.vue'

const route = useRoute()
const router = useRouter()

const ctx = useCordis()

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const data = computed(() => Object.entries(ctx.settings).map<Tree>(([id, { title }]) => ({
  id,
  label: title,
})))

function handleClick(tree: Tree) {
  if (tree.children) return
  path.value = tree.id
}

const path = computed({
  get() {
    const name = route.params.name?.toString()
    return name in ctx.settings ? name : ''
  },
  set(value) {
    if (!(value in ctx.settings)) value = ''
    router.replace('/settings/' + value)
  },
})

</script>

<style lang="scss">

</style>
