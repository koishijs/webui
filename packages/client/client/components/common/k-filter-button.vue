<template>
  <span class="k-filter-button" @click="showDialog = true">
    {{ desc }}
  </span>
  <el-dialog v-model="showDialog" destroy-on-close>
    <template #header>条件设置</template>
    <k-filter v-model="config" :options="options" :disabled="disabled"></k-filter>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref } from 'vue'
import KFilter from './k-filter.vue'

const props = defineProps<{
  modelValue: any
  disabled?: boolean
  options?: any
}>()

const emit = defineEmits(['update:modelValue'])

const showDialog = ref(false)

const config = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

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

function toDesc(expr: any) {
  if (!expr) return ''
  if (expr.$and) {
    return expr.$and.map(toDesc).filter(Boolean).join(' 且 ')
  } else if (expr.$or) {
    return expr.$or.map(toDesc).filter(Boolean).join(' 或 ')
  } else {
    const op = Object.keys(expr)[0]
    if (!expr[op]) return ''
    const [entity, value] = expr[op]
    return `${entities[entity.$]} ${operators[op]} ${value}`
  }
}

const desc = computed(() => {
  return toDesc(config.value) || '无'
})

</script>

<style lang="scss">

</style>
