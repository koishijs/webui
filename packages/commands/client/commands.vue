<template>
  <k-layout>
    <template #header>
      指令管理{{ active ? ' - ' + active : '' }}
    </template>

    <template #left>
      <el-scrollbar class="command-tree">
        <div class="search">
          <el-input v-model="keyword" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <el-tree
          ref="tree"
          :data="store.commands"
          :props="{ label: 'name' }"
          :filter-node-method="filterNode"
          :default-expand-all="true"
          :expand-on-click-node="false"
          @node-click="handleClick"
        ></el-tree>
      </el-scrollbar>
    </template>

    <k-content v-if="active">
      <p>{{ active }}</p>
    </k-content>
    <k-empty v-else>
      <div>请在左侧选择指令</div>
    </k-empty>
  </k-layout>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { CommandData } from '@koishijs/plugin-commands'
import { commands } from './utils'

const route = useRoute()
const router = useRouter()

const tree = ref(null)
const keyword = ref('')

watch(keyword, (val) => {
  tree.value.filter(val)
})

const active = computed<string>({
  get() {
    const name = route.path.slice(10).replace(/\//, '.')
    return name in commands.value ? name : ''
  },
  set(name) {
    if (!(name in commands.value)) name = ''
    router.replace('/commands/' + name.replace(/\./, '/'))
  },
})

function filterNode(value: string, data: CommandData) {
  return data.name.includes(keyword.value)
}

function handleClick(data: CommandData) {
  active.value = data.name
}

</script>

<style lang="scss">

.command-tree {
  width: 100%;
  height: 100%;
  overflow: auto;

  .el-scrollbar__view {
    padding: 1rem 0;
  }

  .search {
    padding: 0 1.5rem;
  }
}

</style>
