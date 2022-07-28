<template>
  <tr class="dep-package-view">
    <td class="name">{{ name }}</td>

    <td class="current">{{ local.resolved }}</td>

    <td>{{ local.request }}</td>

    <td>
      <template v-if="local.workspace">工作区</template>
      <template v-else-if="local.resolved === local.latest">最新</template>
      <template v-else>可更新</template>
    </td>

    <td>
      <el-button v-if="local.workspace || local.versions" @click="active = name">修改</el-button>
      <template v-else>
        版本获取失败
      </template>
    </td>
  </tr>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { store } from '@koishijs/client'
import { config, active } from '../utils'

const props = defineProps({
  name: String,
})

const value = computed({
  get() {
    const target = config.override[props.name]
    return target === '' ? '移除依赖' : target?.replace(/^[\^~]/, '')
  },
  set(target: string) {
    if (target === '' && !local.value) {
      delete config.override[props.name]
    } else {
      config.override[props.name] = prefix.value + target
      if (config.override[props.name] === local.value?.request) {
        delete config.override[props.name]
      }
    }
  },
})

const prefix = computed({
  get() {
    return /^[\^~]?/.exec(config.override[props.name] || local.value.request)[0]
  },
  set(prefix: string) {
    config.override[props.name] = prefix + (config.override[props.name] || local.value.request).replace(/^[\^~]/, '')
    if (config.override[props.name] === local.value?.request) {
      delete config.override[props.name]
    }
  },
})

const local = computed(() => {
  return store.dependencies[props.name]
})

</script>

<style lang="scss" scoped>

.dep-package-view {
  height: 3rem;
  position: relative;

  td.name {
    text-align: left;
    padding-left: 2rem;
  }

  .el-button {
    width: 4rem;
  }
}

</style>
