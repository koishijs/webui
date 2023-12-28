<template>
  <tr class="dep-package-view">
    <td class="text-left p-8">{{ name }}</td>

    <td class="current">
      <template v-if="!local">-</template>
      <template v-else-if="local.workspace">工作区</template>
      <template v-else>
        {{ local.resolved }}
        <template v-if="compare">
          ({{ compare }})
        </template>
      </template>
    </td>

    <td>
      <el-select v-if="data" v-model="version">
        <el-option value="">移除依赖</el-option>
        <el-option v-for="({ result }, version) in data" :key="version" :value="version">
          {{ version }}
          <template v-if="version === local?.resolved">(当前)</template>
          <span :class="[result, 'theme-color', 'dot-hint']"></span>
        </el-option>
      </el-select>
    </td>

    <td>
      <template v-if="local?.invalid">暂不支持</template>
      <el-button v-else-if="local?.workspace || data" @click="active = name">修改</el-button>
      <template v-else>版本获取失败</template>
    </td>
  </tr>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { store, isNullable } from '@koishijs/client'
import { active, config, hasUpdate } from '../utils'
import { analyzeVersions } from './utils'

const props = defineProps({
  name: String,
})

const local = computed(() => store.dependencies?.[props.name])

const compare = computed(() => {
  const result = hasUpdate(props.name)
  if (isNullable(result)) return
  return result ? '可更新' : '最新'
})

const version = computed({
  get() {
    const value = config.value.override[props.name]
    if (local.value?.resolved === value) {
      return
    } else {
      return value === '' ? '移除依赖' : value
    }
  },
  set(value) {
    if (local.value?.resolved === value || !value && !local.value) {
      delete config.value.override[props.name]
    } else {
      config.value.override[props.name] = value
    }
  },
})

const data = computed(() => {
  if (local.value?.workspace || local.value?.invalid) return
  return analyzeVersions(props.name)
})

</script>

<style lang="scss" scoped>

.dep-package-view {
  height: 3rem;
  position: relative;

  .el-button {
    width: 4rem;
  }
}

</style>
