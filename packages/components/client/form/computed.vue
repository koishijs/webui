<template>
  <k-schema
    v-bind="$attrs"
    :schema="{ ...schema.list[0], meta: { ...schema.meta, ...schema.list[0].meta } }"
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :disabled="disabled"
    :prefix="prefix"
    :initial="initial"
    :collapsible="isSwitch ? { initial: false } : null"
  >
    <template #title><slot name="title"></slot></template>
    <template #desc>
      <k-markdown :source="schema.meta.description"></k-markdown>
    </template>
    <template #menu>
      <div class="k-menu-separator"></div>
      <div class="k-menu-item" @click="actions.insert()">
        <span class="k-menu-icon"><icon-branch></icon-branch></span>
        添加分支
      </div>
    </template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix>
      <el-button v-if="isSwitch" @click="actions.insert()">添加分支</el-button>
    </template>
    <template #collapse v-if="isSwitch">
      <k-schema
        v-for="(item, index) in modelValue.$switch.branches"
        :modelValue="modelValue.$switch.branches[index].then"
        @update:modelValue="actions.update(index, 'then', $event)"
        :key="index"
        :schema="{ ...schema.list[0], meta: { ...schema.meta, ...schema.list[0].meta, description: null } }"
        :disabled="disabled"
      >
        <template #menu>
          <div class="k-menu-separator"></div>
          <div class="k-menu-item" :class="{ disabled: disabled || !index }" @click="actions.up(index)">
            <span class="k-menu-icon"><icon-arrow-up></icon-arrow-up></span>
            上移分支
          </div>
          <div class="k-menu-item" :class="{ disabled: disabled || index === modelValue.$switch.branches.length - 1 }" @click="actions.down(index)">
            <span class="k-menu-icon"><icon-arrow-down></icon-arrow-down></span>
            下移分支
          </div>
          <div class="k-menu-item" :class="{ disabled }" @click="actions.delete(index)">
            <span class="k-menu-icon"><icon-delete></icon-delete></span>
            删除分支
          </div>
          <div class="k-menu-item" :class="{ disabled }" @click="actions.insert(index)">
            <span class="k-menu-icon"><icon-insert-before></icon-insert-before></span>
            在上方插入分支
          </div>
          <div class="k-menu-item" :class="{ disabled }" @click="actions.insert(index + 1)">
            <span class="k-menu-icon"><icon-insert-after></icon-insert-after></span>
            在下方插入分支
          </div>
        </template>
        <template #title>
          <span>当满足条件：</span>
          <k-filter-button
            :modelValue="modelValue.$switch.branches[index].case"
            @update:modelValue="actions.update(index, 'case', $event)"
            :options="schema.meta.extra"
            :disabled="disabled"
          ></k-filter-button>
        </template>
      </k-schema>
      <k-schema
        :modelValue="modelValue.$switch.default"
        @update:modelValue="actions.default"
        :schema="{ ...schema.list[0], meta: { ...schema.meta, ...schema.list[0].meta, description: null } }"
        :disabled="disabled"
        :initial="initial?.$switch ? initial.$switch.default : initial"
        #title
      >
        <span>其他情况下</span>
      </k-schema>
    </template>
  </k-schema>
</template>

<script lang="ts" setup>

import { computed, PropType } from 'vue'
import { clone } from 'cosmokit'
import { Schema, IconArrowDown, IconArrowUp, IconBranch, IconDelete, IconInsertAfter, IconInsertBefore } from 'schemastery-vue'
import KFilterButton from './k-filter-button.vue'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<any>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<any>,
  extra: {} as PropType<any>,
})

const emit = defineEmits(['update:modelValue'])

const isSwitch = computed(() => {
  return props.schema?.meta.role === 'computed' && props.modelValue?.$switch
})

const actions = {
  up(index: number) {
    const branches = props.modelValue.$switch.branches.slice()
    branches.splice(index - 1, 0, ...branches.splice(index, 1))
    emit('update:modelValue', { $switch: { ...props.modelValue.$switch, branches } })
  },
  down(index: number) {
    const branches = props.modelValue.$switch.branches.slice()
    branches.splice(index + 1, 0, ...branches.splice(index, 1))
    emit('update:modelValue', { $switch: { ...props.modelValue.$switch, branches } })
  },
  delete(index: number) {
    const branches = props.modelValue.$switch.branches.slice()
    if (branches.length > 1) {
      branches.splice(index, 1)
      emit('update:modelValue', { $switch: { ...props.modelValue.$switch, branches } })
    } else {
      emit('update:modelValue', props.modelValue.$switch['default'])
    }
  },
  update(index: number, key: string, value: any) {
    const branches = props.modelValue.$switch.branches.slice()
    branches[index] = { ...branches[index], [key]: value }
    emit('update:modelValue', { $switch: { ...props.modelValue.$switch, branches } })
  },
  insert(index: number = props.modelValue?.$switch?.branches.length) {
    if (props.modelValue?.$switch) {
      const branches = props.modelValue.$switch.branches.slice()
      branches.splice(index, 0, { case: null, then: null })
      emit('update:modelValue', { $switch: { ...props.modelValue.$switch, branches } })
    } else {
      emit('update:modelValue', {
        $switch: {
          branches: [{ case: null, then: null }],
          default: clone(props.modelValue),
        },
      })
    }
  },
  default(value: any) {
    emit('update:modelValue', { $switch: { ...props.modelValue.$switch, default: value } })
  },
}

</script>

<style lang="scss">

</style>
