<template>
  <k-layout>
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

    <k-content>
      <p>{{ active }}</p>
    </k-content>
  </k-layout>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { ref, watch } from 'vue'
import { CommandData } from '@koishijs/plugin-commands'

const tree = ref(null)
const active = ref('')
const keyword = ref('')

watch(keyword, (val) => {
  tree.value.filter(val)
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
