<template>
  <schema-base>
    <template #title><slot name="title"></slot></template>
    <template #desc><slot name="desc"></slot></template>
    <template #menu><slot name="menu"></slot></template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix><slot name="suffix"></slot></template>
    <template #control>
      <el-cascader
        collapse-tags
        v-model="config"
        :options="options"
        :props="{ multiple: true, checkStrictly: true, emitPath: false }"
        :disabled="disabled">
      </el-cascader>
    </template>
  </schema-base>
</template>

<script lang="ts" setup>

import { computed, PropType } from 'vue'
import { store } from '@koishijs/client'
import type { CascaderOption } from 'element-plus'
import SchemaBase, { Schema } from 'schemastery-vue'

defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<string>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
})

defineEmits(['update:modelValue'])

const config = SchemaBase.useModel()

function addNode(nodes: CascaderOption[], path: string[], prefix = '') {
  const name = path.shift()
  let node = nodes.find(node => node.value === prefix + name)
  if (!node) {
    node = { value: prefix + name, label: name, disabled: !!path.length }
    nodes.push(node)
  }
  if (!path.length) return
  addNode(node.children ||= [], path, prefix + name + ':')
}

const options = computed(() => {
  const result: CascaderOption[] = []
  for (const name of store.permissions) {
    const path = name.split(':')
    addNode(result, path)
  }
  console.log(result)
  return result
})

</script>
