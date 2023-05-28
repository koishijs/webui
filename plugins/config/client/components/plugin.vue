<template>
  <template v-if="name">
    <k-comment v-if="!local.runtime">
      <p>正在加载插件配置……</p>
    </k-comment>
    <k-comment v-else-if="local.runtime.failed" type="danger">
      <p>插件加载失败，这可能是插件本身的问题所致。{{ hint }}</p>
    </k-comment>

    <k-slot v-else name="plugin-details" :data="data">
      <!-- reusability -->
      <k-slot-item :order="800">
        <k-comment v-if="local.runtime.id && !local.runtime.forkable && current.disabled" type="warning">
          <p>此插件已在运行且不可重用，启用可能会导致非预期的问题。</p>
        </k-comment>
      </k-slot-item>

      <!-- dependency -->
      <k-slot-item :order="600">
        <k-slot name="plugin-dependency" single :data="data">
          <k-comment
            v-for="({ required, active }, name) in env.peer" :key="name"
            :type="active ? 'success' : required ? 'warning' : 'primary'">
            <p>
              {{ required ? '必需' : '可选' }}依赖：{{ name }} ({{ active ? '已加载' : '未加载' }})
            </p>
          </k-comment>
          <k-comment
            v-for="({ required }, name) in env.using" :key="name"
            :type="store.services[name] ? 'success' : required ? 'warning' : 'primary'">
            <p>
              {{ required ? '必需' : '可选' }}服务：{{ name }} ({{ store.services[name] ? '已加载' : '未加载' }})
            </p>
          </k-comment>
        </k-slot>
      </k-slot-item>

      <!-- implements -->
      <k-slot-item :order="400">
        <template v-for="name in env.impl" :key="name">
          <k-comment v-if="store.services[name] && data.current.disabled" type="warning">
            <p>此插件将会提供 {{ name }} 服务，但此服务已被其他插件实现。</p>
          </k-comment>
          <k-comment v-else :type="data.current.disabled ? 'primary' : 'success'">
            <p>此插件{{ data.current.disabled ? '启用后将会提供' : '提供了' }} {{ name }} 服务。</p>
          </k-comment>
        </template>
      </k-slot-item>

      <!-- usage -->
      <k-slot-item :order="-200" v-if="local.runtime?.usage">
        <k-markdown unsafe class="usage" :source="local.runtime?.usage"></k-markdown>
      </k-slot-item>

      <!-- modifier -->
      <k-slot-item :order="-600">
        <k-modifier v-if="local.runtime.filter !== false" v-model="config"></k-modifier>
      </k-slot-item>

      <!-- config -->
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
    <k-slot name="plugin-missing" single>
      <k-comment type="danger">
        <p>此插件尚未安装。</p>
      </k-comment>
    </k-slot>
  </template>
</template>

<script lang="ts" setup>

import { store, send, useAction, message } from '@koishijs/client'
import { computed, provide, watch } from 'vue'
import { useRouter } from 'vue-router'
import { coreDeps, envMap, name, SettingsData, splitPath, Tree } from './utils'
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

const env = computed(() => envMap.value[name.value])
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
  env: env.value,
  name: name.value,
  local: local.value,
  config: config.value,
  current: props.current,
}))

const router = useRouter()

useAction('config.save', {
  disabled: () => !name.value,
  action: async () => {
    await execute(props.current.disabled ? 'unload' : 'reload')
    message.success(props.current.disabled ? '配置已保存。' : '配置已重载。')
  },
})

useAction('config.toggle', {
  disabled: () => !name.value || coreDeps.includes(name.value),
  action: async () => {
    await execute(props.current.disabled ? 'reload' : 'unload')
    message.success(props.current.disabled ? '插件已启用。' : '插件已停用。')
  },
})

async function execute(event: 'unload' | 'reload') {
  await send(`manager/${event}`, props.current.path, config.value, props.current.target)
  if (props.current.target) {
    const segments = splitPath(props.current.path)
    segments[segments.length - 1] = props.current.target
    router.replace('/plugins/' + segments.join('/'))
  }
}

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
