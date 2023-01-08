<template>
  <p v-if="!conditions">无法解析过滤器。</p>
  <div class="k-filter" v-else>
    <div class="k-filter-item" v-for="(cond, index) in conditions">
      <el-button @click="remove(index)"><k-icon name="delete"></k-icon></el-button>
      <k-filter-expr :modelValue="cond" @update:modelValue="update($event, index)"></k-filter-expr>
    </div>
    <div>
      <k-button @click="update({}, conditions.length)">添加条件</k-button>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import KFilterExpr from './k-filter-expr.vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const conditions = computed(() => {
  if (!props.modelValue) return []
  if (Array.isArray(props.modelValue.$and)) return props.modelValue.$and
  return [props.modelValue]
})

function update(expr: any, index: number) {
  const value = conditions.value.slice()
  value[index] = expr
  if (value.length === 1) {
    emit('update:modelValue', expr)
  } else {
    emit('update:modelValue', { $and: value })
  }
}

function remove(index: number) {
  const value = conditions.value.slice()
  value.splice(index, 1)
  if (value.length === 0) {
    emit('update:modelValue', undefined)
  } else if (value.length === 1) {
    emit('update:modelValue', value[0])
  } else {
    emit('update:modelValue', { $and: value })
  }
}

</script>

<style lang="scss">

.k-filter-item {
  display: flex;
}

</style>
