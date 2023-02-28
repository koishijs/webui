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

    <k-content class="command-config" v-if="active">
      <div class="navigation">
        <router-link
          class="k-button"
          v-if="store.config && store.packages && command.paths.length"
          :to="'/plugins/' + command.paths[0].replace(/\./, '/')"
        >前往插件</router-link>
        <router-link
          class="k-button"
          v-if="store.locales"
          :to="'/locales/commands/' + active.replace(/\./, '/')"
        >前往本地化</router-link>
      </div>

      <k-form :schema="store.schema['command']"></k-form>
      <template v-for="option in commands[active].options">
        <k-form :schema="store.schema['command-option']">
          <template #title>{{ option.syntax }}</template>
        </k-form>
      </template>
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
import {} from '@koishijs/plugin-locales'
import {} from '@koishijs/plugin-market'
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

const command = computed(() => commands.value[active.value])

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

.command-config {
  .k-content > *:first-child {
    margin-top: 0;
  }

  .navigation {
    margin: 2rem 0;
    display: flex;
    gap: 0.5rem 1rem;
    flex-wrap: wrap;
  }
}

</style>
