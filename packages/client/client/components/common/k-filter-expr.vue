<template>
  <template v-if="operator && !operators[operator]">
    无法解析的此处的表达式。
  </template>
  <div class="k-filter-expr" v-else>
    <el-select class="entity" :disabled="disabled" v-model="entity">
      <el-option v-for="(name, key) in entities" :key="key" :label="name" :value="key"></el-option>
    </el-select>
    <el-select class="operator" :disabled="disabled" v-model="operator">
      <el-option v-for="key in availableOps" :key="key" :label="operators[key]" :value="key"></el-option>
    </el-select>
    <el-input :disabled="disabled" :key="type" :type="type" class="value" v-model="value"></el-input>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: any
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const entity = ref<string>()
const operator = ref<string>()
const value = ref<any>()

const entities = {
  'userId': '用户 ID',
  'guildId': '群组 ID',
  'channelId': '频道 ID',
  'selfId': '机器人 ID',
  'platform': '平台',
  'user.authority': '用户权限',
}

const operators = {
  '$in': '属于',
  '$nin': '不属于',
  '$eq': '等于',
  '$ne': '不等于',
  '$gt': '大于',
  '$lt': '小于',
  '$gte': '不小于',
  '$lte': '不大于',
}

const availableOps = computed(() => {
  if (entity.value === 'user.authority') return ['$eq', '$ne', '$gt', '$lt', '$gte', '$lte']
  if (entity.value) return ['$eq', '$ne', '$in', '$nin']
  return []
})

watch(() => props.modelValue, () => {
  operator.value = Object.keys(props.modelValue)[0]
  const exprValue = props.modelValue[operator.value]
  if (!exprValue) return
  entity.value = exprValue[0].$
  value.value = Array.isArray(exprValue[1])
    ? exprValue[1].join(', ')
    : entity.value === 'user.authority' ? +exprValue[1] : exprValue[1]
}, { immediate: true })

const type = computed(() => {
  if (entity.value === 'user.authority') return 'number'
  return 'string'
})

watch(entity, () => {
  value.value = null
  if (!availableOps.value.includes(operator.value)) {
    operator.value = availableOps.value[0]
  }
})

watch([entity, operator, value], ([entity, operator, value]) => {
  if (!entities[entity] || !operators[operator] || !value) return
  let result: any = value
  if (['$in', '$nin'].includes(operator)) {
    result = value.split(/\s*,\s*/g).filter(Boolean)
  } else if (entity === 'user.authority') {
    result = +value
  }
  emit('update:modelValue', {
    [operator]: [{ $: entity }, result],
  })
})

</script>

<style lang="scss">

.k-filter-expr {
  flex: 1 0 auto;
  display: inline-flex;

  .entity, .operator {
    width: 7.5rem;
    flex: 0 0 auto;
  }

  .value {
    width: auto;
    flex: 1 0 auto;
  }
}

</style>
