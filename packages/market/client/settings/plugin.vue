<template>
  <template v-if="name">
    <!-- reusability -->
    <k-comment v-if="local.id && !local.forkable && current.disabled" type="warning">
      <p>此插件已在运行且不可重用，启用可能会导致非预期的问题。</p>
    </k-comment>

    <!-- latest -->
    <k-comment v-if="hasUpdate">
      <p>当前的插件版本不是最新，<router-link to="/dependencies">点击前往依赖管理</router-link>。</p>
    </k-comment>

    <!-- external -->
    <k-comment type="warning" v-if="!local.workspace && store.dependencies && !store.dependencies[name]">
      <p>尚未将当前插件列入依赖，<a @click="send('market/install', { [name]: local.version })">点击添加</a>。</p>
    </k-comment>

    <!-- impl -->
    <template v-for="name in env.impl" :key="name">
      <k-comment v-if="deps[name] && current.disabled" type="warning">
        <p>此插件将会提供 {{ name }} 服务，但此服务已被其他插件实现。</p>
      </k-comment>
      <k-comment v-else :type="current.disabled ? 'primary' : 'success'">
        <p>此插件{{ current.disabled ? '将会提供' : '提供了' }} {{ name }} 服务。</p>
      </k-comment>
    </template>

    <!-- using -->
    <k-comment
      v-for="({ required, available }, name) in env.using" :key="name"
      :type="deps[name] ? 'success' : required ? 'warning' : 'primary'">
      <p>
        {{ required ? '必需' : '可选' }}服务：{{ name }}
        {{ deps[name] ? '(已加载)' : '(未加载，启用下列任一插件可实现此服务)' }}
      </p>
      <ul v-if="!deps[name]">
        <li v-for="name in available">
          <k-dep-link :name="name"></k-dep-link> (点击{{ name in store.packages ? '配置' : '添加' }})
        </li>
      </ul>
    </k-comment>

    <k-slot name="market-settings"></k-slot>

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

import { send, store, router } from '@koishijs/client'
import { computed, provide } from 'vue'
import { envMap, Tree } from './utils'
import KDepLink from './dep-link.vue'

const props = defineProps<{
  current: Tree
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const config = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const deps = computed(() => {
  if (!local.value) return {}
  const { required, optional, implements: impl } = local.value.manifest.service
  const deps = {}
  for (const name of [...required, ...optional, ...impl]) {
    deps[name] = store.services?.[name]
  }
  return deps
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
const remote = computed(() => store.market.data[name.value])
const env = computed(() => envMap.value[name.value])
const hint = computed(() => local.value.workspace ? '，请检查源代码' : '，请联系插件作者')

const hasUpdate = computed(() => {
  if (!remote.value?.versions || local.value.workspace) return
  return remote.value.version !== local.value.version
})

function gotoMarket() {
  router.push('/market?keyword=' + props.current.label)
}

provide('manager.settings.local', local)
provide('manager.settings.config', config)
provide('manager.settings.current', computed(() => props.current))

</script>

<style lang="scss">

.plugin-view {
  a {
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }

  .plugin-header .k-alias {
    font-size: 1.15rem;
    color: var(--fg3);
  }

  span.link {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }
}

</style>
