<template>
  <k-schema
    v-bind="$attrs"
    :schema="schema.list[0]"
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :disabled="disabled"
    :prefix="prefix"
    :initial="initial"
  >
    <template #title><slot name="title"></slot></template>
    <template #desc>
      <k-markdown :source="schema.meta.description"></k-markdown>
    </template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix v-if="isSwitch">
      <el-button @click="actions.add">添加分支</el-button>
    </template>
    <template #suffix v-else>
      <el-button class="ellipsis" @click="actions.add">
        <icon-ellipsis></icon-ellipsis>
      </el-button>
    </template>
  </k-schema>

  <div class="k-schema-group" v-if="isSwitch">
    <k-schema
      v-for="(item, index) in modelValue.$switch.branches"
      :modelValue="modelValue.$switch.branches[index].then"
      @update:modelValue="actions.update(index, 'then', $event)"
      :key="index"
      :schema="{ ...schema.list[0], meta: { ...schema.meta, ...schema.list[0].meta, description: null } }"
      :disabled="disabled"
    >
      <template #menu>
        <el-dropdown-item divided :disabled="!index" @click="actions.up(index)">上移分支</el-dropdown-item>
        <el-dropdown-item :disabled="index === modelValue.$switch.branches.length - 1" @click="actions.down(index)">下移分支</el-dropdown-item>
        <el-dropdown-item @click="actions.delete(index)">删除分支</el-dropdown-item>
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
  </div>
</template>

<script lang="ts" setup>

import { computed, PropType } from 'vue'
import { clone, IconEllipsis, Schema } from 'schemastery-vue'
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
  add() {
    if (props.modelValue?.$switch) {
      const branches = props.modelValue.$switch.branches.slice()
      branches.push({ case: null, then: null })
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

.el-button.ellipsis {
  padding: 8px 10px;

  .k-icon {
    width: 12px;
  }
}

</style>
