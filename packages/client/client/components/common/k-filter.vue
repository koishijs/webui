<template>
  <p v-if="!conditions">无法解析过滤器。</p>
  <div class="k-filter" v-else>
    <div class="k-filter-item" v-for="(cond, key) in conditions" :key="key">
      <el-button @click="remove(key)"><k-icon name="delete"></k-icon></el-button>
      <k-filter-expr :modelValue="cond" @update:modelValue="update($event, key)"></k-filter-expr>
    </div>
    <div>
      <k-button @click="update({}, conditions.length)">添加条件</k-button>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import KFilterExpr from './k-filter-expr.vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const randomKey = () => Math.random().toString(36).slice(2)

const conditions = computed(() => {
  if (!props.modelValue) {
    return []
  } else if (Array.isArray(props.modelValue.$and)) {
    return props.modelValue.$and
  } else {
    return [props.modelValue]
  }
})

function update(expr: any, key: string | number) {
  const values = conditions.value.slice()
  values[key] = expr
  if (values.length === 1) {
    emit('update:modelValue', values[0])
  } else {
    emit('update:modelValue', { $and: values })
  }
}

function remove(key: string | number) {
  const values = conditions.value.slice()
  values.splice(key, 1)
  if (values.length === 0) {
    emit('update:modelValue', undefined)
  } else if (values.length === 1) {
    emit('update:modelValue', values[0])
  } else {
    emit('update:modelValue', { $and: values })
  }
}

</script>

<style lang="scss">

.k-filter-item {
  display: flex;
}

</style>
