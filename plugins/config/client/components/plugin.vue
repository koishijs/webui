<template>
  <template v-if="name">
    <k-comment v-if="!local.runtime">
      <p>正在加载插件配置……</p>
    </k-comment>
    <k-comment v-else-if="local.runtime.failed" type="danger">
      <p>插件加载失败，这可能是插件本身的问题所致。{{ hint }}</p>
    </k-comment>
    <k-slot v-else name="market-settings" :data="data">
      <k-slot-item :order="-200">
        <k-markdown unsafe class="usage" v-if="local.runtime?.usage" :source="local.runtime?.usage"></k-markdown>
      </k-slot-item>
      <k-slot-item :order="-600">
        <k-modifier v-if="local.runtime.filter !== false" v-model="config"></k-modifier>
      </k-slot-item>
      <k-slot-item :order="-1000">
        <k-comment v-if="!local.runtime.schema" type="warning">
          <p>此插件未声明配置项，这可能并非预期行为。{{ hint }}</p>
        </k-comment>
        <k-form v-else :schema="local.runtime.schema" :initial="current.config" v-model="config">
          <template #hint>{{ hint }}</template>
        </k-form>
      </k-slot-item>
    </k-slot>
  </template>

  <template v-else-if="current.label">
    <k-slot name="plugin-missing"></k-slot>
  </template>
</template>

<script lang="ts" setup>

import { store, send } from '@koishijs/client'
import { computed, provide, watch } from 'vue'
import { SettingsData, Tree } from './utils'
import KModifier from './modifier.vue'

const props = defineProps<{
  current: Tree
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const config = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const name = computed(() => {
  const { label, target } = props.current
  const shortname = target || label
  if (shortname.includes('/')) {
    const [left, right] = shortname.split('/')
    return [`${left}/koishi-plugin-${right}`].find(name => name in store.packages)
  }
  return [
    `@koishijs/plugin-${shortname}`,
    `koishi-plugin-${shortname}`,
  ].find(name => name in store.packages)
})

const local = computed(() => store.packages[name.value])
const hint = computed(() => local.value.workspace ? '请检查插件源代码。' : '请联系插件作者并反馈此问题。')

watch(local, (value) => {
  if (!value || value.runtime) return
  send('config/request-runtime', value.name)
}, { immediate: true })

provide('manager.settings.local', local)
provide('manager.settings.config', config)
provide('manager.settings.current', computed(() => props.current))

const data = computed<SettingsData>(() => ({
  name: name.value,
  local: local.value,
  config: config.value,
  current: props.current,
}))

</script>

<style lang="scss">

.plugin-view {
  .markdown.usage {
    margin-bottom: 2rem;

    h2 {
      font-size: 1.25rem;
    }
  }
}

</style>
