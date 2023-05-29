<template>
  <k-layout main="page-settings">
    <template #header>
      {{ ctx.internal.settings[path][0]?.title }}
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
      <k-content :key="path">
        <template v-for="item of ctx.internal.settings[path]">
          <component v-if="item.component" :is="item.component" />
          <k-form v-else-if="item.schema" :schema="item.schema" v-model="config" :initial="config" />
        </template>
      </k-content>
    </keep-alive>
  </k-layout>
</template>

<script lang="ts" setup>

import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useConfig, useContext } from '@koishijs/client'

const route = useRoute()
const router = useRouter()

const config = useConfig()
const ctx = useContext()

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const data = computed(() => Object.entries(ctx.internal.settings).map<Tree>(([id, [{ title }]]) => ({
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
    return name in ctx.internal.settings ? name : ''
  },
  set(value) {
    if (!(value in ctx.internal.settings)) value = ''
    router.replace('/settings/' + value)
  },
})

</script>

<style lang="scss">

</style>
