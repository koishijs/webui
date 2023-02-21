<template>
  <tr class="dep-package-view">
    <td class="name">{{ name }}</td>

    <td class="current">
      <template v-if="local.workspace">工作区</template>
      <template v-else>
        {{ local.resolved }}
        <template v-if="!local.invalid">
          ({{ gt(local.latest, local.resolved) ? '可更新' : '最新' }})
        </template>
      </template>
    </td>

    <td>
      <el-select v-if="!local.workspace && !local.invalid" v-model="version">
        <el-option value="">移除依赖</el-option>
        <el-option v-for="({ result }, version) in data" :key="version" :value="version">
          {{ version }}
          <template v-if="version === local.resolved">(当前)</template>
          <span :class="[result, 'theme-color', 'dot-hint']"></span>
        </el-option>
      </el-select>
    </td>

    <td>
      <el-button v-if="local.workspace || local.versions" @click="active = name">修改</el-button>
      <template v-else-if="local.invalid">暂不支持</template>
      <template v-else>版本获取失败</template>
    </td>
  </tr>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { store } from '@koishijs/client'
import { active, config } from '../utils'
import { analyzeVersions } from './utils'
import { gt } from 'semver'

const props = defineProps({
  name: String,
})

const local = computed(() => {
  return store.dependencies[props.name]
})

const version = computed({
  get() {
    const value = config.value.override[props.name]
    if (local.value.resolved === value) {
      return
    } else {
      return value === '' ? '移除依赖' : value
    }
  },
  set(value) {
    if (local.value.resolved === value) {
      delete config.value.override[props.name]
    } else {
      config.value.override[props.name] = value
    }
  },
})

const data = computed(() => analyzeVersions(props.name))

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
