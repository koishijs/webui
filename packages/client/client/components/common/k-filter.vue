<template>
  <p v-if="invalid">无法解析过滤器。</p>
  <div class="k-filter" v-else>
    <div v-for="(layer, outer) in extract(modelValue, '$or')" :key="outer">
      <div class="k-filter-item" v-for="(expr, inner) in extract(layer, '$and')" :key="inner">
        <el-button :disabled="disabled" @click="remove(inner, outer)"><k-icon name="delete"></k-icon></el-button>
        <k-filter-expr :disabled="disabled" :options="options" :modelValue="expr" @update:modelValue="update($event, inner, outer)"></k-filter-expr>
      </div>
      <div>
        <k-button @click="update({}, extract(layer, '$and').length, outer)">添加「与」条件</k-button>
      </div>
    </div>
    <div>
      <k-button @click="update({}, 0, extract(modelValue, '$or').length)">
        {{ extract(modelValue, '$or').length ? '添加「或」条件' : '添加条件' }}
      </k-button>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import KFilterExpr from './k-filter-expr.vue'

const props = defineProps<{
  modelValue: any
  disabled?: boolean
  options?: any
}>()

const emit = defineEmits(['update:modelValue'])

const invalid = computed(() => {
  const outer = extract(props.modelValue, '$or')
  if (!outer) return true
  for (const layer of outer) {
    const inner = extract(layer, '$and')
    if (!inner) return true
  }
})

function extract(value: any, type: string) {
  if (!value) {
    return []
  } else if (Array.isArray(value[type])) {
    return value[type]
  } else {
    return [value]
  }
}

function format(values: any, type: string) {
  values = values.filter(Boolean)
  if (!values.length) {
    return
  } else if (values.length === 1) {
    return values[0]
  } else {
    return { [type]: values }
  }
}

function update(expr: any, innerKey: string | number, outerKey: string | number) {
  const outer = extract(props.modelValue, '$or').slice()
  const inner = extract(outer[outerKey], '$and').slice()
  inner[innerKey] = expr
  outer[outerKey] = format(inner, '$and')
  emit('update:modelValue', format(outer, '$or'))
}

function remove(innerKey: string | number, outerKey: string | number) {
  const outer = extract(props.modelValue, '$or').slice()
  const inner = extract(outer[outerKey], '$and').slice()
  inner[innerKey] = undefined
  outer[outerKey] = format(inner, '$and')
  emit('update:modelValue', format(outer, '$or'))
}

</script>

<style lang="scss">

.k-filter-item {
  display: flex;
}

</style>
