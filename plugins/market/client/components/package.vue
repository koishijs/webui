<template>
  <tr class="dep-package-view">
    <td class="text-left pl-8">{{ name }}</td>

    <td class="current">
      <template v-if="!dep">-</template>
      <template v-else-if="dep.workspace">工作区</template>
      <template v-else>
        {{ dep.resolved }}
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
          <template v-if="version === dep?.resolved">(当前)</template>
          <span :class="[result, 'theme-color', 'dot-hint']"></span>
        </el-option>
      </el-select>
    </td>

    <td>
      <template v-if="dep?.invalid">暂不支持</template>
      <el-button v-else-if="dep?.workspace || data" @click="active = name">修改</el-button>
      <template v-else>版本获取失败</template>
    </td>
  </tr>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { store, isNullable, useConfig } from '@koishijs/client'
import { active, hasUpdate } from '../utils'
import { analyzeVersions } from './utils'

const props = defineProps({
  name: String,
})

const config = useConfig()

const dep = computed(() => store.dependencies?.[props.name])

const compare = computed(() => {
  const result = hasUpdate(props.name)
  if (isNullable(result)) return
  return result ? '可更新' : '最新'
})

const version = computed({
  get() {
    const value = config.value.market.override[props.name]
    if (dep.value?.resolved === value) {
      return
    } else {
      return value === '' ? '移除依赖' : value
    }
  },
  set(value) {
    if (dep.value?.resolved === value || !value && !dep.value) {
      delete config.value.market.override[props.name]
    } else {
      config.value.market.override[props.name] = value
    }
  },
})

const data = computed(() => {
  if (dep.value?.workspace || dep.value?.invalid) return
  return analyzeVersions(props.name, (name) => config.value.market.override[name])
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
