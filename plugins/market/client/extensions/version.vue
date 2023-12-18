<template>
  <!-- navigation -->
  <div class="navigation" v-if="object">
    <a class="el-button" target="_blank"
      v-if="object.package.links.homepage"
      :href="object.package.links.homepage"
    >插件主页</a>
    <a class="el-button" target="_blank"
      v-if="object.package.links.npm && local.package.version"
      :href="object.package.links.npm + '/v/' + local.package.version"
    >当前版本：{{ local.package.version }}</a>
    <a class="el-button" target="_blank"
      v-if="object.package.links.repository"
      :href="object.package.links.repository"
    >存储库</a>
    <a class="el-button" target="_blank"
      v-if="object.package.links.bugs"
      :href="object.package.links.bugs"
    >问题反馈</a>
  </div>

  <!-- latest -->
  <k-comment v-if="hasUpdate(name) && !global.static">
    <p>当前的插件版本不是最新，<router-link to="/dependencies">点击前往依赖管理</router-link>。</p>
  </k-comment>

  <!-- deprecated -->
  <k-comment v-if="versions?.[dep?.resolved]?.deprecated" type="danger">
    <p>此版本已废弃，请尽快迁移：{{ versions[dep.resolved].deprecated }}</p>
  </k-comment>

  <!-- external -->
  <k-comment type="warning" v-if="!local.workspace && store.dependencies && !store.dependencies[name]">
    <p>尚未将当前插件列入依赖，<span class="k-link" @click="send('market/install', { [name]: local.package.version })">点击添加</span>。</p>
  </k-comment>
</template>

<script lang="ts" setup>

import { global, send, store } from '@koishijs/client'
import { computed, inject, ComputedRef } from 'vue'
import { hasUpdate } from '../utils'
import type {} from '@koishijs/plugin-config'

const name = inject<ComputedRef<string>>('plugin:name')

const local = computed(() => store.packages?.[name.value])
const object = computed(() => store.market.data?.[name.value])
const dep = computed(() => store.dependencies?.[name.value])
const versions = computed(() => store.registry?.[name.value])

</script>

<style lang="scss" scoped>

.navigation {
  margin-bottom: 2rem;
  display: flex;
  gap: 0.5rem 1rem;
  flex-wrap: wrap;
}

</style>
