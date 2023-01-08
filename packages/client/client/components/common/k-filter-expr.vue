<template>
  <template v-if="operator && !operators[operator]">
    无法解析的此处的表达式。
  </template>
  <div class="k-filter-expr" v-else>
    <el-select class="entity" v-model="entity">
      <el-option v-for="(name, key) in entities" :key="key" :label="name" :value="key"></el-option>
    </el-select>
    <el-select class="operator" v-model="operator">
      <el-option v-for="(name, key) in operators" :key="key" :label="name" :value="key"></el-option>
    </el-select>
    <el-input class="value" :type="type" v-model="value"></el-input>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const entity = ref<string>()
const operator = ref<string>()
const value = ref<string>()

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

const types = {
  array: ['$in', '$nin'],
  number: ['$eq', '$ne', '$gt', '$lt', '$gte', '$lte'],
}

watch(() => props.modelValue, () => {
  operator.value = Object.keys(props.modelValue)[0]
  entity.value = props.modelValue[operator.value]?.[0].$
  value.value = props.modelValue[operator.value]?.[1].toString()
}, { immediate: true })

const type = computed(() => {
  if (types.number.includes(operator.value)) return 'number'
})

watch([entity, operator, value], ([entity, operator, value]) => {
  if (!entities[entity] || !operators[operator] || !value) return
  let result: any = value
  if (types.number.includes(operator)) result = +value
  if (types.array.includes(operator)) result = value.split(/\s*,\s*/g)
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
