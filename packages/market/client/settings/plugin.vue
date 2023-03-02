<template>
  <template v-if="name">
    <k-slot name="market-settings" :data="data"></k-slot>

    <!-- schema -->
    <k-comment v-if="!local.schema" type="warning">
      <p>此插件未声明配置项，这可能并非预期行为{{ hint }}。</p>
    </k-comment>
    <k-form :schema="local.schema" :initial="current.config" v-model="config">
      <template #hint>{{ hint }}</template>
    </k-form>
  </template>

  <k-comment v-else-if="current.label" type="error">
    <p>此插件尚未安装，<span class="link" @click.stop="gotoMarket">点击前往插件市场</span>。</p>
  </k-comment>
</template>

<script lang="ts" setup>

import { store, router } from '@koishijs/client'
import { computed, provide } from 'vue'
import { SettingsData, Tree } from './utils'

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
const remote = computed(() => store.market?.data[name.value])
const hint = computed(() => local.value.workspace ? '，请检查源代码' : '，请联系插件作者')

function gotoMarket() {
  router.push('/market?keyword=' + props.current.label)
}

provide('manager.settings.local', local)
provide('manager.settings.config', config)
provide('manager.settings.current', computed(() => props.current))

const data = computed<SettingsData>(() => ({
  name: name.value,
  local: local.value,
  remote: remote.value,
  config: config.value,
  current: props.current,
}))

</script>

<style lang="scss">

.plugin-view {
  span.link {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }
}

</style>
