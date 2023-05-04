<template>
  <div class="navigation" v-if="data.remote">
    <a class="k-button" target="_blank"
      v-if="data.remote.links.homepage"
      :href="data.remote.links.homepage"
    >插件主页</a>
    <a class="k-button" target="_blank"
      v-if="data.remote.links.npm && data.local.version"
      :href="data.remote.links.npm + '/v/' + data.local.version"
    >当前版本：{{ data.local.version }}</a>
    <a class="k-button" target="_blank"
      v-if="data.remote.links.repository"
      :href="data.remote.links.repository"
    >存储库</a>
    <a class="k-button" target="_blank"
      v-if="data.remote.links.bugs"
      :href="data.remote.links.bugs"
    >问题反馈</a>
  </div>

  <!-- reusability -->
  <k-comment v-if="data.local.id && !data.local.forkable && data.current.disabled" type="warning">
    <p>此插件已在运行且不可重用，启用可能会导致非预期的问题。</p>
  </k-comment>

  <!-- latest -->
  <k-comment v-if="hasUpdate && !global.static">
    <p>当前的插件版本不是最新，<router-link to="/dependencies">点击前往依赖管理</router-link>。</p>
  </k-comment>

  <!-- deprecated -->
  <k-comment v-if="dep?.versions?.[dep?.resolved]?.deprecated" type="error">
    <p>此版本已废弃，请尽快迁移：{{ dep.versions[dep.resolved].deprecated }}</p>
  </k-comment>

  <!-- external -->
  <k-comment type="warning" v-if="!data.local.workspace && store.dependencies && !store.dependencies[data.name]">
    <p>尚未将当前插件列入依赖，<span class="link" @click="send('market/install', { [data.name]: data.local.version })">点击添加</span>。</p>
  </k-comment>

  <!-- impl -->
  <template v-for="name in env.impl" :key="name">
    <k-comment v-if="deps[name] && data.current.disabled" type="warning">
      <p>此插件将会提供 {{ name }} 服务，但此服务已被其他插件实现。</p>
    </k-comment>
    <k-comment v-else :type="data.current.disabled ? 'primary' : 'success'">
      <p>此插件{{ data.current.disabled ? '启用后将会提供' : '提供了' }} {{ name }} 服务。</p>
    </k-comment>
  </template>
  
  <!-- peer -->
  <k-comment
    v-for="({ required, active }, name) in env.peer" :key="name"
    :type="active ? 'success' : required ? 'warning' : 'primary'">
    <p>
      {{ required ? '必需' : '可选' }}依赖：<k-dep-link :name="name"></k-dep-link>
      <span v-if="active"> (已加载)</span>
      <span v-else-if="name in store.packages"> (点击配置)</span>
      <span v-else> (点击添加)</span>
    </p>
  </k-comment>

  <!-- using -->
  <k-comment
    v-for="({ required, available }, name) in env.using" :key="name"
    :type="deps[name] ? 'success' : required ? 'warning' : 'primary'">
    <p>
      {{ required ? '必需' : '可选' }}服务：{{ name }}
      <span v-if="deps[name]">(已加载)</span>
      <span v-else-if="available.length">(未加载，启用下列任一插件可实现此服务)</span>
      <span v-else>(未加载)</span>
    </p>
    <ul v-if="!deps[name] && available.length">
      <li v-for="name in available">
        <k-dep-link :name="name"></k-dep-link> (点击{{ name in store.packages ? '配置' : '添加' }})
      </li>
    </ul>
  </k-comment>
</template>

<script lang="ts" setup>

import { global, send, store } from '@koishijs/client'
import { computed } from 'vue'
import { gt } from 'semver'
import { envMap, SettingsData } from '../utils'
import KDepLink from '../dep-link.vue'

const props = defineProps<{
  data: SettingsData
}>()

const deps = computed(() => {
  if (!props.data.local) return {}
  const { required, optional, implements: impl } = props.data.local.manifest.service
  const deps = {}
  for (const name of [...required, ...optional, ...impl]) {
    deps[name] = store.services?.[name]
  }
  return deps
})

const dep = computed(() => store.dependencies[props.data.name])
const env = computed(() => envMap.value[props.data.name])

const hasUpdate = computed(() => {
  if (!props.data.remote?.versions || props.data.local.workspace) return
  try {
    return gt(props.data.remote.version, props.data.local.version)
  } catch {}
})

</script>

<style lang="scss">

.plugin-view {
  span.link {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .navigation {
    margin-bottom: 2rem;
    display: flex;
    gap: 0.5rem 1rem;
    flex-wrap: wrap;
  }
}

</style>
