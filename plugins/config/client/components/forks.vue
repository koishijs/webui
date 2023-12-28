<template>
  <el-dialog
    :model-value="!!dialogFork"
    @update:model-value="dialogFork = null"
    class="dialog-config-fork"
    destroy-on-close>
    <template #header="{ titleId, titleClass }">
      <span :id="titleId" :class="titleClass">
        {{ dialogFork + (local?.workspace ? ' (工作区)' : '') }}
      </span>
    </template>
    <table>
      <tr v-for="id in plugins.forks[shortname]" :key="id">
        <td class="text-left">
          <span class="status-light" :class="getStatus(plugins.paths[id])"></span>
          <span class="path">{{ getFullPath(plugins.paths[id]) }}</span>
        </td>
        <td class="text-right">
          <span class="actions">
            <span class="action" @click.stop="configure(id)"><k-icon name="arrow-right"></k-icon></span>
            <span class="action" @click.stop="removeItem(plugins.paths[id])"><k-icon name="delete"></k-icon></span>
          </span>
        </td>
      </tr>
    </table>
    <template #footer>
      <div class="left">
        <template v-if="plugins.forks[shortname]?.length">
          此插件目前存在 {{ plugins.forks[shortname]?.length }} 份配置。
        </template>
        <template v-else>
          此插件尚未被配置。
        </template>
      </div>
      <div class="right">
        <el-button @click.stop="configure()">添加新配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { store, send, router } from '@koishijs/client'
import { dialogFork, plugins, getStatus, removeItem, Tree } from './utils'

const shortname = computed(() => dialogFork.value?.replace(/(koishi-|^@koishijs\/)plugin-/, ''))
const local = computed(() => store.packages?.[dialogFork.value])

function getLabel(tree: Tree) {
  return `${tree.label ? `${tree.label} ` : ''}[${tree.path}]`
}

function getFullPath(tree: Tree) {
  const path = [getLabel(tree)]
  while (tree.parent) {
    tree = tree.parent
    path.unshift(getLabel(tree))
  }
  path.shift()
  return path.join(' > ')
}

async function configure(key?: string) {
  const target = shortname.value
  if (!key) {
    key = Math.random().toString(36).slice(2, 8)
    send('manager/unload', '', target + ':' + key, {})
  }
  await router.push('/plugins/' + key)
  dialogFork.value = null
}

</script>

<style lang="scss">

.dialog-config-fork {
  .el-dialog__header .el-dialog__title {
    font-weight: 500;
    color: var(--fg1);
    margin-right: 0.5rem;
    flex: 0 0 auto;
  }

  .status-light {
    margin-right: 0.75rem;
  }

  .actions {
    display: flex;
    gap: 0 0.5rem;
    align-items: center;
    justify-content: flex-end;
  }

  .action {
    display: inline-flex;
    width: 1.25rem;
    justify-content: center;
    cursor: pointer;
    color: var(--fg2);
    transition: var(--color-transition);

    &:hover {
      color: var(--fg1);
    }
  }

  .el-dialog__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9em;
  }
}

</style>
