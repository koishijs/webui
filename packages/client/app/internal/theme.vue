<template>
  <schema-base>
    <template #title><slot name="title"></slot></template>
    <template #desc><slot name="desc"></slot></template>
    <template #menu><slot name="menu"></slot></template>
    <template #prefix><slot name="prefix"></slot></template>
    <template #suffix><slot name="suffix"></slot></template>
    <template #control>
      <el-select popper-class="theme-select" v-model="model">
        <template v-for="(_, key) in ctx.themes" :key="key">
          <el-option :value="key" v-if="key.endsWith('-' + schema.meta.extra.mode)">
            <div class="theme-root" :class="key.endsWith('-dark') ? 'dark' : 'light'" :theme="key">
              <div class="theme-block-1"></div>
              <div class="theme-block-2"></div>
              <div class="theme-block-3"></div>
              <div class="theme-title">
                {{ tt(ctx.themes[key].name) }}
              </div>
            </div>
          </el-option>
        </template>
      </el-select>
    </template>
  </schema-base>
</template>

<script setup lang="ts">

import { PropType, computed } from 'vue'
import { useContext, useI18nText } from '@koishijs/client'
import { Schema, SchemaBase } from '@koishijs/components'

defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<any[]>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
})

const emit = defineEmits(['update:modelValue'])

const ctx = useContext()

const tt = useI18nText()

const config = SchemaBase.useModel()

const model = computed({
  get() {
    return tt(ctx.themes[config.value].name)
  },
  set(value) {
    emit('update:modelValue', value)
  },
})

</script>

<style lang="scss">

.el-select-dropdown.theme-select {
  overflow: hidden;

  .el-select-dropdown__list {
    margin: 0 !important;
  }

  .el-select-dropdown__item {
    padding: 0;
  }

  .theme-root {
    width: 100%;
    height: 100%;
    position: relative;

    .theme-block-1 {
      position: absolute;
      width: 33%;
      height: 100%;
      background-color: var(--bg1);
    }

    .theme-block-2 {
      position: absolute;
      left: 33%;
      width: 34%;
      height: 100%;
      background-color: var(--bg2);
    }

    .theme-block-3 {
      position: absolute;
      left: 67%;
      width: 33%;
      height: 100%;
      background-color: var(--bg3);
    }

    .theme-title {
      position: absolute;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      font-size: 1em;
      z-index: 100;
      font-family: var(--font-family);
      color: var(--k-color-primary);
    }
  }
}

</style>
